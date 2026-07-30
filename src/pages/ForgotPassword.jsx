import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword } = useApp();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [demoToken, setDemoToken] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      setSubmitted(true);
      if (res?.resetToken) {
        setDemoToken(res.resetToken);
      }
    } catch (err) {
      // Always prevent email enumeration unless rate limit or network error
      setError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page flex flex-col justify-center items-center" id="forgot-password-page" style={{ minHeight: '85dvh' }}>
      <div className="card page-section" style={{ width: '100%', maxWidth: '390px', padding: '28px 24px' }}>
        {/* Top Back Link */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="btn-ghost flex items-center gap-6 text-secondary text-xs fw-600"
            onClick={() => navigate('/login')}
            id="forgot-back-login-btn"
            style={{ padding: 0 }}
          >
            <ArrowLeft size={16} /> Back to Login
          </button>
        </div>

        {/* Branding Icon */}
        <div className="text-center" style={{ marginBottom: '20px' }}>
          <div
            style={{
              margin: '0 auto 12px auto',
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mail size={24} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Reset Password
          </h1>
          <p className="text-secondary text-xs" style={{ marginTop: '6px', lineHeight: 1.4 }}>
            Enter your account email and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Success Confirmation State */}
        {submitted ? (
          <div className="text-center flex flex-col items-center gap-12" id="forgot-password-success">
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(204, 255, 0, 0.08)',
                border: '1px solid var(--accent)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              <CheckCircle2 size={28} style={{ color: 'var(--accent)', margin: '0 auto 8px auto' }} />
              <p className="fw-600" style={{ color: 'var(--accent)', marginBottom: '4px' }}>
                Reset Request Sent
              </p>
              <p className="text-secondary text-xs">
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
              </p>
            </div>

            {demoToken && (
              <div className="card mt-12 w-full text-left" style={{ padding: '12px', background: 'var(--bg-input)' }}>
                <p className="text-xs text-secondary fw-600" style={{ marginBottom: '4px' }}>
                  🔑 Dev Helper (Simulation Link):
                </p>
                <Link
                  to={`/reset-password/${demoToken}`}
                  className="text-xs text-accent"
                  style={{ wordBreak: 'break-all', fontWeight: 700 }}
                >
                  /reset-password/{demoToken}
                </Link>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-full mt-12"
              onClick={() => navigate('/login')}
              id="back-to-login-btn"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="flex flex-col gap-16" id="forgot-password-form">
            {error && (
              <div
                className="card"
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 71, 87, 0.08)',
                  border: '1px solid var(--negative)',
                  color: 'var(--negative)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                }}
                id="forgot-password-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="forgot-email">Email Address</label>
              <input
                className="input"
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full mt-4"
              disabled={isSubmitting}
              id="send-reset-btn"
              style={{ fontWeight: 700, opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
