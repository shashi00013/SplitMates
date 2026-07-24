import { Routes, Route, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import AddExpense from './pages/AddExpense';
import Expenses from './pages/Expenses';
import Settlement from './pages/Settlement';
import SettlementSuccess from './pages/SettlementSuccess';
import Profile from './pages/Profile';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

import BalanceBreakdown from './pages/BalanceBreakdown';
import JoinGroupFlow from './pages/JoinGroupFlow';

export default function App() {
  const { toast, isAuthenticated } = useApp();
  const location = useLocation();

  // Hide bottom nav on auth pages, settlement-success page, or when unauthenticated
  const hideNav =
    !isAuthenticated ||
    ['/login', '/register', '/settlement-success', '/join'].some((p) => location.pathname.startsWith(p));

  return (
    <div className="app-shell">
      <Routes>
        {/* Public-only routes (accessible only when logged out) */}
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

      {!hideNav && <BottomNav />}

      {/* Toast notification */}
      {toast && <div className="toast" id="toast-notification">{toast}</div>}
    </div>
  );
}
