import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, Link2, Check, ArrowRight, RefreshCw, Zap, ZapOff, Users } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency } from '../data/mockData';
import Avatar from '../components/Avatar';

// Audio chime for scan success
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
  } catch (e) {}
}

import QRScannerModal from '../components/QRScannerModal';

export default function JoinGroupFlow() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { joinGroup, getUserGroups, showToast } = useApp();

  // Steps: 'select' | 'scan' | 'code' | 'confirm' | 'success'
  const [step, setStep] = useState('select');
  const [inviteCode, setInviteCode] = useState('');
  const [scannedGroup, setScannedGroup] = useState(null);
  const [resolvedGroupId, setResolvedGroupId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolve group preview details from code
  function resolveGroupInfo(codeToUse) {
    if (!codeToUse) return null;

    const userGroups = getUserGroups ? getUserGroups() : [];
    const found = userGroups.find((g) => g.inviteCode === codeToUse || g.id === codeToUse);

    const info = found
      ? {
          id: found.id,
          name: found.name,
          icon: found.icon || '🏠',
          memberCount: found.memberIds?.length || 4,
          description: found.description || 'SplitMates Shared Expenses',
          inviteCode: codeToUse,
        }
      : {
          id: codeToUse,
          name: `Group (${codeToUse})`,
          icon: '🏠',
          memberCount: 4,
          description: 'SplitMates Shared Expenses',
          inviteCode: codeToUse,
        };

    return info;
  }

  function handleCodeSubmit(e) {
    e.preventDefault();
    if (!inviteCode || inviteCode.trim().length < 3) {
      showToast('Please enter a valid invite code');
      return;
    }
    const info = resolveGroupInfo(inviteCode.trim());
    setScannedGroup(info);
    setStep('confirm');
  }

  async function handleConfirmJoin() {
    if (!scannedGroup || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await joinGroup(scannedGroup.inviteCode || scannedGroup.id);
      const targetId = res?.id || scannedGroup.id;
      setResolvedGroupId(targetId);
      setStep('success');

      setTimeout(() => {
        navigate(`/group/${targetId}`, { replace: true });
      }, 1400);
    } catch (err) {
      showToast(err.message || 'Failed to join group. Please check code.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page" id="join-group-flow-page">
      <div className="page-header">
        <button
          className="btn-icon"
          onClick={() => {
            if (step === 'select') navigate(-1);
            else if (step === 'scan' || step === 'code') setStep('select');
            else if (step === 'confirm') setStep(inviteCode ? 'code' : 'select');
          }}
          id="join-flow-back-btn"
        >
          <ChevronLeft size={20} />
        </button>
        <h1>Join a Group</h1>
        <div className="spacer" />
      </div>

      <div style={{ paddingTop: '8px' }}>
        {/* STEP 1: METHOD SELECTION */}
        {step === 'select' && (
          <div className="flex flex-col gap-16">
            <p className="text-secondary text-sm text-center" style={{ marginBottom: '8px' }}>
              Choose how you want to join an existing SplitMates group
            </p>

            <button
              className="card flex items-center justify-between"
              onClick={() => setStep('scan')}
              style={{ padding: '20px', cursor: 'pointer', background: 'var(--bg-card-alt)', border: '1px solid var(--border-light)' }}
              id="join-method-qr-btn"
            >
              <div className="flex items-center gap-14">
                <div style={{ padding: '12px', background: 'var(--accent-dim)', borderRadius: '12px', color: 'var(--accent)' }}>
                  <QrCode size={24} />
                </div>
                <div className="text-left">
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Scan QR Code</h3>
                  <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0' }}>Use camera to scan group QR</p>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>

            <button
              className="card flex items-center justify-between"
              onClick={() => setStep('code')}
              style={{ padding: '20px', cursor: 'pointer', background: 'var(--bg-card-alt)', border: '1px solid var(--border-light)' }}
              id="join-method-code-btn"
            >
              <div className="flex items-center gap-14">
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px', color: 'var(--text-primary)' }}>
                  <Link2 size={24} />
                </div>
                <div className="text-left">
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Enter Invite Code</h3>
                  <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0' }}>Type 6-digit group code manually</p>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        )}

        {/* STEP 2A: REUSABLE QR SCANNER VIEW */}
        {step === 'scan' && (
          <QRScannerModal
            isOpen={true}
            onClose={() => setStep('select')}
            onScanSuccess={(code, info) => {
              const resolved = info || resolveGroupInfo(code);
              setScannedGroup(resolved);
              setInviteCode(code);
              setStep('confirm');
            }}
          />
        )}

        {/* STEP 2B: CODE ENTRY VIEW */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-20">
            <p className="text-secondary text-sm text-center" style={{ marginBottom: '4px' }}>
              Enter the 6-digit invite code shared by your group admin
            </p>

            <div className="input-group">
              <label>Invite Code</label>
              <input
                className="input text-center"
                type="text"
                placeholder="e.g. 7F3A9B"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                style={{ fontSize: '1.2rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '14px' }}
                id="join-invite-code-input"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={!inviteCode.trim() || inviteCode.trim().length < 3}
              id="validate-invite-code-btn"
            >
              Find Group
            </button>
          </form>
        )}

        {/* STEP 3: CONFIRMATION VIEW */}
        {step === 'confirm' && scannedGroup && (
          <div className="flex flex-col items-center text-center gap-20">
            <div className="card text-center" style={{ width: '100%', padding: '24px 20px', background: 'var(--bg-card-alt)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{scannedGroup.icon}</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Found {scannedGroup.name}
              </h2>
              <p className="text-secondary text-sm" style={{ marginTop: '6px' }}>
                {scannedGroup.memberCount} members · {scannedGroup.description}
              </p>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
              Join this group?
            </h3>

            <div className="flex flex-col gap-10" style={{ width: '100%' }}>
              <button
                className="btn btn-primary btn-full"
                onClick={handleConfirmJoin}
                disabled={isSubmitting}
                id="confirm-join-group-btn"
              >
                {isSubmitting ? t('loading') : 'Confirm & Join Group'}
              </button>

              <button
                className="btn btn-secondary btn-full"
                onClick={() => setStep('select')}
                disabled={isSubmitting}
                id="cancel-join-group-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS VIEW */}
        {step === 'success' && scannedGroup && (
          <div className="flex flex-col items-center text-center" style={{ padding: '40px 20px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(204, 255, 0, 0.15)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '2px solid var(--accent)',
              }}
            >
              <Check size={32} strokeWidth={3} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              ✓ Added to {scannedGroup.name} 🎉
            </h2>
            <p className="text-secondary text-sm">
              Navigating to group details...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
