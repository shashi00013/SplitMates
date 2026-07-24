import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  const emailValid = email.trim().length > 0;
  const passwordValid = password.length > 0;
  const isValid = emailValid && passwordValid;

  async function handleSubmit(e) {
    e.preventDefault();
    setHasAttempted(true);
    setError('');

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      const pendingInvite = sessionStorage.getItem('splitmates_pending_invite');
      if (pendingInvite) {
        sessionStorage.removeItem('splitmates_pending_invite');
        navigate(`/join/${pendingInvite}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page" id="login-page">
      <div className="login-container">
        {/* Branding */}
        <div className="login-brand">
          <div className="login-logo-wrapper">
            <span className="login-logo-icon">💸</span>
          </div>
          <h1 className="login-title">{t('appName')}</h1>
          <p className="login-subtitle">{t('tagline')}</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="login-error" id="login-error">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <input
              className="input"
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            {hasAttempted && !emailValid && (
              <p className="text-negative text-xs" style={{ marginTop: '4px' }}>Email is required</p>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="login-eye-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {hasAttempted && !passwordValid && (
              <p className="text-negative text-xs" style={{ marginTop: '4px' }}>Password is required</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full login-submit"
            disabled={isSubmitting}
            id="login-submit-btn"
            style={{ opacity: isSubmitting ? 0.55 : 1 }}
          >
            {isSubmitting ? (
              t('loading')
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <p className="login-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
