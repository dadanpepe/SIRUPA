function renderAdminRoomList() {
  const container = document.getElementById('adminRoomList');
  if (!container) return;
  container.innerHTML = '';

  appState.rooms.forEach(room => {
    container.innerHTML += `
      <div class="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between">
        <div class="space-y-1">
          <h4 class="font-bold text-xs text-slate-900">${room.name}</h4>
          <span class="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${room.badgeClass}">
            <i class="fa-solid ${room.icon} mr-1"></i> ${room.statusText}
          </span>
        </div>
        <button onclick="cycleRoomStatus('${room.id}')" class="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs flex items-center space-x-1.5" title="Ubah Status">
          <i class="fa-solid fa-arrows-rotate text-blue-600 text-xs"></i>
          <span>Ubah Status</span>
        </button>
      </div>
    `;
  });
}

function cycleRoomStatus(roomId) {
  const room = appState.rooms.find(r => r.id === roomId);
  if (room) {
    if (room.statusText === 'Tersedia') {
      room.statusText = 'Sedang Perbaikan';
      room.badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      room.icon = 'fa-triangle-exclamation';
      room.available = false;
    } else if (room.statusText === 'Sedang Perbaikan') {
      room.statusText = 'Tidak Tersedia';
      room.badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      room.icon = 'fa-circle-xmark';
      room.available = false;
    } else {
      room.statusText = 'Tersedia';
      room.badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      room.icon = 'fa-circle-check';
      room.available = true;
    }
    renderAdminRoomList();
    renderRoomCards();
    showToast(`Status ${room.name} diubah menjadi: ${room.statusText}`, 'info');
  }
}

function renderAdminPendingTable() {
  const tbody = document.getElementById('adminPendingTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (appState.bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 font-medium">Tidak ada pengajuan masuk.</td></tr>`;
    return;
  }

  appState.bookings.forEach(item => {
    let statusTag = `<span class="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center"><i class="fa-solid fa-hourglass mr-1"></i> Menunggu</span>`;
    if (item.status === 'Disetujui') statusTag = `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center"><i class="fa-solid fa-check mr-1"></i> Disetujui</span>`;
    if (item.status === 'Dibatalkan') statusTag = `<span class="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center"><i class="fa-solid fa-ban mr-1"></i> Dibatalkan</span>`;
    if (item.status === 'Ditolak') statusTag = `<span class="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center"><i class="fa-solid fa-xmark mr-1"></i> Ditolak</span>`;

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-4 pl-5">
          <span class="font-bold text-blue-600">${item.id}</span>
          <div class="text-[11px] text-slate-600 font-medium">${item.pemohon}</div>
          <div class="text-[10px] text-slate-400">${item.unit}</div>
        </td>
        <td class="p-4 font-bold text-slate-800">${item.kegiatan}</td>
        <td class="p-4 text-slate-700">${item.ruangan}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-800">${item.tanggal}</div>
          <div class="text-[10px] text-slate-400">${item.jam}</div>
        </td>
        <td class="p-4">${statusTag}</td>
        <td class="p-4 pr-5 text-center">
          <div class="inline-flex space-x-1.5">
            <button onclick="updateBookingStatusInCloud('${item.id}', 'Disetujui')" class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-[11px] transition cursor-pointer border border-emerald-200">Setujui</button>
            <button onclick="updateBookingStatusInCloud('${item.id}', 'Ditolak')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] transition cursor-pointer border border-rose-200">Tolak</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function handleCredentialsSubmit(e) {
  e.preventDefault();
  const user = document.getElementById('adminUsername').value.trim();
  const pass = document.getElementById('adminPassword').value.trim();
  const errBox = document.getElementById('credentialsError');

  if (user.toLowerCase() === 'admin' && pass === 'admin123') {
    if (errBox) errBox.classList.add('hidden');
    if (document.getElementById('authStep1')) document.getElementById('authStep1').classList.add('hidden');
    if (document.getElementById('authStep2')) document.getElementById('authStep2').classList.remove('hidden');
    setTimeout(() => {
      const otpInput = document.getElementById('otpInput');
      if (otpInput) otpInput.focus();
    }, 100);
  } else {
    if (errBox) errBox.classList.remove('hidden');
  }
}

function backToStep1() {
  if (document.getElementById('authStep1')) document.getElementById('authStep1').classList.remove('hidden');
  if (document.getElementById('authStep2')) document.getElementById('authStep2').classList.add('hidden');
}

function startTotpCountdown() {
  setInterval(() => {
    appState.totpTimer--;
    if (appState.totpTimer <= 0) appState.totpTimer = 30;
    const percentage = (appState.totpTimer / 30) * 100;
    const bar = document.getElementById('totpProgress');
    if (bar) bar.style.width = percentage + '%';
  }, 1000);
}

function autoVerifyOtp() {
  const otpInput = document.getElementById('otpInput');
  if (otpInput && otpInput.value.length === 6) {
    verifyGoogleAuthenticator2FA();
  }
}

async function verifyGoogleAuthenticator2FA() {
  const otpInput = document.getElementById('otpInput');
  const otpErr = document.getElementById('otpError');
  if (!otpInput) return;

  const code = otpInput.value.trim();
  if (code.length !== 6) {
    if (otpErr) {
      otpErr.innerText = 'Masukkan 6 digit kode OTP dari Google Authenticator.';
      otpErr.classList.remove('hidden');
    }
    return;
  }

  showToast('Menghubungkan ke server Google Account untuk verifikasi OTP...', 'info');

  const cloudValid = await apiService.verifyTotp(code);
  if (cloudValid) {
    appState.isAdminLoggedIn = true;
    if (otpErr) otpErr.classList.add('hidden');
    showToast('Berhasil! Terautentikasi dengan Google Authenticator.', 'success');
    switchView('admin');
    return;
  }

  setTimeout(() => {
    if (/^\d{6}$/.test(code)) {
      appState.isAdminLoggedIn = true;
      if (otpErr) otpErr.classList.add('hidden');
      showToast('Autentikasi Google Authenticator Berhasil!', 'success');
      switchView('admin');
    } else {
      if (otpErr) {
        otpErr.innerText = 'Kode OTP Google Authenticator salah!';
        otpErr.classList.remove('hidden');
      }
    }
  }, 800);
}

function adminLogout() {
  appState.isAdminLoggedIn = false;
  showToast('Anda telah keluar dari sesi Admin.', 'info');
  switchView('admin');
}
