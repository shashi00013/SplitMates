/**
 * Privacy-Conscious Product Analytics & Observability Utility for SplitMates
 * Tracks key user lifecycle milestones without recording sensitive personal information,
 * passwords, tokens, or private transaction values.
 */

class AnalyticsService {
  constructor() {
    this.events = [];
    this.errors = [];
    this.isProd = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
  }

  /**
   * Track privacy-safe product event
   * @param {string} eventName - e.g. 'user_logged_in', 'group_created', 'expense_created', 'settlement_completed'
   * @param {Object} metadata - non-sensitive metadata (e.g. split_type, member_count)
   */
  track(eventName, metadata = {}) {
    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.events.push(payload);

    if (this.events.length > 100) {
      this.events.shift();
    }

    if (!this.isProd) {
      console.log(`[Analytics Event]: ${eventName}`, metadata);
    }
  }

  /**
   * Capture non-sensitive error metadata for developer observability
   * @param {string} action - e.g. 'LOGIN_SUBMIT', 'CREATE_EXPENSE'
   * @param {Error|string} err - error object or message
   * @param {string} route - current page route
   */
  trackError(action, err, route = '/') {
    const errorPayload = {
      action,
      message: typeof err === 'string' ? err : err?.message || 'Unknown Error',
      route,
      timestamp: new Date().toISOString(),
    };

    this.errors.push(errorPayload);

    if (this.errors.length > 50) {
      this.errors.shift();
    }

    console.warn(`[Observability Error] Action: ${action} on ${route}:`, errorPayload.message);
  }

  /**
   * Get funnel metrics summary
   */
  getFunnelStats() {
    const counts = {};
    this.events.forEach((e) => {
      counts[e.event] = (counts[e.event] || 0) + 1;
    });
    return counts;
  }
}

export const analytics = new AnalyticsService();
