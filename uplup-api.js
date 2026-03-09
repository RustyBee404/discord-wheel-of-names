/**
 * Uplup Wheel API Client
 * Handles all API calls to Uplup Wheel service
 */
export class UplupAPI {
  constructor(apiKey, baseUrl = 'https://api.uplup.com/api/wheel') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.accountInfo = null;
    this.accountInfoFetchedAt = null;
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    return `Bearer ${this.apiKey}`;
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

  async getWheel(wheelId) {
    return this.request(`/wheels/${wheelId}`);
  }

  async spinWheel(wheelId) {
    return this.request(`/wheels/${wheelId}/spin`, 'POST');
  }

  async listWheels(limit = 10, offset = 0) {
    return this.request(`/wheels?limit=${limit}&offset=${offset}`);
  }

  async updateWheelEntries(wheelId, entries) {
    return this.request(`/wheels/${wheelId}/entries`, 'PUT', { entries });
  }

  async addEntries(wheelId, entries) {
    return this.request(`/wheels/${wheelId}/entries`, 'POST', { entries });
  }

  async deleteWheel(wheelId) {
    return this.request(`/wheels/${wheelId}`, 'DELETE');
  }

  async getAccountInfo(forceRefresh = false) {
    const cacheAge = this.accountInfoFetchedAt ? Date.now() - this.accountInfoFetchedAt : Infinity;
    const cacheValid = cacheAge < 5 * 60 * 1000;

    if (!forceRefresh && this.accountInfo && cacheValid) {
      return this.accountInfo;
    }

    const response = await this.request('/account');
    this.accountInfo = response.data;
    this.accountInfoFetchedAt = Date.now();
    return this.accountInfo;
  }

  async getLimits() {
    const account = await this.getAccountInfo();
    return account.limits;
  }

  async checkLimit(limitType, value) {
    const account = await this.getAccountInfo();
    const limit = account.limits[limitType];

    if (limit === -1) {
      return {
        allowed: true,
        limit: -1,
        isUnlimited: true
      };
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
        message: `Your **${planName}** plan allows up to **${limit}** ${label}.\nYou have ${value}.`
      };
    }

    return {
      allowed: true,
      limit,
      current: value
    };
  }
}
