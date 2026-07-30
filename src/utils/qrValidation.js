/**
 * Strict QR Code Validation Module for SplitMates
 * Validates decoded QR payload locally BEFORE calling any backend API or navigating.
 */

/**
 * Validates whether a decoded QR text string represents a legitimate SplitMates Group Invite.
 *
 * @param {string} decodedText - raw string decoded by QR scanner
 * @returns {{ isValid: boolean, inviteCode?: string, errorTitle?: string, errorMessage?: string }}
 */
export function validateSplitMatesQR(decodedText) {
  if (!decodedText || typeof decodedText !== 'string') {
    return {
      isValid: false,
      errorTitle: 'Invalid SplitMates QR',
      errorMessage: "This QR code is not a SplitMates group code.",
    };
  }

  const raw = decodedText.trim();

  // 1. Rejection of common non-SplitMates URI schemes
  if (
    raw.startsWith('upi://') ||
    raw.startsWith('WIFI:') ||
    raw.startsWith('tel:') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('smsto:') ||
    raw.startsWith('geo:') ||
    raw.startsWith('facetime:')
  ) {
    return {
      isValid: false,
      errorTitle: 'Invalid SplitMates QR',
      errorMessage: "This QR code is not a SplitMates group code.",
    };
  }

  // 2. HTTP/HTTPS URLs — Must contain '/join/' path segment
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const url = new URL(raw);
      if (url.pathname.includes('/join/')) {
        const parts = url.pathname.split('/join/');
        const code = parts[parts.length - 1].split('/')[0].trim();
        if (code && code.length >= 3) {
          return { isValid: true, inviteCode: code.toUpperCase() };
        }
      }
    } catch (e) {
      // Fallthrough to standard text checks
    }

    // Any HTTP URL without /join/ is an invalid external link (e.g. google.com, whatsapp.com)
    return {
      isValid: false,
      errorTitle: 'Invalid SplitMates QR',
      errorMessage: "This QR code is not a SplitMates group code.",
    };
  }

  // 3. Custom Scheme — e.g. splitly://join/:code or splitmates://join/:code
  if (raw.startsWith('splitly://') || raw.startsWith('splitmates://')) {
    const parts = raw.split('/');
    const code = parts[parts.length - 1].trim();
    if (code && code.length >= 3) {
      return { isValid: true, inviteCode: code.toUpperCase() };
    }
  }

  // 4. JSON Payload
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const json = JSON.parse(raw);
      const code = json.inviteCode || json.code;
      if ((json.type === 'splitmates_invite' || json.app === 'splitmates' || code) && code) {
        return { isValid: true, inviteCode: String(code).toUpperCase().trim() };
      }
    } catch (e) {
      // Fallthrough to text check
    }

    return {
      isValid: false,
      errorTitle: 'Invalid SplitMates QR',
      errorMessage: "This QR code is not a SplitMates group code.",
    };
  }

  // 5. Standalone Invite Code (Must be alphanumeric, UUID or 6-36 chars, no spaces/punctuation)
  const isAlphanumericCode = /^[A-Za-z0-9\-_]{4,36}$/.test(raw);
  if (isAlphanumericCode && !raw.includes(' ') && !raw.includes('http')) {
    return { isValid: true, inviteCode: raw.toUpperCase() };
  }

  // Otherwise, reject
  return {
    isValid: false,
    errorTitle: 'Invalid SplitMates QR',
    errorMessage: "This QR code is not a SplitMates group code.",
  };
}
