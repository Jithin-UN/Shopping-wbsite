import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Product, CartItem } from './types';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Favorites from './pages/Favorites';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile
        const userDoc = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userDoc, (docSnap) => {
          const isAdminEmail = firebaseUser.email?.toLowerCase() === 'jithinullodi@gmail.com';
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setUser({
              ...data,
              role: isAdminEmail ? 'admin' : data.role
            });
          } else {
            // If profile doesn't exist yet (e.g. during signup), set basic info
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isAdminEmail ? 'admin' : 'user',
              createdAt: new Date().toISOString()
            });
          }
          setLoading(false);
        });
        return () => unsubProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Products Listener
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    });

    return () => unsubscribe();
  }, []);

  // Cart Management
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: 1
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = async (productId: string) => {
    if (!user) return;
    const favorites = user.favorites || [];
    const isFavorite = favorites.includes(productId);
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        favorites: newFavorites
      });
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        <Navbar user={user} cartCount={cartCount} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <Home 
                products={products} 
                onAddToCart={addToCart} 
                favorites={user?.favorites || []}
                onToggleFavorite={toggleFavorite}
              />
            } />
            <Route path="/products" element={
              <Products 
                products={products} 
                onAddToCart={addToCart} 
                favorites={user?.favorites || []}
                onToggleFavorite={toggleFavorite}
              />
            } />
            <Route path="/product/:id" element={
              <ProductDetails 
                products={products} 
                onAddToCart={addToCart} 
                favorites={user?.favorites || []}
                onToggleFavorite={toggleFavorite}
              />
            } />
            <Route path="/favorites" element={
              user ? (
                <Favorites 
                  products={products} 
                  favorites={user.favorites || []} 
                  onAddToCart={addToCart} 
                  onToggleFavorite={toggleFavorite} 
                />
              ) : (
                <Navigate to="/login" />
              )
            } />
            <Route path="/cart" element={<Cart cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
            <Route path="/checkout" element={user ? <Checkout cart={cart} user={user} clearCart={clearCart} /> : <Navigate to="/login" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <Admin products={products} /> : <Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
