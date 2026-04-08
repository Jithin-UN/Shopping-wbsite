import React from 'react';
import { Truck, Globe, Clock, ShieldCheck } from 'lucide-react';

export default function ShippingPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Policy</h1>
        <p className="text-lg text-gray-500">Everything you need to know about how we get your dresses to you.</p>
      </div>

      <div className="space-y-12">
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
              <Truck size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Shipping Methods & Costs</h2>
          </div>
          <div className="prose prose-indigo text-gray-600 max-w-none">
            <p className="mb-4">We offer several shipping options to meet your needs:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Standard Shipping:</strong> Free on orders over ₹2,000. For orders under ₹2,000, a flat rate of ₹100 applies.</li>
              <li><strong>Express Shipping:</strong> ₹250 flat rate. Guaranteed delivery within 2-3 business days.</li>
              <li><strong>International Shipping:</strong> Rates vary by destination and are calculated at checkout.</li>
            </ul>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
              <Clock size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Processing Time</h2>
          </div>
          <div className="prose prose-indigo text-gray-600 max-w-none">
            <p>Orders are typically processed within 1-2 business days. During peak seasons or sales events, processing may take up to 3-4 business days. You will receive a confirmation email with tracking information as soon as your order ships.</p>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
              <Globe size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Tracking Your Order</h2>
          </div>
          <div className="prose prose-indigo text-gray-600 max-w-none">
            <p>Once your order has shipped, you will receive an email with a tracking number and a link to track your package. You can also track your order status in your account profile under "Order History".</p>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Shipping Restrictions</h2>
          </div>
          <div className="prose prose-indigo text-gray-600 max-w-none">
            <p>Please note that we cannot ship to P.O. Boxes or APO/FPO addresses. We currently ship to over 50 countries worldwide. If your country is not listed at checkout, please contact our support team.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
