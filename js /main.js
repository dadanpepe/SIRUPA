const appState = {
  isAdminLoggedIn: false,
  activeView: 'dashboard',
  totpTimer: 30,
  currentYear: 2026,
  currentMonth: 7, // August (0-indexed)
  rooms: [
    {
      id: 'room-1',
      name: 'Ruang Rapat Utama',
      category: 'Rapat',
      capacity: '50 Orang',
      available: false,
      statusText: 'Sedang Perbaikan',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: 'fa-triangle-exclamation',
      description: 'Ruangan representatif untuk rapat paripurna, pleno, dan pertemuan besar lintas instansi.',
      features: ['Proyektor 4K', 'Sound System', 'AC Sentral', 'Whiteboard'],
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
      ],
      currentImageIdx: 0
    },
    {
      id: 'room-2',
      name: 'Ruang Rapat VIP',
      category: 'VIP',
      capacity: '15 Orang',
      available: false,
      statusText: 'Tidak Tersedia',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: 'fa-circle-xmark',
      description: 'Ruangan khusus pimpinan dan tamu kehormatan dengan nuansa privat dan elegan.',
      features: ['Smart TV 75"', 'Meja Eksekutif', 'AC', 'LAN Cepat'],
      images: [
        'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80'
      ],
      currentImageIdx: 0
    },
    {
      id: 'room-3',
      name: 'Auditorium Gedung A',
      category: 'Auditorium',
      capacity: '150 Orang',
      available: false,
      statusText: 'Sedang Perbaikan',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: 'fa-triangle-exclamation',
      description: 'Aula luas untuk seminar, sosialisasi, diklat, dan acara seremonial instansi.',
      features: ['Panggung Utama', 'Full Sound & Lighting', 'Projector Besar'],
      images: [
        'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
      ],
      currentImageIdx: 0
    },
    {
      id: 'room-4',
      name: 'Ruang Diskusi Kreatif',
      category: 'Diskusi',
      capacity: '20 Orang',
      available: true,
      statusText: 'Tersedia',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: 'fa-circle-check',
      description: 'Ruangan kolaboratif untuk brainstorming dan tim kerja proyek khusus.',
      features: ['Smart Screen', 'Beanbag', 'WiFi Cepat'],
      images: [
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      ],
      currentImageIdx: 0
    },
    {
      id: 'room-5',
      name: 'Ruang Sidang Pleno',
      category: 'Sidang',
      capacity: '80 Orang',
      available: true,
      statusText: 'Tersedia',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: 'fa-circle-check',
      description: 'Ruang sidang besar dengan konfigurasi meja melingkar dan sistem mikrofon terintegrasi.',
      features: ['Mic Delegasi', 'Perekam Sidang', 'Proyektor Ganda'],
      images: [
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80'
      ],
      currentImageIdx: 0
    }
  ],
  bookings: [
    {
      id: 'PMJ-1029',
      pemohon: 'Ahmad Fauzi',
      unit: 'Bagian Umum',
      kategori: 'Rapat Dinas',
      kegiatan: 'Rapat Koordinasi Triwulan',
      ruangan: 'Ruang Rapat Utama',
      tanggal: '2026-06-15',
      jam: '08:00 - 17:00 WIB',
      peserta: 45,
      catatan: 'Permintaan mic wireless',
      berkasUrl: 'https://drive.google.com/drive/folders/PinTaR_Docs_Sample_1.pdf',
      status: 'Disetujui',
      tahun: 2026,
      timestamp: '2026-06-10 09:30'
    },
    {
      id: 'PMJ-1042',
      pemohon: 'Siti Rahma',
      unit: 'Bappeda & IT',
      kategori: 'Seminar / Sosialisasi',
      kegiatan: 'Sosialisasi Sistem Baru',
      ruangan: 'Auditorium Gedung A',
      tanggal: '2026-08-20',
      jam: '08:00 - 17:00 WIB',
      peserta: 120,
      catatan: 'Proyektor ganda',
      berkasUrl: 'https://drive.google.com/drive/folders/PinTaR_Docs_Sample_2.pdf',
      status: 'Disetujui',
      tahun: 2026,
      timestamp: '2026-08-11 10:15'
    }
  ]
};

