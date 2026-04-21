import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, Product, CartItem } from './types';

// Components
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

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
import About from './pages/About';
import Contact from './pages/Contact';
import ShippingPolicy from './pages/ShippingPolicy';
import ReturnsExchanges from './pages/ReturnsExchanges';
import FAQs from './pages/FAQs';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Verify from './pages/Verify';
import AuthAction from './pages/AuthAction';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');

  // Auth Listener
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        // Fetch user profile
        const userDoc = doc(db, 'users', firebaseUser.uid);
        unsubProfile = onSnapshot(userDoc, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Sync verification status if needed
            if (firebaseUser.emailVerified && !data.verified) {
              updateDoc(userDoc, { verified: true }).catch(err => {
                console.error('Failed to sync verification status:', err);
              });
            }

            setUser({
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
            } as UserProfile);
          } else {
            // If profile doesn't exist yet (e.g. during signup), set basic info
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'user',
              createdAt: new Date().toISOString()
            });
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Products Listener
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
        };
      }) as Product[];
      setProducts(productsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  // Cart Management
  const addToCart = (product: Product, selectedSize: string) => {
    if (!user) {
      setAuthModalMessage('Please login to add items to your cart and start shopping.');
      setIsAuthModalOpen(true);
      return;
    }
    setCart(prevCart => {
      const cartKey = `${product.id}-${selectedSize}`;
      const existingItem = prevCart.find(item => `${item.productId}-${item.selectedSize}` === cartKey);
      
      if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) {
          alert(`Only ${product.stock} units available in stock.`);
          return prevCart;
        }
        return prevCart.map(item =>
          `${item.productId}-${item.selectedSize}` === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.stock <= 0) {
        alert("This product is currently out of stock.");
        return prevCart;
      }
      return [...prevCart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: 1,
        selectedSize: selectedSize
      }];
    });
  };

  const removeFromCart = (productId: string, selectedSize: string) => {
    setCart(prevCart => prevCart.filter(item => !(item.productId === productId && item.selectedSize === selectedSize)));
  };

  const updateQuantity = (productId: string, selectedSize: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      alert(`Only ${product.stock} units available in stock.`);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        (item.productId === productId && item.selectedSize === selectedSize) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      setAuthModalMessage('Please login to save items to your favorites.');
      setIsAuthModalOpen(true);
      return;
    }
    const favorites = user.favorites || [];
    const isFavorite = favorites.includes(productId);
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];

    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: user.role,
        favorites: newFavorites,
        createdAt: user.createdAt || new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
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
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        <Navbar user={user} cartCount={cartCount} />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          message={authModalMessage} 
        />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <Home 
                products={products} 
                favorites={user?.favorites || []}
                onToggleFavorite={toggleFavorite}
              />
            } />
            <Route path="/products" element={
              <Products 
                products={products} 
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
                  onToggleFavorite={toggleFavorite} 
                />
              ) : (
                <Navigate to="/login" />
              )
            } />
            <Route path="/cart" element={<Cart cart={cart} products={products} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
            <Route path="/checkout" element={user ? <Checkout cart={cart} user={user} clearCart={clearCart} /> : <Navigate to="/login" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <Admin products={products} /> : <Navigate to="/" />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/returns-exchanges" element={<ReturnsExchanges />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/auth-action" element={<AuthAction />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
