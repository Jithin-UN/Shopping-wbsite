import React from 'react';
import { RefreshCcw, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

export default function ReturnsExchanges() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Returns & Exchanges</h1>
        <p className="text-lg text-gray-500">We want you to love your dress. If it's not perfect, we're here to help.</p>
      </div>

      <div className="space-y-12">
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
              <RefreshCcw size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Our Return Policy</h2>
          </div>
          <div className="prose prose-indigo text-gray-600 max-w-none">
            <p className="mb-4">You have 30 days from the date of delivery to return your items for a full refund or exchange. To be eligible for a return:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Items must be unworn, unwashed, and in their original condition.</li>
              <li>All original tags must be attached.</li>
              <li>The original packaging should be included if possible.</li>
              <li>Proof of purchase (order number) is required.</li>
            </ul>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
              <CheckCircle size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">How to Start a Return</h2>
          </div>
          <div className="prose prose-indigo text-gray-600 max-w-none">
            <ol className="list-decimal pl-6 space-y-4">
              <li>Visit our <strong>Returns Portal</strong> and enter your order number and email address.</li>
              <li>Select the items you wish to return or exchange and provide a reason.</li>
              <li>Print the prepaid shipping label provided and attach it to your package.</li>
              <li>Drop off the package at any authorized shipping location.</li>
            </ol>
            <p className="mt-6 text-sm italic">Note: A return shipping fee of ₹150 will be deducted from your refund unless the return is due to a defective item or shipping error.</p>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Non-Returnable Items</h2>
          </div>
          <div className="prose prose-indigo text-gray-600 max-w-none">
            <p className="mb-4">The following items cannot be returned or exchanged:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Final Sale items (marked as non-returnable on the product page).</li>
              <li>Intimates and swimwear (for hygiene reasons).</li>
              <li>Gift cards.</li>
              <li>Items returned after the 30-day window.</li>
            </ul>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
          <HelpCircle size={48} className="text-indigo-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Help?</h2>
          <p className="text-gray-600 mb-8">Our customer support team is available 24/7 to assist you with any questions regarding returns or exchanges.</p>
          <a 
            href="/contact" 
            className="inline-block px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Contact Support
          </a>
        </section>
      </div>
    </div>
  );
}