let chartInstances = {};

window.onload = function() {
  initClock();
  populateRoomOptions();
  renderRoomCards();
  renderBookingTable();
  updateDashboardCounts();
  renderAdminRoomList();
  renderAdminPendingTable();
  initAnalyticsCharts();
  startTotpCountdown();
  renderCalendar();
  switchView('dashboard');
  loadCloudData();
};

async function loadCloudData() {
  const data = await apiService.fetchBookings();
  if (Array.isArray(data) && data.length > 0) {
    appState.bookings = data;
    renderBookingTable();
    updateDashboardCounts();
    renderAdminPendingTable();
    renderCalendar();
    initAnalyticsCharts();
    renderRoomCards();
  }
}

async function handleBookingSubmit(e) {
  e.preventDefault();

  const pemohon = document.getElementById('inputPemohon').value;
  const unit = document.getElementById('inputUnit').value;
  const kategori = document.getElementById('inputKategori').value;
  const kegiatan = document.getElementById('inputKegiatan').value;
  const ruangan = document.getElementById('inputRuangan').value;
  const tanggal = document.getElementById('inputTanggal').value;
  const jam = document.getElementById('inputJam').value;
  const peserta = parseInt(document.getElementById('inputPeserta').value);
  const catatan = document.getElementById('inputCatatan').value;
  const berkasInput = document.getElementById('inputBerkas');

  const existingConflict = appState.bookings.find(b => 
    b.ruangan === ruangan && 
    b.tanggal === tanggal && 
    b.jam.trim().toLowerCase() === jam.trim().toLowerCase() && 
    b.status === 'Disetujui'
  );

  if (existingConflict) {
    showToast(`Peringatan: Ruangan "${ruangan}" pada tanggal ${tanggal} jam ${jam} sudah ter-booking (${existingConflict.kegiatan}).`, 'error');
    return;
  }

  const newId = 'PMJ-' + Math.floor(1000 + Math.random() * 9000);
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const tahun = new Date(tanggal).getFullYear() || 2026;

  const newBooking = {
    id: newId,
    pemohon,
    unit,
    kategori,
    kegiatan,
    ruangan,
    tanggal,
    jam,
    peserta,
    catatan,
    berkasUrl: 'https://drive.google.com/drive/folders/PinTaR_Docs',
    status: 'Menunggu',
    tahun,
    timestamp
  };

  if (berkasInput && berkasInput.files[0]) {
    const file = berkasInput.files[0];
    const reader = new FileReader();
    reader.onload = async function(uploadEvent) {
      const base64String = uploadEvent.target.result.split(',')[1];
      showToast('Mengirim data ke Google Spreadsheet & mengunggah berkas ke Drive...', 'info');
      const result = await apiService.sendBooking(newBooking, base64String, file.name, file.type);
      if (result.status === 'success') {
        newBooking.id = result.id;
        newBooking.berkasUrl = result.berkasUrl || newBooking.berkasUrl;
      }
      appState.bookings.unshift(newBooking);
      postBookingUIUpdates();
      showToast(`Pengajuan berhasil dikirim (${newBooking.id})`, 'success');
    };
    reader.readAsDataURL(file);
  } else {
    appState.bookings.unshift(newBooking);
    postBookingUIUpdates();
    showToast(`Pengajuan berhasil dikirim (${newBooking.id})`, 'success');
  }
}

function postBookingUIUpdates() {
  renderBookingTable();
  updateDashboardCounts();
  renderAdminPendingTable();
  renderCalendar();
  renderRoomCards();
  closeBookingModal();
  initAnalyticsCharts();
}

