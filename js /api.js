/**
 * STREAMING_CHUNK:Initializing PinTaR Cloud API Service...
 * PinTaR - Sistem Peminjaman Ruangan Terpadu
 * Layanan komunikasi asynchronous (fetch) ke Google Apps Script Web App (Spreadsheet & Drive)
 */

const ApiService = {
  // Masukkan URL Web App Google Apps Script Anda setelah di-deploy di sini
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzhgfN9ZvqgquCTvZiTYIA4aRYbRXvRKsvDWM5bsOchst8Wn9GpeD1r3rWBBbGOfSZu/exec',

  async request(action, payload = {}) {
    if (this.appsScriptUrl.includes('AKfycbz...')) {
      return this.handleMockLocal(action, payload);
    }

    try {
      const response = await fetch(this.appsScriptUrl, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload })
      });
      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      return { status: 'error', message: err.toString() };
    }
  },

  async get(action) {
    if (this.appsScriptUrl.includes('AKfycbz...')) {
      return this.handleMockLocalGet(action);
    }

    try {
      const response = await fetch(`${this.appsScriptUrl}?action=${action}`);
      return await response.json();
    } catch (err) {
      console.error('API Get Error:', err);
      return null;
    }
  },

  async fetchAllData() {
    return await this.get('getAllData');
  },

  async fetchBookings() {
    const res = await this.get('getBookings');
    return Array.isArray(res) ? res : [];
  },

  async fetchRooms() {
    const res = await this.get('getRooms');
    return Array.isArray(res) ? res : [];
  },

  async fetchAdmins() {
    const res = await this.get('getAdmins');
    return Array.isArray(res) ? res : [];
  },

  async addBooking(bookingData, base64File, fileName, mimeType) {
    return await this.request('addBooking', {
      ...bookingData,
      fileBase64: base64File || '',
      fileName: fileName || '',
      fileMimeType: mimeType || ''
    });
  },

  async updateBookingStatus(id, status) {
    return await this.request('updateStatus', { id, status });
  },

  async saveRoom(roomData) {
    return await this.request('saveRoom', roomData);
  },

  async deleteRoom(id) {
    return await this.request('deleteRoom', { id });
  },

  async addAdmin(adminData) {
    return await this.request('addAdmin', adminData);
  },

  async updateAdmin(adminData) {
    return await this.request('updateAdmin', adminData);
  },

  async deleteAdmin(username) {
    return await this.request('deleteAdmin', { username });
  },

  async adminLogin(username, password) {
    return await this.request('adminLogin', { username, password });
  },

  async verifyTotp(code) {
    return await this.request('verifyTotp', { code });
  },

  handleMockLocalGet(action) {
    if (action === 'getAllData') {
      return {
        status: 'success',
        bookings: window.appState ? window.appState.bookings : [],
        rooms: window.appState ? window.appState.rooms : [],
        admins: window.appState ? window.appState.adminAccounts : []
      };
    }
    return [];
  },

  handleMockLocal(action, payload) {
    return { status: 'success', message: 'Local mockup executed', ...payload };
  }
};
