import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, verifyResetToken } = useApp();
  const { t } = useLanguage();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setTokenValid(false);
          setIsVerifying(false);
        }
        return;
      }
      try {
        const res = await verifyResetToken(token);
        if (isMounted) {
          setTokenValid(res?.valid !== false);
          setIsVerifying(false);
        }
      } catch (err) {
        if (isMounted) {
          setTokenValid(false);
          setIsVerifying(false);
        }
      }
    }
    checkToken();
    return () => { isMounted = false; };
  }, [token, verifyResetToken]);

  function validate() {
    if (!newPassword) return 'New password is required';
    if (newPassword.length < 8) return 'Password must be at least 8 characters';
    if (!confirmPassword) return 'Please confirm your password';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isVerifying) {
    return (
      <div className="page flex items-center justify-center" style={{ minHeight: '85dvh' }}>
        <div className="text-center">
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px auto',
            }}
          />
          <p className="text-secondary text-xs fw-600">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="page flex flex-col justify-center items-center" id="reset-password-invalid-page" style={{ minHeight: '85dvh' }}>
        <div className="card page-section text-center" style={{ width: '100%', maxWidth: '390px', padding: '32px 24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(255, 71, 87, 0.1)',
              color: 'var(--negative)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <AlertCircle size={26} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Link Expired or Invalid
          </h1>
          <p className="text-secondary text-xs" style={{ marginBottom: '24px', lineHeight: 1.5 }}>
            This password reset link is invalid or has expired after 15 minutes. Please request a new reset link.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={() => navigate('/forgot-password')}
            id="request-new-reset-link-btn"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page flex flex-col justify-center items-center" id="reset-password-page" style={{ minHeight: '85dvh' }}>
      <div className="card page-section" style={{ width: '100%', maxWidth: '390px', padding: '28px 24px' }}>
        <div className="text-center" style={{ marginBottom: '24px' }}>
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
            <Lock size={24} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Set New Password
          </h1>
          <p className="text-secondary text-xs" style={{ marginTop: '4px' }}>
            Please enter your new password below.
          </p>
        </div>

        {error && (
          <div
            className="card"
            style={{
              padding: '12px 16px',
              marginBottom: '20px',
              background: 'rgba(255, 71, 87, 0.08)',
              border: '1px solid var(--negative)',
              color: 'var(--negative)',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
            }}
            id="reset-password-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-16" id="reset-password-form">
          <div className="input-group">
            <label htmlFor="reset-new-password">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                id="reset-new-password"
                type={showNew ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                autoFocus
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="btn-ghost"
                aria-label={showNew ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '6px' }}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reset-confirm-password">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                id="reset-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="btn-ghost"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '6px' }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full mt-4"
            disabled={isSubmitting}
            id="reset-submit-btn"
            style={{ fontWeight: 700, opacity: isSubmitting ? 0.6 : 1 }}
          >
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