async function updateBookingStatusInCloud(bookingId, newStatus) {
  const item = appState.bookings.find(b => b.id === bookingId);
  if (item) {
    item.status = newStatus;
    renderAdminPendingTable();
    renderBookingTable();
    updateDashboardCounts();
    renderCalendar();
    renderRoomCards();

    await apiService.updateStatus(bookingId, newStatus);
    showToast(`Pengajuan ${item.id} telah ${newStatus}`, newStatus === 'Disetujui' ? 'success' : 'warning');
  }
}

function initClock() {
  setInterval(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const clockEl = document.getElementById('liveClock');
    const dateEl = document.getElementById('liveDate');
    if (clockEl) clockEl.innerText = timeStr;
    if (dateEl) dateEl.innerText = dateStr;
  }, 1000);
}

function switchView(viewName) {
  appState.activeView = viewName;

  const viewDashboard = document.getElementById('viewDashboard');
  const viewCheckRoom = document.getElementById('viewCheckRoom');
  const viewAdmin = document.getElementById('viewAdmin');
  const navDashboard = document.getElementById('navDashboard');
  const navCheckRoom = document.getElementById('navCheckRoom');
  const navAdmin = document.getElementById('navAdmin');
  const headerSubtitle = document.getElementById('headerSubtitle');
  const headerTitle = document.getElementById('headerTitle');

  if (viewDashboard) viewDashboard.classList.add('hidden');
  if (viewCheckRoom) viewCheckRoom.classList.add('hidden');
  if (viewAdmin) viewAdmin.classList.add('hidden');

  if (navDashboard) navDashboard.className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all text-slate-600 hover:text-blue-600 cursor-pointer";
  if (navCheckRoom) navCheckRoom.className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all text-slate-600 hover:text-blue-600 cursor-pointer";
  if (navAdmin) navAdmin.className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all text-slate-600 hover:text-blue-600 cursor-pointer";

  if (viewName === 'dashboard') {
    if (viewDashboard) viewDashboard.classList.remove('hidden');
    if (navDashboard) navDashboard.className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-blue-600 text-white shadow-xs cursor-pointer";
    if (headerSubtitle) headerSubtitle.innerText = "Dashboard Utama";
    if (headerTitle) headerTitle.innerHTML = 'PinTaR <span class="text-slate-400 font-normal">| Peminjaman Ruangan</span>';
    updateDashboardCounts();
    setTimeout(initAnalyticsCharts, 200);
  } else if (viewName === 'checkRoom') {
    if (viewCheckRoom) viewCheckRoom.classList.remove('hidden');
    if (navCheckRoom) navCheckRoom.className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-blue-600 text-white shadow-xs cursor-pointer";
    if (headerSubtitle) headerSubtitle.innerText = "Menu Cek Ruangan";
    if (headerTitle) headerTitle.innerHTML = 'PinTaR <span class="text-slate-400 font-normal">| Kalender Ketersediaan</span>';
    renderCalendar();
    renderRoomCards();
  } else if (viewName === 'admin') {
    if (viewAdmin) viewAdmin.classList.remove('hidden');
    if (navAdmin) navAdmin.className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-slate-900 text-white shadow-xs cursor-pointer";
    if (headerSubtitle) headerSubtitle.innerText = "Admin";
    if (headerTitle) headerTitle.innerHTML = 'PinTaR <span class="text-slate-400 font-normal">| Panel Verifikasi</span>';

    const loginContainer = document.getElementById('adminLoginContainer');
    const panelContainer = document.getElementById('adminPanelContainer');

    if (appState.isAdminLoggedIn) {
      if (loginContainer) loginContainer.classList.add('hidden');
      if (panelContainer) panelContainer.classList.remove('hidden');
      renderAdminRoomList();
      renderAdminPendingTable();
    } else {
      if (loginContainer) loginContainer.classList.remove('hidden');
      if (panelContainer) panelContainer.classList.add('hidden');
    }
  }
}

