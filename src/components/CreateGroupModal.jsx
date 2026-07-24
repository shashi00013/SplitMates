import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Copy, Share2, Check, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

const icons = ['🏠', '✈️', '🍕', '🎉', '🚗', '🎓', '💼', '🏖️'];

export default function CreateGroupModal({ isOpen, onClose }) {
  const { createGroup, showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏠');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  function handleClose() {
    setName('');
    setDescription('');
    setSelectedIcon('🏠');
    setCreatedGroup(null);
    setCopied(false);
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newGroup = await createGroup({
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
      });
      if (newGroup) {
        setCreatedGroup(newGroup);
      } else {
        handleClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyCode() {
    if (!createdGroup?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(createdGroup.inviteCode);
      setCopied(true);
      showToast(`${t('groupCode')} ${t('copied')}`);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      showToast('Failed to copy code');
    }
  }

  async function handleShareInvite() {
    if (!createdGroup?.inviteCode || typeof navigator === 'undefined' || !navigator.share) return;
    const inviteUrl = `${window.location.origin}/join/${createdGroup.inviteCode}`;
    try {
      await navigator.share({
        title: `Join ${createdGroup.name} on SplitMates`,
        text: `Join my group "${createdGroup.name}" on SplitMates!`,
        url: inviteUrl,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Failed to share invite');
      }
    }
  }

  function handleGoToGroup() {
    const targetId = createdGroup?.id;
    handleClose();
    if (targetId) {
      navigate(`/group/${targetId}`);
    }
  }

  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);
  const inviteUrl = createdGroup?.inviteCode ? `${window.location.origin}/join/${createdGroup.inviteCode}` : window.location.origin;

  return (
    <div className="modal-overlay" onClick={handleClose} id="create-group-modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        id="create-group-modal-content"
        style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-drag-handle" />

        {createdGroup ? (
          /* Success State View */
          <div className="flex flex-col gap-16" id="create-group-success-state">
            <div className="flex justify-between items-center">
              <span
                style={{
                  background: 'rgba(163, 230, 53, 0.15)',
                  color: '#A3E635',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                ✓ Group Created
              </span>
              <button className="btn-icon" onClick={handleClose} id="close-success-group-btn" style={{ color: '#888' }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mt-4">
              <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{createdGroup.icon || '🏠'}</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: '#FFFFFF' }}>
                {createdGroup.name}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#888888', margin: 0 }}>
                Your group is ready! Scan or share the {t('groupCode')} below.
              </p>
            </div>

            {/* QR Code */}
            {createdGroup.inviteCode && (
              <div className="flex flex-col items-center justify-center" style={{ margin: '8px 0' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '14px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  id="created-group-qr-wrapper"
                >
                  <QRCodeSVG
                    value={inviteUrl}
                    size={150}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="H"
                  />
                </div>
              </div>
            )}

            {/* Prominent Group Code Box */}
            <div
              style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
              }}
              id="success-invite-code-box"
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('groupCode')}
              </span>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  color: 'var(--accent)',
                  marginTop: '4px',
                  wordBreak: 'break-all',
                }}
                id="created-group-invite-code"
              >
                {createdGroup.inviteCode || 'N/A'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-10">
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={handleCopyCode}
                id="copy-created-group-code-btn"
              >
                {copied ? (
                  <>
                    <Check size={18} /> {t('copied')}
                  </>
                ) : (
                  <>
                    <Copy size={18} /> {t('copy')} {t('groupCode')}
                  </>
                )}
              </button>

              {canShare && (
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={handleShareInvite}
                  id="share-created-group-btn"
                >
                  <Share2 size={18} /> {t('share')}
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={handleGoToGroup}
                id="go-to-created-group-btn"
                style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', fontWeight: 600, marginTop: '2px' }}
              >
                Go to Group <ArrowRight size={16} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{t('createGroupTitle')}</h2>
              <button className="btn-icon" onClick={handleClose} id="close-create-group-btn" style={{ color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-16">
              {/* Icon Selector */}
              <div className="input-group">
                <label style={{ color: 'var(--text-secondary)' }}>{t('groupIcon')}</label>
                <div className="flex gap-8" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                  {icons.map((ic) => (
                    <button
                      type="button"
                      key={ic}
                      onClick={() => setSelectedIcon(ic)}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        fontSize: '1.25rem',
                        background: selectedIcon === ic ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
                        border: selectedIcon === ic ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Name */}
              <div className="input-group">
                <label htmlFor="group-name-input" style={{ color: '#888' }}>Group Name</label>
                <input
                  className="input"
                  id="group-name-input"
                  type="text"
                  placeholder={t('groupNamePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Description */}
              <div className="input-group">
                <label htmlFor="group-desc-input" style={{ color: '#888' }}>Description</label>
                <input
                  className="input"
                  id="group-desc-input"
                  type="text"
                  placeholder={t('groupDescPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={!name.trim() || isSubmitting}
                id="submit-create-group-btn"
                style={{ opacity: (!name.trim() || isSubmitting) ? 0.5 : 1, marginTop: '8px', background: 'var(--accent)', color: '#000', fontWeight: 700 }}
              >
                {isSubmitting ? (
                  t('loading')
                ) : (
                  <>
                    <Plus size={18} /> {t('createGroup')}
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
