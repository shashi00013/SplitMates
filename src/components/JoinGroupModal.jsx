import { useState, useEffect, useRef } from 'react';
import { X, Link2, QrCode, Camera, Upload, Zap, ZapOff, RefreshCw, Check, ArrowLeft, AlertCircle, UserCheck } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

// Synthesize pleasant scan success audio chime
function playScanSuccessSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Ignore audio errors
  }
}

import QRScannerModal from './QRScannerModal';

export default function JoinGroupModal({ isOpen, onClose }) {
  const { joinGroup, getUserGroups, showToast } = useApp();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'scan'
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseModal = () => {
    setInviteCode('');
    onClose();
  };

  async function handleJoinWithCode(codeToUse) {
    if (!codeToUse || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await joinGroup(codeToUse);
      setInviteCode('');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to join group. Please check group code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    handleJoinWithCode(inviteCode);
  }

  if (!isOpen) return null;

  return (
    <>
      {/* MODE 1: ENTER CODE MODAL */}
      {activeTab === 'code' && (
        <div className="modal-overlay" onClick={handleCloseModal} id="join-group-modal-overlay">
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            id="join-group-modal-content"
            style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '400px',
              width: '92%',
              maxHeight: '88vh',
              overflowY: 'auto',
            }}
          >
            <div className="modal-drag-handle" />

            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{t('joinAGroup')}</h2>
              <button className="btn-icon" onClick={handleCloseModal} id="close-join-group-btn" style={{ color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div
              className="flex gap-8"
              style={{
                background: 'var(--bg-input)',
                padding: '4px',
                borderRadius: '14px',
                border: '1px solid var(--border-light)',
                marginBottom: '20px',
              }}
              id="join-group-tabs"
            >
              <button
                type="button"
                className="flex-1 flex justify-center items-center gap-6"
                onClick={() => setActiveTab('code')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'all 0.2s ease',
                }}
                id="tab-join-code"
              >
                <Link2 size={15} /> Enter Code
              </button>
              <button
                type="button"
                className="flex-1 flex justify-center items-center gap-6"
                onClick={() => setActiveTab('scan')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                id="tab-join-scan"
              >
                <QrCode size={15} /> Scan QR Code
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-16">
              <div className="input-group">
                <label htmlFor="join-invite-code" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {t('enterGroupCode')}
                </label>
                <input
                  className="input"
                  id="join-invite-code"
                  type="text"
                  placeholder="e.g. 7F3A9B"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
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
                style={{ opacity: !inviteCode.trim() || isSubmitting ? 0.5 : 1, marginTop: '4px', fontWeight: 700 }}
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
      )}

      {/* MODE 2: REUSABLE FULL-SCREEN MOBILE QR SCANNER */}
      {activeTab === 'scan' && (
        <QRScannerModal
          isOpen={true}
          onClose={() => setActiveTab('code')}
          onScanSuccess={async (code) => {
            await handleJoinWithCode(code);
          }}
        />
      )}
    </>
  );
}