function populateRoomOptions() {
  const modalRoomSelect = document.getElementById('inputRuangan');
  if (!modalRoomSelect) return;
  modalRoomSelect.innerHTML = '';
  appState.rooms.forEach(r => {
    modalRoomSelect.innerHTML += `<option value="${r.name}">${r.name} (Kapasitas: ${r.capacity})</option>`;
  });
}

function updateDashboardCounts() {
  const disetujuiCount = appState.bookings.filter(b => b.status === 'Disetujui').length;
  const menungguCount = appState.bookings.filter(b => b.status === 'Menunggu').length;

  if (document.getElementById('kpiTotalRuangan')) document.getElementById('kpiTotalRuangan').innerText = appState.rooms.length;
  if (document.getElementById('kpiDisetujuiCount')) document.getElementById('kpiDisetujuiCount').innerText = disetujuiCount;
  if (document.getElementById('kpiMenungguCount')) document.getElementById('kpiMenungguCount').innerText = menungguCount;
}

function renderRoomCards() {
  const container = document.getElementById('roomCardsGrid');
  if (!container) return;
  container.innerHTML = '';

  appState.rooms.forEach((room, idx) => {
    const bookingsForRoom = appState.bookings.filter(b => b.ruangan === room.name && b.status === 'Disetujui');
    let isFull = false;

    bookingsForRoom.forEach(b => {
      const jamStr = b.jam.toLowerCase().replace(/\s/g, '');
      if ((jamStr.includes('08:00') || jamStr.includes('08.00')) && (jamStr.includes('17:00') || jamStr.includes('17.00') || jamStr.includes('16:00'))) {
        isFull = true;
      }
    });

    let statusText = room.statusText;
    let badgeClass = room.badgeClass;
    let icon = room.icon;

    if (isFull) {
      statusText = 'Penuh';
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      icon = 'fa-circle-xmark';
    }

    const featuresHtml = room.features.map(f => `
      <span class="inline-flex items-center text-[11px] text-slate-600 font-medium mr-2 mb-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
        <i class="fa-solid fa-check text-emerald-600 mr-1.5 text-xs"></i> ${f}
      </span>
    `).join('');

    const currentImg = room.images[room.currentImageIdx || 0];

    container.innerHTML += `
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between">
        <div>
          <div class="relative h-56 w-full overflow-hidden bg-slate-100 group">
            <img id="room-img-${idx}" src="${currentImg}" alt="${room.name}" class="w-full h-full object-cover transition-all duration-300" onerror="this.src='https://placehold.co/800x400/e2e8f0/64748b?text=Ruangan'">
            <span class="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center shadow-sm">
              <i class="fa-solid fa-users text-blue-600 mr-2"></i> Kapasitas ${room.capacity}
            </span>
            <button onclick="prevRoomImage(${idx})" class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/60 cursor-pointer">
              <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button onclick="nextRoomImage(${idx})" class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/60 cursor-pointer">
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>

          <div class="p-6 space-y-3">
            <h4 class="text-lg font-bold text-slate-900">${room.name}</h4>
            <p class="text-xs text-slate-500 leading-relaxed">${room.description}</p>
            <div class="flex flex-wrap pt-1">${featuresHtml}</div>
          </div>
        </div>
        
        <div class="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-3 pt-4">
          <span class="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border ${badgeClass}">
            <i class="fa-solid ${icon} mr-1.5"></i> ${statusText}
          </span>
          <button onclick="openBookingModalForRoom('${room.name}')" class="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-2xl text-xs transition cursor-pointer shadow-2xs">
            Pinjam Ruangan
          </button>
        </div>
      </div>
    `;
  });
}

function openBookingModalForRoom(roomName) {
  openBookingModal();
  const roomSelect = document.getElementById('inputRuangan');
  if (roomSelect) {
    roomSelect.value = roomName;
  }
}

function prevRoomImage(roomIdx) {
  const room = appState.rooms[roomIdx];
  room.currentImageIdx = (room.currentImageIdx - 1 + room.images.length) % room.images.length;
  const imgEl = document.getElementById(`room-img-${roomIdx}`);
  if (imgEl) imgEl.src = room.images[room.currentImageIdx];
}

