import { useState } from 'react';
import { X, Link2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

export default function JoinGroupModal({ isOpen, onClose }) {
  const { joinGroup, showToast } = useApp();
  const { t } = useLanguage();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!inviteCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await joinGroup(inviteCode.trim());
      setInviteCode('');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to join group. Please check group code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} id="join-group-modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        id="join-group-modal-content"
        style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '24px' }}
      >
        <div className="modal-drag-handle" />

        <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>{t('joinAGroup')}</h2>
          <button className="btn-icon" onClick={onClose} id="close-join-group-btn" style={{ color: '#888' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-16">
          <div className="input-group">
            <label htmlFor="join-invite-code" style={{ color: '#888' }}>{t('enterGroupCode')}</label>
            <input
              className="input"
              id="join-invite-code"
              type="text"
              placeholder="e.g. 7F3A9B"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              autoFocus
              required
            />
            <p className="text-secondary text-xs" style={{ marginTop: '6px' }}>
              {t('joinGroupDesc')}
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!inviteCode.trim() || isSubmitting}
            id="submit-join-group-btn"
            style={{ opacity: (!inviteCode.trim() || isSubmitting) ? 0.5 : 1, marginTop: '8px', background: '#A3E635', color: '#000', fontWeight: 700 }}
          >
            {isSubmitting ? (
              t('loading')
            ) : (
              <>
                <Link2 size={18} /> {t('joinAGroup')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
