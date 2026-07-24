import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

// Direct import for main landing page (Fastest First Contentful Paint)
import Home from './pages/Home';

// Route-level Code Splitting & Lazy Loading for Secondary Pages
const Groups = lazy(() => import('./pages/Groups'));
const GroupDetails = lazy(() => import('./pages/GroupDetails'));
const AddExpense = lazy(() => import('./pages/AddExpense'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Settlement = lazy(() => import('./pages/Settlement'));
const SettlementSuccess = lazy(() => import('./pages/SettlementSuccess'));
const Profile = lazy(() => import('./pages/Profile'));
const History = lazy(() => import('./pages/History'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const BalanceBreakdown = lazy(() => import('./pages/BalanceBreakdown'));
const JoinGroupFlow = lazy(() => import('./pages/JoinGroupFlow'));
const JoinGroupConfirm = lazy(() => import('./pages/JoinGroupConfirm'));

// Skeleton loader for instant route transitions
function PageLoader() {
  return (
    <div className="page flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <div className="text-center">
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px auto'
        }} />
        <p className="text-secondary text-xs fw-600">Loading SplitMates...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { toast, isAuthenticated } = useApp();
  const location = useLocation();

  // Hide bottom nav on auth pages, settlement-success page, or when unauthenticated
  const hideNav =
    !isAuthenticated ||
    ['/login', '/register', '/settlement-success', '/join'].some((p) => location.pathname.startsWith(p));

  return (
    <div className="app-shell">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public-only routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* Join Group Invite Route */}
          <Route path="/join/:inviteCode" element={<JoinGroupConfirm />} />

          {/* Protected application routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/balance-breakdown" element={<BalanceBreakdown />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/join" element={<JoinGroupFlow />} />
            <Route path="/join-group" element={<JoinGroupFlow />} />
            <Route path="/group/:groupId" element={<GroupDetails />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/settle/:groupId" element={<Settlement />} />
            <Route path="/settlement-success/:groupId" element={<SettlementSuccess />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback route */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>

      {!hideNav && <BottomNav />}

      {/* Toast notification */}
      {toast && <div className="toast" id="toast-notification">{toast}</div>}
    </div>
  );
}
