import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Upload, Zap, ZapOff, RefreshCw, Check, AlertCircle, UserCheck } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { validateSplitMatesQR } from '../utils/qrValidation';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';

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
  } catch (e) {
    // Ignore audio context failures
  }
}

/**
 * Reusable SplitMates Full-Screen QR Scanner Modal Component
 * Single Source of Truth for QR scanning UI across Home & Join Group flows.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - onScanSuccess: function(inviteCode, groupInfo)
 */
export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const { getUserGroups, joinGroup, showToast } = useApp();
  const { t } = useLanguage();

  // Scanner States: 'idle' | 'detected' | 'found' | 'invalid' | 'denied'
  const [scanState, setScanState] = useState('idle');
  const [invalidError, setInvalidError] = useState(null);

  const [scannedCode, setScannedCode] = useState('');
  const [scannedGroup, setScannedGroup] = useState(null);

  const [facingMode, setFacingMode] = useState('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [isJoining, setIsJoining] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStoppingRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Teardown camera streams safely
  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      const container = document.getElementById('qr-reusable-container');
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

      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop().catch(() => {});
        }
        await scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    } catch (err) {
      console.warn('[QR SCANNER STOP ERR]', err);
    } finally {
      setTorchOn(false);
      isStoppingRef.current = false;
    }
  };

  const handleClose = async () => {
    await stopScanner();
    resetScannerState();
    onClose();
  };

  const resetScannerState = () => {
    setScannedCode('');
    setScannedGroup(null);
    setInvalidError(null);
    setScanState('idle');
    isProcessingRef.current = false;
  };

  // Keyboard accessibility
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Detect camera devices
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
        .catch(() => setAvailableCameras([]));
    }
  }, []);

  const switchCamera = async () => {
    if (availableCameras.length <= 1 || isStoppingRef.current) return;
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  const toggleTorch = async () => {
    try {
      const container = document.getElementById('qr-reusable-container');
      const videoElem = container?.querySelector('video');
      if (videoElem && videoElem.srcObject) {
        const track = videoElem.srcObject.getVideoTracks()[0];
        if (track && track.getCapabilities?.().torch) {
          const nextState = !torchOn;
          await track.applyConstraints({ advanced: [{ torch: nextState }] });
          setTorchOn(nextState);
          return;
        }
      }
      showToast('Flashlight not supported on this device/browser');
    } catch (err) {
      showToast('Could not toggle flashlight');
    }
  };

  // Strict QR payload handler
  const processDecodedText = (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Strict local validation
    const validation = validateSplitMatesQR(decodedText);
    if (!validation.isValid) {
      setInvalidError({
        title: validation.errorTitle || 'Invalid SplitMates QR',
        message: validation.errorMessage || "This QR code isn't a SplitMates group invite.",
      });
      setScanState('invalid');
      return;
    }

    const code = validation.inviteCode;
    setScanState('detected');
    setScannedCode(code);

    playScanSuccessSound();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }

    // Lookup group details
    const userGroups = getUserGroups ? getUserGroups() : [];
    const foundGroup = userGroups.find((g) => g.inviteCode === code);

    const groupInfo = foundGroup
      ? {
          id: foundGroup.id,
          name: foundGroup.name,
          icon: foundGroup.icon || '🏠',
          memberCount: foundGroup.memberIds?.length || 3,
          description: foundGroup.description || 'SplitMates Expense Group',
          inviteCode: code,
        }
      : {
          id: code,
          name: `Group (${code})`,
          icon: '🎉',
          memberCount: 3,
          description: 'Ready to join on SplitMates',
          inviteCode: code,
        };

    setScannedGroup(groupInfo);

    setTimeout(() => {
      setScanState('found');
    }, 450);
  };

  // Live camera lifecycle
  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      setScanState('idle');
      isProcessingRef.current = false;

      const timer = setTimeout(async () => {
        if (!isMounted) return;

        try {
          await stopScanner();

          const scannerInstance = new Html5Qrcode('qr-reusable-container');
          scannerRef.current = scannerInstance;

          await scannerInstance.start(
            { facingMode: facingMode },
            { fps: 15, aspectRatio: 1.0 },
            (decodedText) => {
              if (!isMounted || isProcessingRef.current) return;
              processDecodedText(decodedText);
            },
            () => {}
          );

          if (isMounted) {
            const container = document.getElementById('qr-reusable-container');
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
  }, [isOpen, facingMode]);

  // Image gallery file upload scan
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || isProcessingRef.current) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-file-dummy-reusable');
      const decodedText = await html5Qrcode.scanFile(file, true);
      processDecodedText(decodedText);
    } catch (err) {
      setInvalidError({
        title: 'Invalid SplitMates QR',
        message: "No valid SplitMates QR code found in this image. Please scan a group QR generated from SplitMates.",
      });
      setScanState('invalid');
    }
  }

  async function handleConfirmJoinGroup() {
    if (!scannedCode || isJoining) return;
    setIsJoining(true);

    try {
      if (onScanSuccess) {
        await onScanSuccess(scannedCode, scannedGroup);
      } else {
        await joinGroup(scannedCode);
        showToast(`Joined ${scannedGroup?.name || 'group'}!`);
      }
      await stopScanner();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to join group. Please check group code.');
      resetScannerState();
    } finally {
      setIsJoining(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div id="qr-file-dummy-reusable" style={{ display: 'none' }} />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        id="qr-reusable-file-input"
      />

      <div className="fullscreen-qr-scanner" id="fullscreen-qr-scanner-view">
        {/* Full Screen Live Camera Background */}
        <div className="fullscreen-camera-bg">
          <div id="qr-reusable-container" style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Gradient Overlay Vignette */}
        <div className="fullscreen-scanner-vignette" />

        {/* Top Navigation Bar */}
        <div className="fullscreen-scanner-header">
          <button
            type="button"
            className="fullscreen-nav-btn"
            onClick={handleClose}
            aria-label="Close Scanner"
            id="scanner-close-btn"
          >
            <ArrowLeft size={20} />
          </button>

          <h3>Scan Group QR</h3>

          {hasTorch ? (
            <button
              type="button"
              className={`fullscreen-nav-btn ${torchOn ? 'active' : ''}`}
              onClick={toggleTorch}
              aria-label="Toggle Flashlight"
              id="reusable-torch-btn"
            >
              {torchOn ? <ZapOff size={18} /> : <Zap size={18} />}
            </button>
          ) : (
            <div style={{ width: 40 }} />
          )}
        </div>

        {/* Center Viewfinder & Frame */}
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
                  <span>SplitMates QR Detected</span>
                </div>
              )}
            </div>

            <div className="fullscreen-scanner-instructions">
              <h4>Scan a SplitMates group QR</h4>
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
              Camera Access Required
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '300px', marginBottom: '24px' }}>
              Camera access is required to scan a group QR automatically.
            </p>

            <div className="flex flex-col gap-12 w-full" style={{ maxWidth: '280px' }}>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => setScanState('idle')}
                style={{ fontWeight: 700 }}
                id="reusable-allow-camera-btn"
              >
                Allow Camera Access
              </button>

              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={() => fileInputRef.current?.click()}
                style={{ borderColor: 'rgba(255, 255, 255, 0.3)', color: '#FFFFFF', fontWeight: 600 }}
                id="reusable-upload-gallery-btn"
              >
                <Upload size={16} /> Upload QR from Gallery
              </button>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="fullscreen-scanner-bottom">
          <button
            type="button"
            className="fullscreen-action-btn"
            onClick={() => fileInputRef.current?.click()}
            id="reusable-gallery-scan-btn"
          >
            <Upload size={18} /> Upload from Gallery
          </button>

          {hasTorch && (
            <button
              type="button"
              className={`fullscreen-action-btn ${torchOn ? 'active' : ''}`}
              onClick={toggleTorch}
              id="reusable-bottom-torch-btn"
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
              id="reusable-switch-camera-btn"
            >
              <RefreshCw size={18} /> Flip
            </button>
          )}
        </div>

        {/* VALID QR: GROUP FOUND CONFIRMATION BOTTOM SHEET */}
        {scanState === 'found' && scannedGroup && (
          <div className="fullscreen-group-sheet" id="reusable-scanned-group-sheet">
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
                  SplitMates Group Found
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
                id="reusable-cancel-scanned-group-btn"
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={handleConfirmJoinGroup}
                disabled={isJoining}
                style={{ fontWeight: 800, fontSize: '0.9rem' }}
                id="reusable-confirm-join-scanned-group-btn"
              >
                {isJoining ? (
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

        {/* INVALID QR ERROR SHEET */}
        {scanState === 'invalid' && (
          <div className="fullscreen-invalid-sheet flex flex-col gap-12" id="reusable-invalid-qr-sheet" style={{ padding: '16px 20px' }}>
            <div className="flex items-start gap-12">
              <AlertCircle size={24} style={{ color: 'var(--negative)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {invalidError?.title || 'Invalid SplitMates QR'}
                </h4>
                <p className="text-secondary text-xs" style={{ margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  {invalidError?.message || "This QR code isn't a SplitMates group invite. Please scan a group QR generated from SplitMates."}
                </p>
              </div>
            </div>

            <div className="flex justify-end" style={{ marginTop: '4px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={resetScannerState}
                style={{ fontSize: '0.82rem', padding: '8px 16px', borderRadius: '10px', fontWeight: 700 }}
                id="reusable-scan-again-btn"
              >
                Scan Again
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
