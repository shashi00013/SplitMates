import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link2, AlertCircle, ArrowLeft, CheckCircle2, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

export default function JoinGroupConfirm() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, groups, joinGroup, showToast, isAuthenticated } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated && inviteCode) {
      sessionStorage.setItem('splitmates_pending_invite', inviteCode);
      showToast('Please log in or register to join this group.');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, inviteCode, navigate, showToast]);

  if (!isAuthenticated) {
    return null;
  }

  const existingGroup = groups.find((g) => g.inviteCode === inviteCode);

  async function handleConfirmJoin() {
    if (!inviteCode || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const resultGroup = await joinGroup(inviteCode);
      if (resultGroup?.id) {
        showToast(`Successfully joined ${resultGroup.name}! 🎉`);
        navigate(`/group/${resultGroup.id}`, { replace: true });
      } else {
        throw new Error('Failed to join group.');
      }
    } catch (err) {
      setError(err.message || 'Invalid group code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page flex flex-col items-center justify-center" style={{ minHeight: '85vh', padding: '20px' }} id="join-group-confirm-page">
      <div
        className="card"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '28px 24px',
          maxWidth: '420px',
          width: '100%',
          border: '1px solid #333333',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top Navigation */}
        <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
          <button
            className="btn-icon"
            onClick={() => navigate('/')}
            id="join-confirm-back-btn"
            style={{ color: '#888888' }}
          >
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Group Invitation
          </span>
          <div style={{ width: '20px' }} />
        </div>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center" style={{ marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(163, 230, 53, 0.12)',
              color: '#A3E635',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}
          >
            <Link2 size={32} />
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0', color: '#FFFFFF' }}>
            {t('joinAGroup')}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#888888', margin: 0 }}>
            {t('joinGroupDesc')}
          </p>
        </div>

        {/* Group Code Badge Box */}
        <div
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-light)',
            borderRadius: '14px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
          id="confirm-invite-code-box"
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('groupCode')}
          </span>
          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              color: 'var(--accent)',
              marginTop: '4px',
              wordBreak: 'break-all',
            }}
            id="confirm-invite-code-value"
          >
            {inviteCode}
          </div>
        </div>

        {/* Logged in User Badge */}
        {user && (
          <div
            style={{
              background: 'var(--bg-elevated)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <UserCheck size={18} style={{ color: 'var(--accent)' }} />
            <div style={{ fontSize: '0.8rem', textAlign: 'left' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Joining as</span>
              <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong> ({user.email})
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(255, 59, 48, 0.1)',
              border: '1px solid var(--negative)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            id="join-group-error-alert"
          >
            <AlertCircle size={18} style={{ color: 'var(--negative)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--negative)', margin: 0, fontWeight: 500 }}>
              {error}
            </p>
          </div>
        )}

        {/* Already a member notice */}
        {existingGroup ? (
          <div className="flex flex-col gap-12 text-center">
            <div
              style={{
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--accent)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} /> {t('alreadyMember')}
            </div>
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate(`/group/${existingGroup.id}`, { replace: true })}
              id="already-member-go-group-btn"
              style={{ marginTop: '6px' }}
            >
              Go to Group
            </button>
          </div>
        ) : (
          /* Confirmation Actions */
          <div className="flex flex-col gap-12">
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={handleConfirmJoin}
              disabled={isSubmitting}
              id="confirm-join-group-btn"
              style={{
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? t('loading') : t('confirm')} & {t('joinAGroup')}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => navigate('/')}
              id="cancel-join-group-btn"
            >
              {t('cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
