import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-lg text-gray-500">Your privacy is important to us. This policy explains how we handle your data.</p>
      </div>

      <div className="prose prose-indigo text-gray-600 max-w-none space-y-8">
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
          <p>We collect information from you when you register on our site, place an order, or subscribe to our newsletter. When ordering or registering on our site, as appropriate, you may be asked to enter your: name, e-mail address, mailing address, phone number or credit card information.</p>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use of Information</h2>
          <p>Any of the information we collect from you may be used in one of the following ways:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>To personalize your experience</li>
            <li>To improve our website</li>
            <li>To improve customer service</li>
            <li>To process transactions</li>
            <li>To send periodic emails</li>
          </ul>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Protection of Information</h2>
          <p>We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information. We offer the use of a secure server.</p>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cookies</h2>
          <p>Yes, we use cookies to help us remember and process the items in your shopping cart, understand and save your preferences for future visits and keep track of advertisements.</p>
        </section>
      </div>
    </div>
  );
}
