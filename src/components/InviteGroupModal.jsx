import { useState } from 'react';
import { X, Copy, Share2, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

export default function InviteGroupModal({ isOpen, onClose, group }) {
  const { showToast } = useApp();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !group) return null;

  const inviteCode = group.inviteCode || 'N/A';
  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      showToast(`${t('groupCode')} ${t('copied')}`);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      showToast('Failed to copy code');
    }
  }

  async function handleShare() {
    if (!canShare) return;
    try {
      await navigator.share({
        title: `Join ${group.name} on SplitMates`,
        text: `Join my group "${group.name}" on SplitMates!`,
        url: inviteUrl,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Failed to share invite');
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} id="invite-group-modal-overlay">
      <div
        className="modal-content flex flex-col gap-16"
        onClick={(e) => e.stopPropagation()}
        id="invite-group-modal-content"
        style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', maxWidth: '380px' }}
      >
        <div className="flex justify-between items-center">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
            {t('groupCode')} & QR
          </h2>
          <button className="btn-icon" onClick={onClose} id="close-invite-modal-btn" style={{ color: '#888' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{group.icon || '🏠'}</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>{group.name}</h3>
          <p style={{ fontSize: '0.8rem', color: '#888888', marginTop: '2px' }}>
            Scan QR code or share code to invite members
          </p>
        </div>

        {/* Vector QR Code */}
        <div className="flex justify-center" style={{ margin: '6px 0' }}>
          <div
            style={{
              background: '#FFFFFF',
              padding: '14px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'inline-flex',
            }}
            id="group-details-qr-wrapper"
          >
            <QRCodeSVG value={inviteUrl} size={150} bgColor="#FFFFFF" fgColor="#000000" level="H" />
          </div>
        </div>

        {/* Monospace Code Container */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #333333',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
          }}
          id="modal-invite-code-box"
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
              color: '#A3E635',
              marginTop: '4px',
              wordBreak: 'break-all',
            }}
            id="modal-invite-code-value"
          >
            {inviteCode}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-10">
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={handleCopyCode}
            id="invite-modal-copy-btn"
            style={{ background: '#A3E635', color: '#000000', fontWeight: 700, border: 'none' }}
          >
            {copied ? <><Check size={18} /> {t('copied')}</> : <><Copy size={18} /> {t('copy')} {t('groupCode')}</>}
          </button>

          {canShare && (
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={handleShare}
              id="invite-modal-share-btn"
              style={{ background: '#262626', color: '#FFFFFF', border: '1px solid #333333', fontWeight: 600 }}
            >
              <Share2 size={18} /> {t('share')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
