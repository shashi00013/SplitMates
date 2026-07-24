import { useState, useEffect, useRef } from 'react';
import { X, Link2, QrCode, Camera, Upload, Check } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

export default function JoinGroupModal({ isOpen, onClose }) {
  const { joinGroup, showToast } = useApp();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'scan'
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Extract invite code if scanned text is full URL like "https://app.com/join/7F3A9B"
  function extractCode(decodedText) {
    if (!decodedText) return '';
    const text = decodedText.trim();
    if (text.includes('/join/')) {
      const parts = text.split('/join/');
      return parts[parts.length - 1].split('?')[0].split('#')[0].trim();
    }
    return text;
  }

  async function handleJoinWithCode(codeToUse) {
    const finalCode = extractCode(codeToUse);
    if (!finalCode || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await joinGroup(finalCode);
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

  // Live Camera Scanner Lifecycle
  useEffect(() => {
    let html5QrcodeInstance = null;

    if (isOpen && activeTab === 'scan') {
      setCameraError(null);
      setIsScanning(true);

      const scannerId = 'qr-reader-container';

      // Timeout to ensure DOM node is rendered
      const timer = setTimeout(async () => {
        try {
          html5QrcodeInstance = new Html5Qrcode(scannerId);
          scannerRef.current = html5QrcodeInstance;

          await html5QrcodeInstance.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              showToast('QR Code Scanned!');
              // Stop camera scan and submit code
              if (html5QrcodeInstance && html5QrcodeInstance.isScanning) {
                html5QrcodeInstance.stop().catch(() => {});
              }
              setIsScanning(false);
              const code = extractCode(decodedText);
              setInviteCode(code);
              handleJoinWithCode(code);
            },
            () => {} // Ignore frame scan errors
          );
        } catch (err) {
          console.warn('[QR SCANNER WARN]', err);
          setCameraError('Camera access not granted or not supported on this device. You can upload a QR image below.');
          setIsScanning(false);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (html5QrcodeInstance && html5QrcodeInstance.isScanning) {
          html5QrcodeInstance.stop().catch(() => {});
        }
      };
    } else {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    }
  }, [isOpen, activeTab]);

  // File Upload Scan Handler
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-file-dummy');
      const decodedText = await html5Qrcode.scanFile(file, true);
      const code = extractCode(decodedText);
      showToast('QR Image Scanned!');
      setInviteCode(code);
      handleJoinWithCode(code);
    } catch (err) {
      showToast('No valid QR code found in this image. Try entering the code manually.');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} id="join-group-modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        id="join-group-modal-content"
        style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', maxWidth: '400px', width: '92%' }}
      >
        <div className="modal-drag-handle" />

        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{t('joinAGroup')}</h2>
          <button className="btn-icon" onClick={onClose} id="close-join-group-btn" style={{ color: 'var(--text-secondary)' }}>
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
              background: activeTab === 'code' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'code' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'code' ? 'var(--shadow-card)' : 'none',
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
              background: activeTab === 'scan' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'scan' ? '#000000' : 'var(--text-secondary)',
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

        {/* Dummy hidden element for html5-qrcode scanFile */}
        <div id="qr-file-dummy" style={{ display: 'none' }} />

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          id="qr-file-input"
        />

        {/* Tab 1: Enter Code */}
        {activeTab === 'code' && (
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
              style={{ opacity: (!inviteCode.trim() || isSubmitting) ? 0.5 : 1, marginTop: '4px', fontWeight: 700 }}
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
        )}

        {/* Tab 2: Scan QR Code */}
        {activeTab === 'scan' && (
          <div className="flex flex-col items-center">
            {/* Viewfinder Container */}
            <div
              style={{
                width: '100%',
                maxWidth: '260px',
                height: '240px',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                background: '#000000',
                border: '2px solid var(--accent)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              id="qr-viewfinder"
            >
              <div id="qr-reader-container" style={{ width: '100%', height: '100%' }} />

              {cameraError && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <Camera size={32} style={{ marginBottom: '8px', color: 'var(--warning)', opacity: 0.8 }} />
                  <p style={{ margin: 0 }}>{cameraError}</p>
                </div>
              )}
            </div>

            <p className="text-secondary text-xs text-center" style={{ marginBottom: '14px' }}>
              Position the group QR code inside the frame to scan automatically
            </p>

            {/* Upload QR Image Button Fallback */}
            <button
              type="button"
              className="btn btn-outline btn-full"
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '14px',
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                fontWeight: 600,
              }}
              id="upload-qr-image-btn"
            >
              <Upload size={16} /> Upload QR Image from Gallery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
