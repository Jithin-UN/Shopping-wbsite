import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer id="footer" className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold text-indigo-600 mb-6">Prathiss</h3>
            <p className="text-gray-500 leading-relaxed mb-6">
              Discover the perfect dress for every occasion. Our collection combines timeless elegance with modern trends.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><Twitter size={20} /></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Shop</h4>
            <ul className="space-y-4">
              <li><Link to="/products?category=Casual" className="text-gray-500 hover:text-indigo-600 transition-colors">Casual Dresses</Link></li>
              <li><Link to="/products?category=Formal" className="text-gray-500 hover:text-indigo-600 transition-colors">Formal Wear</Link></li>
              <li><Link to="/products?category=Party" className="text-gray-500 hover:text-indigo-600 transition-colors">Party Dresses</Link></li>
              <li><Link to="/products" className="text-gray-500 hover:text-indigo-600 transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link to="/shipping-policy" className="text-gray-500 hover:text-indigo-600 transition-colors">Shipping Policy</Link></li>
              <li><Link to="/returns-exchanges" className="text-gray-500 hover:text-indigo-600 transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/faqs" className="text-gray-500 hover:text-indigo-600 transition-colors">FAQs</Link></li>
              <li><Link to="/contact" className="text-gray-500 hover:text-indigo-600 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-gray-500">
                <MapPin size={18} className="text-indigo-600 mt-1 flex-shrink-0" />
                <span>123 Fashion Street, New York, NY 10001</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-500">
                <Phone size={18} className="text-indigo-600 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-500">
                <Mail size={18} className="text-indigo-600 flex-shrink-0" />
                <span>support@prathiss.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2026 Prathiss. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
