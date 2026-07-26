import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useApp();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  const nameValid = name.trim().length > 0;
  const emailValid = email.trim().length > 0 && email.includes('@');
  const passwordValid = password.length >= 6;
  const confirmPasswordValid = confirmPassword === password;
  const isValid = nameValid && emailValid && passwordValid && confirmPasswordValid;

  async function handleSubmit(e) {
    e.preventDefault();
    setHasAttempted(true);
    setError('');

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      const pendingInvite = sessionStorage.getItem('splitmates_pending_invite');
      if (pendingInvite) {
        sessionStorage.removeItem('splitmates_pending_invite');
        navigate(`/join/${pendingInvite}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page flex flex-col justify-center items-center" id="register-page" style={{ minHeight: '85dvh' }}>
      <div className="card page-section" style={{ width: '100%', maxWidth: '380px', padding: '28px 24px' }}>
        {/* Branding */}
        <div className="text-center" style={{ marginBottom: '24px' }}>
          <div className="success-icon-wrapper" style={{ margin: '0 auto 12px auto', background: 'var(--accent-dim)', color: 'var(--accent)', width: '56px', height: '56px', fontSize: '1.5rem' }}>
            💸
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Join {t('appName')}</h1>
          <p className="text-secondary text-xs" style={{ marginTop: '4px' }}>{t('tagline')}</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="login-error" id="register-error">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="register-name">Full Name</label>
            <input
              className="input"
              id="register-name"
              type="text"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
            {hasAttempted && !nameValid && (
              <p className="text-negative text-xs" style={{ marginTop: '4px' }}>Name is required</p>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="register-email">Email</label>
            <input
              className="input"
              id="register-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {hasAttempted && !emailValid && (
              <p className="text-negative text-xs" style={{ marginTop: '4px' }}>
                {!email.trim() ? 'Email is required' : 'Enter a valid email address'}
              </p>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="register-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
              <p className="text-negative text-xs" style={{ marginTop: '4px' }}>
                Password must be at least 6 characters
              </p>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="register-confirm-password">Confirm Password</label>
            <input
              className="input"
              id="register-confirm-password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {hasAttempted && !confirmPasswordValid && (
              <p className="text-negative text-xs" style={{ marginTop: '4px' }}>Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full login-submit"
            disabled={isSubmitting}
            id="register-submit-btn"
            style={{ opacity: isSubmitting ? 0.55 : 1, marginTop: '8px' }}
          >
            {isSubmitting ? (
              t('loading')
            ) : (
              <>
                <UserPlus size={18} /> Sign Up
              </>
            )}
          </button>
        </form>

        <p className="login-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
