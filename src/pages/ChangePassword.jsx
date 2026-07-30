import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { changePassword } = useApp();
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  // Client Validation Rules
  function validate() {
    if (!currentPassword) return 'Current password is required';
    if (!newPassword) return 'New password is required';
    if (newPassword.length < 8) return 'Password must be at least 8 characters';
    if (currentPassword === newPassword) return 'New password must not equal current password';
    if (!confirmPassword) return 'Please confirm your new password';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setHasAttempted(true);
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to update password. Current password is incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page flex flex-col items-center" id="change-password-page">
      <div className="w-full" style={{ maxWidth: '430px' }}>
        {/* Header */}
        <div className="page-header flex items-center justify-between" style={{ paddingBottom: '16px' }}>
          <button
            className="btn-icon"
            onClick={() => navigate('/profile')}
            id="change-password-back-btn"
            aria-label="Back to Profile"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Change Password
          </h1>
          <div style={{ width: '42px' }} />
        </div>

        {/* Card Form */}
        <div className="card page-section" style={{ padding: '24px' }}>
          <div className="flex items-center gap-12" style={{ marginBottom: '20px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <KeyRound size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Account Security
              </h2>
              <p className="text-secondary text-xs" style={{ marginTop: '2px' }}>
                Update your account password
              </p>
            </div>
          </div>

          {/* Error Alert */}
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
              id="change-password-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-16" id="change-password-form">
            {/* Current Password */}
            <div className="input-group">
              <label htmlFor="current-password">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  id="current-password"
                  name="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-required="true"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="btn-ghost"
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '6px' }}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="input-group">
              <label htmlFor="new-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  id="new-password"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-required="true"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="btn-ghost"
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '6px' }}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="input-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-required="true"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="btn-ghost"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '6px' }}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full mt-8"
              disabled={isSubmitting}
              id="update-password-btn"
              style={{ fontWeight: 700, opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
