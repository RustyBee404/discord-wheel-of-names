/**
 * Uplup Wheel API Client
 * Handles all API calls to Uplup Wheel service
 */

export class UplupAPI {
  constructor(apiKey, apiSecret, baseUrl = 'https://api.uplup.com/api/wheel') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
    this.accountInfo = null;
    this.accountInfoFetchedAt = null;
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Make an API request
   */
  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `API request failed with status ${response.status}`);
    }

    return data;
  }

  /**
   * Create a new wheel
   */
  async createWheel(name, entries, settings = {}) {
    return this.request('/wheels', 'POST', {
      wheel_name: name,
      entries,
      settings: {
        spinnerDuration: 'normal',
        selectedColorSet: 'Vibrant',
        showTitle: true,
        removeAfterWin: false,
        ...settings
      }
    });
  }

  /**
   * Get wheel details
   */
  async getWheel(wheelId) {
    return this.request(`/wheels/${wheelId}`);
  }

  /**
   * Spin a wheel
   */
  async spinWheel(wheelId) {
    return this.request(`/wheels/${wheelId}/spin`, 'POST');
  }

  /**
   * List all wheels
   */
  async listWheels(limit = 10, offset = 0) {
    return this.request(`/wheels?limit=${limit}&offset=${offset}`);
  }

  /**
   * Update wheel entries
   */
  async updateWheelEntries(wheelId, entries) {
    return this.request(`/wheels/${wheelId}/entries`, 'PUT', { entries });
  }

  /**
   * Add entries to a wheel
   */
  async addEntries(wheelId, entries) {
    return this.request(`/wheels/${wheelId}/entries`, 'POST', { entries });
  }

  /**
   * Delete a wheel
   */
  async deleteWheel(wheelId) {
    return this.request(`/wheels/${wheelId}`, 'DELETE');
  }

  /**
   * Get account info and plan limits
   * Caches for 5 minutes to reduce API calls
   */
  async getAccountInfo(forceRefresh = false) {
    const cacheAge = this.accountInfoFetchedAt ? Date.now() - this.accountInfoFetchedAt : Infinity;
    const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes

    if (!forceRefresh && this.accountInfo && cacheValid) {
      return this.accountInfo;
    }

    const response = await this.request('/account');
    this.accountInfo = response.data;
    this.accountInfoFetchedAt = Date.now();
    return this.accountInfo;
  }

  /**
   * Get plan limits (convenience method)
   */
  async getLimits() {
    const account = await this.getAccountInfo();
    return account.limits;
  }

  /**
   * Check if a limit would be exceeded
   * @param {string} limitType - 'max_entries', 'max_picks', 'max_winners', 'max_wheels'
   * @param {number} value - The value to check
   * @returns {object} { allowed, limit, current, message }
   */
  async checkLimit(limitType, value) {
    const account = await this.getAccountInfo();
    const limit = account.limits[limitType];

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, limit: -1, isUnlimited: true };
    }

    if (value > limit) {
      const planName = account.plan_name;
      const limitLabels = {
        max_entries: 'entries',
        max_picks: 'spins',
        max_winners: 'winners',
        max_wheels: 'saved wheels'
      };
      const label = limitLabels[limitType] || 'items';

      return {
        allowed: false,
        limit,
        current: value,
        planName,
        message: `Your **${planName}** plan allows up to **${limit}** ${label}. You have ${value}.`
      };
    }

    return { allowed: true, limit, current: value };
  }
}