/**
 * PinTaR - API Service untuk Menghubungkan Frontend dengan Google Apps Script Backend
 */
const apiService = {
  // Masukkan URL Web App Google Apps Script Anda di sini setelah di-Deploy (contoh: https://script.google.com/macros/s/.../exec)
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbymzY6zWTCIWWr68d7We0kXCqmbVFHdnxeaScc9gbgE5-fLCUvmfWG1ku0pVXjnm5-j/exec',

  async fetchBookings() {
    if (this.appsScriptUrl.includes('AKfycbz...')) return null;
    try {
      const response = await fetch(this.appsScriptUrl + '?action=getBookings');
      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch (err) {
      console.error('Gagal mengambil data dari Google Spreadsheet:', err);
      return null;
    }
  },

  async fetchRooms() {
    if (this.appsScriptUrl.includes('AKfycbz...')) return null;
    try {
      const response = await fetch(this.appsScriptUrl + '?action=getRooms');
      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch (err) {
      console.error('Gagal mengambil data Ruangan:', err);
      return null;
    }
  },

  async adminLogin(username, password) {
    if (this.appsScriptUrl.includes('AKfycbz...')) {
      // Fallback lokal jika URL belum di-set
      if (username === 'superadmin' && password === 'super123') {
        return { success: true, user: { username: 'superadmin', name: 'Super Admin', unit: 'Semua Dinas', isSuper: true } };
      }
      return { success: false, message: 'URL Apps Script belum dikonfigurasi.' };
    }
    try {
      const response = await fetch(this.appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'adminLogin', username, password })
      });
      return await response.json();
    } catch (err) {
      return { success: false, message: err.toString() };
    }
  },

  async addAdmin(adminData) {
    if (this.appsScriptUrl.includes('AKfycbz...')) return { status: 'success' };
    try {
      const response = await fetch(this.appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'addAdmin', ...adminData })
      });
      return await response.json();
    } catch (err) {
      return { status: 'error', message: err.toString() };
    }
  },

  async sendBooking(bookingPayload, fileBase64, fileName, fileMimeType) {
    if (this.appsScriptUrl.includes('AKfycbz...')) {
      return { status: 'success', id: 'PMJ-' + Math.floor(1000 + Math.random() * 9000), berkasUrl: 'https://drive.google.com/drive/folders/PinTaR_Docs' };
    }
    try {
      const payload = {
        action: 'addBooking',
        ...bookingPayload,
        fileBase64: fileBase64 || '',
        fileName: fileName || '',
        fileMimeType: fileMimeType || ''
      };
      const response = await fetch(this.appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err) {
      console.error(err);
      return { status: 'error', message: err.toString() };
    }
  },

  async updateStatus(bookingId, status) {
    if (this.appsScriptUrl.includes('AKfycbz...')) return;
    try {
      await fetch(this.appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateStatus', id: bookingId, status: status })
      });
    } catch (e) {
      console.error(e);
    }
  },

  async verifyTotp(code) {
    if (this.appsScriptUrl.includes('AKfycbz...')) return /^\d{6}$/.test(code);
    try {
      const response = await fetch(this.appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'verifyTotp', code: code })
      });
      const res = await response.json();
      return res.success === true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
