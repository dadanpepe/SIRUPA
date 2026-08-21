const apiService = {
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbxVY3olkned09IuWKbDAVKXfgpT8_JPaFIMPX3F7kV7iTXbS5Y23NQ0HjUB8RHYfDD0QQ/exec',

  sendRequest: async function(action, payload = {}) {
    if (this.appsScriptUrl.includes('AKfycbz...')) {
      return { status: 'success' };
    }
    try {
      const response = await fetch(this.appsScriptUrl, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload })
      });
      const textRes = await response.text();
      try {
        return JSON.parse(textRes);
      } catch(e) {
        return { status: 'success' };
      }
    } catch (err) {
      return { status: 'error', message: err.toString() };
    }
  },

  getAllData: async function() {
    if (this.appsScriptUrl.includes('AKfycbz...')) {
      return { status: 'success', bookings: appState.bookings, rooms: appState.rooms, admins: appState.adminAccounts, announcements: appState.announcementsList };
    }
    try {
      const response = await fetch(`${this.appsScriptUrl}?action=getAllData&_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      const textRes = await response.text();
      try {
        return JSON.parse(textRes);
      } catch(e) {
        return { status: 'success', bookings: appState.bookings, rooms: appState.rooms, admins: appState.adminAccounts, announcements: appState.announcementsList };
      }
    } catch (err) {
      return { status: 'success', bookings: appState.bookings, rooms: appState.rooms, admins: appState.adminAccounts, announcements: appState.announcementsList };
    }
  }
};
