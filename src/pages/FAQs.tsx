import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Orders',
    question: 'How can I track my order?',
    answer: 'Once your order ships, you will receive an email with a tracking number and a link to the carrier\'s website. You can also track your order in your account profile under "Order History".'
  },
  {
    category: 'Orders',
    question: 'Can I change or cancel my order?',
    answer: 'We process orders quickly, but we will do our best to accommodate changes if the order hasn\'t shipped yet. Please contact our support team immediately with your order number.'
  },
  {
    category: 'Shipping',
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship to over 50 countries worldwide. Shipping costs and delivery times vary by destination and are calculated at checkout.'
  },
  {
    category: 'Shipping',
    question: 'How long will it take to receive my order?',
    answer: 'Standard shipping typically takes 5-7 business days. Express shipping takes 2-3 business days. International orders can take 10-15 business days depending on the destination.'
  },
  {
    category: 'Returns',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy for most items. Items must be in original condition with tags attached. Please see our Returns & Exchanges page for full details.'
  },
  {
    category: 'Products',
    question: 'How do I know what size to order?',
    answer: 'We provide a detailed size guide on every product page. If you are between sizes, we generally recommend sizing up for a more comfortable fit.'
  },
  {
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay.'
  }
];

export default function FAQs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-500">Find answers to common questions about our products and services.</p>
      </div>

      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search for questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <div key={index} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none"
              >
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1 block">{faq.category}</span>
                  <h3 className="text-lg font-bold text-gray-900">{faq.question}</h3>
                </div>
                {openIndex === index ? <ChevronUp size={20} className="text-indigo-600" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <HelpCircle size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No results found for "{searchTerm}". Please try a different search term.</p>
          </div>
        )}
      </div>

      <div className="mt-16 bg-indigo-600 rounded-3xl p-12 text-center text-white shadow-xl shadow-indigo-100">
        <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
        <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">If you couldn't find the answer you were looking for, please don't hesitate to reach out to our friendly support team.</p>
        <a 
          href="/contact" 
          className="inline-block px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}
