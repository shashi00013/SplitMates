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

export default function JoinGroupModal({ isOpen, onClose }) {
  const { joinGroup, getUserGroups, showToast } = useApp();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'scan'
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Scanner States: 'idle' | 'detected' | 'found' | 'invalid' | 'denied'
  const [scanState, setScanState] = useState('idle');
  const [scannedCode, setScannedCode] = useState('');
  const [scannedGroup, setScannedGroup] = useState(null);

  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStoppingRef = useRef(false);
  const isProcessingRef = useRef(false);

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

  // Safe camera scanner teardown function
  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      // 1. Stop hardware video tracks directly on DOM video node
      const container = document.getElementById('qr-reader-container');
      const videoElem = container?.querySelector('video');
      if (videoElem && videoElem.srcObject) {
        const stream = videoElem.srcObject;
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
        videoElem.srcObject = null;
      }

      // 2. Stop HTML5Qrcode instance
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop().catch(() => {});
        }
        try {
          await scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }
    } catch (err) {
      console.warn('[QR SCANNER STOP ERR]', err);
    } finally {
      setTorchOn(false);
      isStoppingRef.current = false;
    }
  };

  const handleCloseModal = async () => {
    await stopScanner();
    setInviteCode('');
    setScannedCode('');
    setScannedGroup(null);
    setScanState('idle');
    isProcessingRef.current = false;
    onClose();
  };

  const resetScannerState = () => {
    setScannedCode('');
    setScannedGroup(null);
    setScanState('idle');
    isProcessingRef.current = false;
  };

  async function handleJoinWithCode(codeToUse) {
    const finalCode = extractCode(codeToUse);
    if (!finalCode || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await joinGroup(finalCode);
      setInviteCode('');
      setScannedCode('');
      setScannedGroup(null);
      await stopScanner();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to join group. Please check group code.');
      resetScannerState();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    handleJoinWithCode(inviteCode);
  }

  // Detect available camera devices (for real camera switch control)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator?.mediaDevices) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 1) {
            setAvailableCameras(devices);
          } else {
            setAvailableCameras([]);
          }
        })
        .catch(() => {
          setAvailableCameras([]);
        });
    }
  }, []);

  // Switch camera (Front vs Rear)
  const switchCamera = async () => {
    if (availableCameras.length <= 1 || isStoppingRef.current) return;
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    try {
      const container = document.getElementById('qr-reader-container');
      const videoElem = container?.querySelector('video');
      if (videoElem && videoElem.srcObject) {
        const track = videoElem.srcObject.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          const caps = track.getCapabilities();
          if (caps.torch) {
            const nextState = !torchOn;
            await track.applyConstraints({
              advanced: [{ torch: nextState }],
            });
            setTorchOn(nextState);
            return;
          }
        }
      }
      showToast('Flashlight not supported on this device/browser');
    } catch (err) {
      console.warn('Torch toggle failed', err);
      showToast('Could not toggle flashlight');
    }
  };

  // Handle successful QR detection
  const processDecodedText = (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const code = extractCode(decodedText);

    // Basic format validation: codes must be 4 to 20 chars alphanumeric or uppercase
    if (!code || code.length < 3 || code.includes(' ')) {
      setScanState('invalid');
      return;
    }

    setScanState('detected');
    setScannedCode(code);

    playScanSuccessSound();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }

    // Lookup existing group or construct preview metadata
    const userGroups = getUserGroups ? getUserGroups() : [];
    const foundGroup = userGroups.find((g) => g.inviteCode === code);

    const groupInfo = foundGroup
      ? {
          name: foundGroup.name,
          icon: foundGroup.icon || '🏠',
          memberCount: foundGroup.memberIds?.length || 3,
          description: foundGroup.description || 'SplitMates Expense Group',
        }
      : {
          name: `Group (${code})`,
          icon: '🎉',
          memberCount: 3,
          description: 'Ready to join on SplitMates',
        };

    setScannedGroup(groupInfo);

    // 400ms delay to display green check indicator before showing Group Found sheet
    setTimeout(() => {
      setScanState('found');
    }, 450);
  };

  // Live Camera Scanner Lifecycle
  useEffect(() => {
    let isMounted = true;

    if (isOpen && activeTab === 'scan') {
      setScanState('idle');
      isProcessingRef.current = false;

      const timer = setTimeout(async () => {
        if (!isMounted) return;

        try {
          await stopScanner();

          const scannerId = 'qr-reader-container';
          const html5QrcodeInstance = new Html5Qrcode(scannerId);
          scannerRef.current = html5QrcodeInstance;

          await html5QrcodeInstance.start(
            { facingMode: facingMode },
            {
              fps: 15,
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (!isMounted || isProcessingRef.current) return;
              processDecodedText(decodedText);
            },
            () => {} // Ignore frame scan errors
          );

          if (isMounted) {
            // Check torch capability
            const container = document.getElementById('qr-reader-container');
            const videoElem = container?.querySelector('video');
            if (videoElem && videoElem.srcObject) {
              const track = videoElem.srcObject.getVideoTracks()[0];
              if (track && track.getCapabilities) {
                setHasTorch(Boolean(track.getCapabilities().torch));
              }
            }
          }
        } catch (err) {
          if (!isMounted) return;
          console.warn('[QR SCANNER START ERR]', err);
          setScanState('denied');
        }
      }, 150);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, activeTab, facingMode]);

  // File Upload Scan Handler
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || isProcessingRef.current) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-file-dummy');
      const decodedText = await html5Qrcode.scanFile(file, true);
      processDecodedText(decodedText);
    } catch (err) {
      showToast('No valid QR code found in this image. Try entering code manually.');
      resetScannerState();
    }
  }

  if (!isOpen) return null;

  return (
    <>
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

      {/* MODE 2: FULL-SCREEN MOBILE QR SCANNER OVERLAY */}
      {activeTab === 'scan' && (
        <div className="fullscreen-qr-scanner" id="fullscreen-qr-scanner-view">
          {/* Full Screen Live Camera Background */}
          <div className="fullscreen-camera-bg">
            <div id="qr-reader-container" />
          </div>

          {/* Gradient Overlay Vignette */}
          <div className="fullscreen-scanner-vignette" />

          {/* Top Navigation Bar */}
          <div className="fullscreen-scanner-header">
            <button
              type="button"
              className="fullscreen-nav-btn"
              onClick={async () => {
                await stopScanner();
                setActiveTab('code');
              }}
              aria-label="Back"
              id="scanner-back-btn"
            >
              <ArrowLeft size={20} />
            </button>

            <h3>Scan QR Code</h3>

            {hasTorch ? (
              <button
                type="button"
                className={`fullscreen-nav-btn ${torchOn ? 'active' : ''}`}
                onClick={toggleTorch}
                aria-label="Toggle Flashlight"
                id="header-torch-btn"
              >
                {torchOn ? <ZapOff size={18} /> : <Zap size={18} />}
              </button>
            ) : (
              <div style={{ width: 40 }} />
            )}
          </div>

          {/* Center Viewfinder & Detection Overlays */}
          {scanState !== 'denied' && (
            <div className="fullscreen-scanner-center">
              <div className={`fullscreen-target-box ${scanState === 'detected' || scanState === 'found' ? 'detected' : ''}`}>
                <div className="fullscreen-qr-corner top-left" />
                <div className="fullscreen-qr-corner top-right" />
                <div className="fullscreen-qr-corner bottom-left" />
                <div className="fullscreen-qr-corner bottom-right" />

                {scanState === 'idle' && <div className="fullscreen-scan-line" />}

                {(scanState === 'detected' || scanState === 'found') && (
                  <div className="fullscreen-success-overlay">
                    <div className="fullscreen-success-icon">
                      <Check size={30} strokeWidth={3.5} />
                    </div>
                    <span>QR Code Detected</span>
                  </div>
                )}
              </div>

              {/* Instruction Text */}
              <div className="fullscreen-scanner-instructions">
                <h4>Scan a group QR code</h4>
                <p>Keep the code inside the frame</p>
              </div>
            </div>
          )}

          {/* Camera Permission Denied View */}
          {scanState === 'denied' && (
            <div className="fullscreen-scanner-center flex flex-col items-center justify-center text-center">
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255, 165, 2, 0.18)',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Camera size={32} />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px 0', color: '#FFFFFF' }}>
                Camera Access Needed
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '300px', marginBottom: '24px' }}>
                Camera access is needed to scan a QR code automatically.
              </p>

              <div className="flex flex-col gap-12 w-full" style={{ maxWidth: '280px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-full"
                  onClick={() => {
                    setScanState('idle');
                  }}
                  style={{ fontWeight: 700 }}
                  id="allow-camera-access-btn"
                >
                  Allow Camera Access
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-full"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ borderColor: 'rgba(255, 255, 255, 0.3)', color: '#FFFFFF', fontWeight: 600 }}
                  id="denied-upload-gallery-btn"
                >
                  <Upload size={16} /> Upload QR from Gallery
                </button>
              </div>
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="fullscreen-scanner-bottom">
            <button
              type="button"
              className="fullscreen-action-btn"
              onClick={() => fileInputRef.current?.click()}
              id="gallery-scan-btn"
            >
              <Upload size={18} /> Upload from Gallery
            </button>

            {hasTorch && (
              <button
                type="button"
                className={`fullscreen-action-btn ${torchOn ? 'active' : ''}`}
                onClick={toggleTorch}
                id="bottom-torch-btn"
              >
                {torchOn ? <ZapOff size={18} /> : <Zap size={18} />}
                {torchOn ? 'Flash Off' : 'Flash On'}
              </button>
            )}

            {availableCameras.length > 1 && (
              <button
                type="button"
                className="fullscreen-action-btn"
                onClick={switchCamera}
                id="switch-camera-btn"
              >
                <RefreshCw size={18} /> Flip
              </button>
            )}
          </div>

          {/* STATE 3: GROUP FOUND CONFIRMATION BOTTOM SHEET */}
          {scanState === 'found' && scannedGroup && (
            <div className="fullscreen-group-sheet" id="scanned-group-found-sheet">
              <div className="flex items-center gap-14" style={{ marginBottom: '18px' }}>
                <div
                  style={{
                    fontSize: '2.2rem',
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'var(--bg-input)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {scannedGroup.icon || '🏠'}
                </div>

                <div className="flex-1">
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Group Found
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                    {scannedGroup.name}
                  </h3>
                  <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0' }}>
                    {scannedGroup.memberCount || 3} members · {scannedGroup.description || 'SplitMates Expense Group'}
                  </p>
                </div>
              </div>

              <div className="flex gap-12">
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={resetScannerState}
                  style={{ fontWeight: 600, fontSize: '0.9rem' }}
                  id="cancel-scanned-group-btn"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={() => handleJoinWithCode(scannedCode)}
                  disabled={isSubmitting}
                  style={{ fontWeight: 800, fontSize: '0.9rem' }}
                  id="confirm-join-scanned-group-btn"
                >
                  {isSubmitting ? (
                    t('loading')
                  ) : (
                    <>
                      <UserCheck size={18} /> Join Group
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: INVALID QR CODE FLOATING ALERT */}
          {scanState === 'invalid' && (
            <div className="fullscreen-invalid-sheet flex items-center justify-between gap-12" id="invalid-qr-sheet">
              <div className="flex items-center gap-12">
                <AlertCircle size={24} style={{ color: 'var(--negative)', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Invalid QR Code
                  </h4>
                  <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0' }}>
                    This QR code isn't a SplitMates group code
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetScannerState}
                style={{ fontSize: '0.8rem', padding: '8px 14px', borderRadius: '10px', fontWeight: 700 }}
                id="retry-scan-btn"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
