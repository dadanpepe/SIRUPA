const apiService = {
  // Ganti URL di bawah ini dengan URL Web App Google Apps Script Anda
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbz.../exec',

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

  async sendBooking(bookingPayload, fileBase64, fileName, fileMimeType) {
    if (this.appsScriptUrl.includes('AKfycbz...')) {
      return { success: false, message: 'URL Apps Script belum diatur.' };
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
      return { success: false, message: err.toString() };
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
    if (this.appsScriptUrl.includes('AKfycbz...')) return false;
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