function nextRoomImage(roomIdx) {
  const room = appState.rooms[roomIdx];
  room.currentImageIdx = (room.currentImageIdx + 1) % room.images.length;
  const imgEl = document.getElementById(`room-img-${roomIdx}`);
  if (imgEl) imgEl.src = room.images[room.currentImageIdx];
}

function renderBookingTable(filteredList = null) {
  const list = filteredList || appState.bookings;
  const tbody = document.getElementById('bookingTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 font-medium">Tidak ada data peminjaman ditemukan.</td></tr>`;
    return;
  }

  list.forEach(item => {
    let statusBadge = '';
    if (item.status === 'Disetujui') {
      statusBadge = `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-check mr-1.5"></i> Disetujui</span>`;
    } else if (item.status === 'Menunggu') {
      statusBadge = `<span class="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-hourglass mr-1.5"></i> Menunggu</span>`;
    } else if (item.status === 'Dibatalkan') {
      statusBadge = `<span class="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-ban mr-1.5"></i> Dibatalkan</span>`;
    } else {
      statusBadge = `<span class="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-xmark mr-1.5"></i> Ditolak</span>`;
    }

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/80 transition">
        <td class="p-4 pl-6">
          <span class="font-bold text-blue-600">${item.id}</span>
          <div class="text-[11px] text-slate-400 font-normal mt-0.5">${item.pemohon}</div>
        </td>
        <td class="p-4 font-bold text-slate-800">${item.kegiatan}</td>
        <td class="p-4 text-slate-600 font-medium">${item.ruangan}</td>
        <td class="p-4">
          <div class="font-medium text-slate-700">${item.tanggal}</div>
          <div class="text-[11px] text-slate-400 font-normal mt-0.5">${item.jam}</div>
        </td>
        <td class="p-4">
          <a href="${item.berkasUrl || '#'}" target="_blank" class="inline-flex items-center text-blue-600 hover:underline font-semibold">
            <i class="fa-brands fa-google-drive mr-1.5 text-sm"></i> Drive Folder
          </a>
        </td>
        <td class="p-4 pr-6">${statusBadge}</td>
      </tr>
    `;
  });
}

function filterBookingTable() {
  const searchInput = document.getElementById('searchTableInput');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase();
  const filtered = appState.bookings.filter(b => 
    b.pemohon.toLowerCase().includes(query) ||
    b.kegiatan.toLowerCase().includes(query) ||
    b.ruangan.toLowerCase().includes(query) ||
    b.unit.toLowerCase().includes(query)
  );
  renderBookingTable(filtered);
}

function openBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.remove('hidden');
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  const form = document.getElementById('bookingForm');
  if (modal) modal.classList.add('hidden');
  if (form) form.reset();
}

function openCancelModal() {
  const modal = document.getElementById('cancelBookingModal');
  if (modal) modal.classList.remove('hidden');
}

function closeCancelModal() {
  const modal = document.getElementById('cancelBookingModal');
  if (modal) modal.classList.add('hidden');
  const formId = document.getElementById('cancelBookingId');
  const formReason = document.getElementById('cancelReason');
  if (formId) formId.value = '';
  if (formReason) formReason.value = '';
}

function handleCancelBookingSubmit(e) {
  e.preventDefault();
  const bookingIdInput = document.getElementById('cancelBookingId').value.trim().toUpperCase();

  const bookingItem = appState.bookings.find(b => b.id.toUpperCase() === bookingIdInput);

  if (!bookingItem) {
    showToast(`ID Peminjaman "${bookingIdInput}" tidak ditemukan dalam sistem.`, 'error');
    return;
  }

  if (bookingItem.status === 'Dibatalkan') {
    showToast(`Peminjaman dengan ID ${bookingItem.id} sudah pernah dibatalkan sebelumnya.`, 'warning');
    return;
  }

  bookingItem.status = 'Dibatalkan';

  renderBookingTable();
  updateDashboardCounts();
  renderAdminPendingTable();
  renderRoomCards();
  renderCalendar();
  initAnalyticsCharts();

  closeCancelModal();
  showToast(`Peminjaman ${bookingItem.id} berhasil dibatalkan. Agenda otomatis dihapus dari kalender.`, 'success');
}

function initAnalyticsCharts() {
  const roomCounts = {};
  appState.rooms.forEach(r => roomCounts[r.name] = 0);
  appState.bookings.filter(b => b.status === 'Disetujui').forEach(b => {
    if (roomCounts[b.ruangan] !== undefined) roomCounts[b.ruangan]++;
    else roomCounts[b.ruangan] = 1;
  });

  if (chartInstances.penggunaan) chartInstances.penggunaan.destroy();
  const ctx1 = document.getElementById('chartPenggunaanRuangan');
  if (ctx1) {
    chartInstances.penggunaan = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: Object.keys(roomCounts),
        datasets: [{
          data: Object.values(roomCounts),
          backgroundColor: ['#2563eb', '#38bdf8', '#6366f1', '#f59e0b', '#10b981']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
    });
  }

  const years = [2024, 2025, 2026];
  const yearCounts = years.map(yr => appState.bookings.filter(b => b.tahun === yr && b.status === 'Disetujui').length + (yr === 2026 ? 1 : 0));

  if (chartInstances.tahunan) chartInstances.tahunan.destroy();
  const ctx2 = document.getElementById('chartPemakaianTahun');
  if (ctx2) {
    chartInstances.tahunan = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Total Kegiatan Selesai',
          data: yearCounts,
          backgroundColor: '#3b82f6',
          borderRadius: 8
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }

  const categories = ['Rapat Dinas', 'Seminar / Sosialisasi', 'Workshop', 'Diklat / Pelatihan'];
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ec4899'];
  const datasetsPeserta = categories.map((cat, idx) => ({
    label: cat,
    data: years.map(yr => appState.bookings.filter(b => b.tahun === yr && b.kategori === cat).reduce((sum, curr) => sum + curr.peserta, 40)),
    backgroundColor: colors[idx % colors.length],
    borderRadius: 6
  }));

  if (chartInstances.peserta) chartInstances.peserta.destroy();
  const ctx3 = document.getElementById('chartPesertaKategori');
  if (ctx3) {
    chartInstances.peserta = new Chart(ctx3, {
      type: 'bar',
      data: { labels: years, datasets: datasetsPeserta },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
    });
  }

  const unitCounts = { 'Bagian Umum': 3, 'Bappeda & IT': 2, 'Diskominfo': 2, 'BKPSDM': 1 };

  if (chartInstances.unit) chartInstances.unit.destroy();
  const ctx4 = document.getElementById('chartUnit');
  if (ctx4) {
    chartInstances.unit = new Chart(ctx4, {
      indexAxis: 'y',
      type: 'bar',
      data: {
        labels: Object.keys(unitCounts),
        datasets: [{
          label: 'Frekuensi Pinjam',
          data: Object.values(unitCounts),
          backgroundColor: '#6366f1',
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');

  let icon = 'fa-info-circle text-blue-500';
  let border = 'border-blue-200';

  if (type === 'success') {
    icon = 'fa-circle-check text-emerald-500';
    border = 'border-emerald-200';
  } else if (type === 'warning') {
    icon = 'fa-triangle-exclamation text-amber-500';
    border = 'border-amber-200';
  } else if (type === 'error') {
    icon = 'fa-circle-xmark text-rose-500';
    border = 'border-rose-200';
  }

  toast.className = `bg-white border ${border} shadow-lg rounded-2xl p-3.5 flex items-center space-x-3 text-xs font-semibold text-slate-800 transition transform translate-y-2 opacity-0`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-base shrink-0"></i>
    <span class="flex-grow">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 50);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
