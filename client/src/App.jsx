import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BotsProvider } from './context/BotsContext';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ui/ErrorBoundary';

// --- Lazy Loading for Performance Optimization ---
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SalesPanelEnhanced = lazy(() => import('./pages/SalesPanelEnhanced'));
const Login = lazy(() => import('./pages/Login'));
const PrivacyPortal = lazy(() => import('./pages/PrivacyPortal'));

// --- Atomic UI Components ---

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" role="status" aria-label="Loading application">
    <div className="relative w-16 h-16 mb-4">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="text-gray-500 font-medium animate-pulse">Loading experience...</p>
  </div>
);

// --- Paywall & Upselling View ---

const PaywallView = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-2">Unlock Pro Power</h2>
          <p className="text-blue-100">This feature is exclusive to Premium members.</p>
        </div>
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Free Plan</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Basic Dashboard Access</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 1 Active Bot</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Pro Plan
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.81 14.12L5.64 11.3l8.49 8.49-2.83 2.83zm4.24-4.24l1.41 1.41L4.93 19.34l-1.41-1.41 3.53-3.57zM19.07 4.93l-1.41 1.41-3.53-3.57-1.41-1.41 3.53 3.57 1.41 1.41zm-4.24 4.24l1.41 1.41-3.53 3.57-1.41-1.41 3.53-3.57z"/>
                </svg>
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Advanced Sales Panel</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Unlimited Bots</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Real-time Analytics</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:-translate-y-0.5 cursor-pointer">
              Upgrade to Pro Now
            </button>
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 text-sm font-medium cursor-pointer">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Security Guards (HOCs) ---

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const RequirePro = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Subscription logic simulation
  // Assuming user.plan or user.role determines access. Defaulting to false if not present.
  const isPro = user?.plan === 'pro' || user?.role === 'admin'; 

  if (loading) return <LoadingScreen />;

  if (!isPro) {
    return <PaywallView />;
  }

  return children;
};

// --- Layout Architecture ---

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getActivePage = (path) => {
    if (path.includes('sales')) return 'sales';
    if (path.includes('bots')) return 'bots';
    if (path.includes('privacy')) return 'privacy';
    return 'dashboard';
  };

  const handlePageChange = (pageId) => {
    const routes = {
      sales: '/sales',
      bots: '/dashboard',
      dashboard: '/dashboard',
      privacy: '/privacy',
    };
    navigate(routes[pageId] || '/dashboard');
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar
        activePage={getActivePage(location.pathname)}
        onPageChange={handlePageChange}
      />
      <main
        className="flex-1 overflow-y-auto relative focus:outline-none bg-slate-950 lg:ml-0"
        id="main-content"
        tabIndex="-1"
      >
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

// --- Main Application ---

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/pricing" element={<PaywallView />} />

      {/* Protected Routes (Require Auth) */}
      <Route element={
        <RequireAuth>
          <DashboardLayout />
        </RequireAuth>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/privacy" element={<PrivacyPortal />} />
        
        {/* Gated Content (Require Pro) */}
        <Route path="/sales" element={
          <RequirePro>
            <SalesPanelEnhanced />
          </RequirePro>
        } />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BotsProvider>
          <AppContent />
        </BotsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
