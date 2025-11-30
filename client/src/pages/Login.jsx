import React from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, loading, error } = useAuth();

  const handlePurchase = () => {
    // Redirect to the purchase endpoint.
    // The backend will handle authentication if the user is not logged in.
    window.location.href = '/subs/purchase/pro';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🤖</span>
              <span className="font-bold text-xl text-gray-800">BotInteligente</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={login}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Log In
              </button>
              <button 
                onClick={handlePurchase}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto pt-16 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Automate your sales with</span>
            <span className="block text-blue-600">Intelligent WhatsApp Bots</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Capture leads, qualify customers, and close sales 24/7. Our AI-powered bots handle the conversation so you can focus on growing your business.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <button
                onClick={handlePurchase}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Start Free Trial
              </button>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <button
                onClick={login}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Live Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to scale
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-2xl">
                  ⚡
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Instant Setup</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Connect your WhatsApp number via QR code and start automating in seconds. No coding required.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-2xl">
                  🧠
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">AI Powered</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Our bots understand context and intent, providing natural responses that convert leads into customers.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-2xl">
                  📊
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Real-time Analytics</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Track performance, monitor conversations, and gain insights with our comprehensive dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="mt-10 max-w-lg mx-auto grid gap-5 lg:grid-cols-2 lg:max-w-none">
            {/* Free Plan */}
            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
                <div>
                  <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-gray-100 text-gray-800">
                    Starter
                  </h3>
                </div>
                <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900">
                  Free
                </div>
                <p className="mt-5 text-lg text-gray-500">
                  Perfect for testing and small businesses just getting started.
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 space-y-6 sm:p-10 sm:pt-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 text-green-500">✓</div>
                    <p className="ml-3 text-base text-gray-700">1 Active Bot</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 text-green-500">✓</div>
                    <p className="ml-3 text-base text-gray-700">100 Leads/month</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 text-green-500">✓</div>
                    <p className="ml-3 text-base text-gray-700">Basic Automation</p>
                  </li>
                </ul>
                <div className="rounded-md shadow">
                  <button
                    onClick={login}
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 w-full"
                  >
                    Start for Free
                  </button>
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden border-2 border-blue-500 relative">
              <div className="absolute top-0 right-0 -mr-1 -mt-1 w-32 h-32 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-1 -mt-1 w-32 h-32 bg-blue-600 transform rotate-45 translate-x-16 -translate-y-16"></div>
              </div>
              <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
                <div>
                  <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-blue-100 text-blue-600">
                    Pro
                  </h3>
                </div>
                <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900">
                  $29
                  <span className="ml-1 text-2xl font-medium text-gray-500">/mo</span>
                </div>
                <p className="mt-5 text-lg text-gray-500">
                  For growing businesses that need power and flexibility.
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 space-y-6 sm:p-10 sm:pt-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 text-green-500">✓</div>
                    <p className="ml-3 text-base text-gray-700"><strong>Unlimited</strong> Bots</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 text-green-500">✓</div>
                    <p className="ml-3 text-base text-gray-700"><strong>Unlimited</strong> Leads</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 text-green-500">✓</div>
                    <p className="ml-3 text-base text-gray-700">AI Image Generation</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 text-green-500">✓</div>
                    <p className="ml-3 text-base text-gray-700">Advanced Analytics</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 text-green-500">✓</div>
                    <p className="ml-3 text-base text-gray-700">Priority Support</p>
                  </li>
                </ul>
                <div className="rounded-md shadow">
                  <button
                    onClick={handlePurchase}
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🤖</span>
              <span className="font-bold text-xl">BotInteligente</span>
            </div>
            <p className="text-gray-400 text-sm">
              &copy; 2024 BotInteligente. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Login;