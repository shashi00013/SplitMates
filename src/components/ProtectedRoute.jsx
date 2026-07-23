import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthReady } = useApp();

  if (!isAuthReady) {
    return (
      <div className="page flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <p className="text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
