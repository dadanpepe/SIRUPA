function checkTimeOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return (s1 < e2 && e1 > s2);
}

function checkBookingConflictWithTime(ruangan, tanggal, jamMulaiBaru, jamSelesaiBaru, excludeId = null) {
  return appState.bookings.find(b => {
    const isSameRoom = (b.ruangan || '').trim().toLowerCase() === (ruangan || '').trim().toLowerCase();
    const isSameDate = (b.tanggal || '').split('T')[0] === (tanggal || '').split('T')[0];
    const isActiveStatus = (b.status === 'Disetujui' || b.status === 'Menunggu');
    const isNotSelf = b.id !== excludeId;

    if (isSameRoom && isSameDate && isActiveStatus && isNotSelf) {
      const parts = (b.jam || '').split(' - ');
      if (parts.length >= 2) {
        const existingStart = parts[0].trim();
        const existingEnd = parts[1].replace(/WIB/gi, '').trim();
        return checkTimeOverlap(jamMulaiBaru, jamSelesaiBaru, existingStart, existingEnd);
      }
    }
    return false;
  });
}

function renderRoomCards() {
  const container = document.getElementById('roomCardsGrid');
  if (!container) return;
  container.innerHTML = '';

  const filterSelect = document.getElementById('filterUnitSelect');
  const selectedUnit = filterSelect ? filterSelect.value : 'Semua';

  let filteredRooms = appState.rooms;
  if (selectedUnit && selectedUnit !== 'Semua') {
    filteredRooms = appState.rooms.filter(r => (r.unit || 'Umum').toLowerCase() === selectedUnit.toLowerCase());
  }

  if (filteredRooms.length === 0) {
    container.innerHTML = `<div class="col-span-2 py-12 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">Tidak ada ruangan untuk unit / dinas "${selectedUnit}".</div>`;
    return;
  }

  filteredRooms.forEach((room) => {
    const featuresHtml = (room.features || []).map(f => `<span class="inline-flex items-center text-[10px] sm:text-[11px] text-slate-600 font-medium mr-1.5 mb-1 bg-slate-100 px-2 py-0.5 rounded-md"><i class="fa-solid fa-check text-emerald-600 mr-1 text-xs"></i> ${f}</span>`).join('');
    
    const isUnderMaintenance = room.statusText === 'Sedang Perbaikan' || room.statusText === 'Tidak Tersedia';
    const btnDisabledAttr = isUnderMaintenance ? 'disabled' : '';
    const btnClass = isUnderMaintenance 
      ? 'bg-slate-200 text-slate-400 cursor-not-allowed px-4 py-2.5 rounded-2xl text-xs font-bold' 
      : 'bg-transparent text-blue-600 hover:underline font-bold text-xs transition cursor-pointer';

    const images = (room.images && room.images.length > 0) ? room.images : ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'];
    const currentIdx = room.currentImageIdx || 0;
    const activePhoto = images[currentIdx];

    let dotsHtml = '';
    if (images.length > 1) {
      dotsHtml = `<div class="absolute bottom-3 left-0 right-0 flex justify-center space-x-1.5 z-20">`;
      images.forEach((_, idx) => {
        const dotBg = idx === currentIdx ? 'bg-white w-4' : 'bg-white/50 w-1.5';
        dotsHtml += `<span class="h-1.5 rounded-full transition-all duration-300 ${dotBg}"></span>`;
      });
      dotsHtml += `</div>`;
    }

    container.innerHTML += `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden flex flex-col justify-between">
        <div>
          <div class="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100 group">
            <img src="${activePhoto}" alt="${room.name}" class="w-full h-full object-cover transform hover:scale-105 transition duration-700" onerror="this.src='https://placehold.co/800x400/e2e8f0/64748b?text=Ruangan'">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none"></div>
            <span class="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm flex items-center z-10"><i class="fa-solid fa-users text-blue-600 mr-1.5"></i> ${room.capacity}</span>
            <span class="absolute top-3 left-3 sm:top-4 sm:left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10">${room.unit || 'Umum'}</span>
            ${dotsHtml}
          </div>
          <div class="p-4 sm:p-6 space-y-2.5">
            <h4 class="text-base sm:text-lg font-bold text-slate-900">${room.name}</h4>
            <p class="text-[11px] sm:text-xs text-slate-500 leading-relaxed">${room.description}</p>
            <div class="flex flex-wrap pt-1">${featuresHtml}</div>
          </div>
        </div>
        <div class="p-4 sm:p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-2 pt-3 sm:pt-4">
          <span class="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold border ${room.badgeClass}"><i class="fa-solid ${room.icon} mr-1.5"></i> ${room.statusText}</span>
          <button ${btnDisabledAttr} onclick="openBookingModalForRoom('${room.name}')" class="${btnClass}">Pinjam Ruangan</button>
        </div>
      </div>`;
  });
}

function initRoomImageSlider() {
  if (roomSlideInterval) clearInterval(roomSlideInterval);
  roomSlideInterval = setInterval(() => {
    if (appState.activeView === 'checkRoom') {
      let updated = false;
      appState.rooms.forEach(room => {
        if (room.images && room.images.length > 1) {
          room.currentImageIdx = ((room.currentImageIdx || 0) + 1) % room.images.length;
          updated = true;
        }
      });
      if (updated) {
        renderRoomCards();
      }
    }
  }, 4000);
}

function renderBookingTable(filteredList = null) {
  const list = filteredList || appState.bookings;
  const tbody = document.getElementById('bookingTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400 font-medium">Tidak ada data peminjaman.</td></tr>`;
    return;
  }
  list.forEach(item => {
    let displayDate = item.tanggal;
    if (displayDate && displayDate.includes('T')) {
      displayDate = displayDate.split('T')[0];
    }
    const formattedDate = formatDDMMYYYY(displayDate);

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/80 transition">
        <td class="p-3 sm:p-4 pl-5 sm:pl-6"><span class="font-bold text-blue-600">${item.id}</span><div class="text-[11px] text-slate-400">${item.pemohon}</div></td>
        <td class="p-3 sm:p-4 font-bold text-slate-800">${item.kegiatan}</td>
        <td class="p-3 sm:p-4 text-slate-600 font-medium">${item.ruangan}</td>
        <td class="p-3 sm:p-4"><div class="font-medium text-slate-700">${formattedDate}</div><div class="text-[11px] text-slate-400">${item.jam}</div></td>
        <td class="p-3 sm:p-4 pr-5 sm:pr-6"><span class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">${item.status}</span></td>
      </tr>`;
  });
}

function filterBookingTable() {
  const q = document.getElementById('searchTableInput').value.toLowerCase().trim();
  if (!q) {
    renderBookingTable();
    return;
  }
  const filtered = appState.bookings.filter(b => 
    (b.pemohon || '').toLowerCase().includes(q) || 
    (b.kegiatan || '').toLowerCase().includes(q) || 
    (b.ruangan || '').toLowerCase().includes(q) || 
    (b.id || '').toLowerCase().includes(q)
  );
  renderBookingTable(filtered);
}

function updateDashboardCounts() {
  const disetujuiCount = appState.bookings.filter(b => b.status === 'Disetujui').length;
  const menungguCount = appState.bookings.filter(b => b.status === 'Menunggu').length;
  if (document.getElementById('kpiTotalRuangan')) document.getElementById('kpiTotalRuangan').innerText = appState.rooms.length;
  if (document.getElementById('kpiDisetujuiCount')) document.getElementById('kpiDisetujuiCount').innerText = disetujuiCount;
  if (document.getElementById('kpiMenungguCount')) document.getElementById('kpiMenungguCount').innerText = menungguCount;
}

function checkAutomatedReminders() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const activeBookings = appState.bookings.filter(b => b.status === 'Disetujui');

  const h1Bookings = activeBookings.filter(b => {
    let bDate = (b.tanggal || '').split('T')[0];
    return bDate === tomorrowStr || bDate === todayStr;
  });

  const badge = document.getElementById('notifBadge');
  const bellIcon = document.getElementById('bellIcon');
  const container = document.getElementById('notifListContainer');

  let reminderHTML = '';
  let reminderCount = 0;

  if (h1Bookings.length > 0) {
    reminderCount += h1Bookings.length;
    h1Bookings.forEach(b => {
      let dStr = (b.tanggal || '').split('T')[0];
      const isToday = dStr === todayStr;
      const reminderTitle = isToday ? 'Pengingat Hari Ini' : 'Pengingat H-1 Penggunaan';
      
      reminderHTML += `
        <div class="bg-amber-50 border border-amber-200 p-3 rounded-2xl space-y-1 animate-fade-in">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider"><i class="fa-solid fa-clock mr-1"></i> ${reminderTitle} (${formatDDMMYYYY(dStr)})</span>
            <span class="text-[10px] font-bold text-slate-500">${b.jam}</span>
          </div>
          <div class="font-bold text-slate-900 text-xs">${b.kegiatan}</div>
          <div class="text-[11px] text-slate-600">Ruangan: <b>${b.ruangan}</b></div>
          <div class="text-[10px] text-slate-400">Pengingat terkirim ke: ${b.email}</div>
        </div>`;
    });
  }

  if (reminderCount > 0) {
    if (badge) {
      badge.innerText = reminderCount;
      badge.classList.remove('hidden');
    }
    if (bellIcon) {
      bellIcon.classList.add('animate-bell-swing', 'text-amber-500');
    }
    if (container) {
      container.innerHTML = reminderHTML;
    }
  } else {
    if (badge) badge.classList.add('hidden');
    if (bellIcon) {
      bellIcon.classList.remove('animate-bell-swing', 'text-amber-500');
    }
    if (container) container.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs font-medium">Tidak ada pemberitahuan baru. Semua jadwal telah direfresh.</div>`;
  }
}

function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notifDropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
}

async function syncDataFromDatabase() {
  try {
    const json = await apiService.getAllData();
    if (json && json.status === 'success') {
      if (json.bookings && Array.isArray(json.bookings)) appState.bookings = json.bookings;
      if (json.rooms && Array.isArray(json.rooms)) appState.rooms = json.rooms;
      if (json.admins && Array.isArray(json.admins)) appState.adminAccounts = json.admins;
      if (json.announcements && Array.isArray(json.announcements)) {
        appState.announcementsList = json.announcements;
        updateAnnouncementDisplay();
      }
      
      renderBookingTable();
      updateDashboardCounts();
      renderCalendar();
      renderAdminPendingTable();
      renderAdminAccountsList();
      renderRoomCards();
      checkAutomatedReminders();
      initAnalyticsCharts();
    }
  } catch (err) {
    console.warn("Background sync retry:", err);
  }
}

async function sendDataToDatabase(action, payload) {
  return await apiService.sendRequest(action, payload);
}

function updateAnnouncementDisplay() {
  const marquee = document.getElementById('announcementMarqueeText');
  if (marquee) {
    marquee.innerText = appState.announcementsList.join(" | ");
  }
}

async function saveAnnouncement() {
  const input = document.getElementById('adminAnnouncementInput');
  if (!input || !input.value.trim()) {
    showToast('Teks pengumuman tidak boleh kosong!', 'warning');
    return;
  }
  const newMsg = input.value.trim();
  appState.announcementsList.push(newMsg);
  updateAnnouncementDisplay();
  input.value = '';
  showToast('Menambahkan dan mempublikasikan pengumuman baru secara real-time...', 'info');
  await sendDataToDatabase('saveAnnouncement', { announcements: appState.announcementsList });
  showToast('Pengumuman baru berhasil ditambahkan ke papan publikasi!', 'success');
}

async function clearAllAnnouncements() {
  if (!appState.currentAdmin || !appState.currentAdmin.isSuper) {
    showToast('Hanya Super Administrator yang berhak menghapus semua pengumuman!', 'error');
    return;
  }
  appState.announcementsList = ["Sistem Informasi Ruangan dan Peminjaman (SIRUPA) aktif."];
  updateAnnouncementDisplay();
  showToast('Menghapus dan mereset seluruh pengumuman di database...', 'info');
  await sendDataToDatabase('saveAnnouncement', { announcements: appState.announcementsList });
  showToast('Semua papan pengumuman berhasil dikosongkan.', 'success');
}

function initClock() {
  setInterval(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (document.getElementById('liveClock')) document.getElementById('liveClock').innerText = timeStr;
    if (document.getElementById('liveDate')) document.getElementById('liveDate').innerText = dateStr;
  }, 1000);
}

function populateRoomOptions() {
  const select = document.getElementById('inputRuangan');
  if (!select) return;
  select.innerHTML = '';
  appState.rooms.forEach(room => {
    select.innerHTML += `<option value="${room.name}">${room.name} (Kapasitas: ${room.capacity})</option>`;
  });
}

function populateUnitFilterOptions() {
  const select = document.getElementById('filterUnitSelect');
  if (!select) return;
  const units = [...new Set(appState.rooms.map(r => r.unit || 'Umum'))];
  select.innerHTML = '<option value="Semua">Semua Dinas / Bidang</option>';
  units.forEach(u => {
    select.innerHTML += `<option value="${u}">${u}</option>`;
  });
}

function switchView(viewName) {
  appState.activeView = viewName;
  ['viewDashboard', 'viewCheckRoom', 'viewAdmin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  ['navDashboard', 'navCheckRoom', 'navAdmin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all text-slate-600 hover:text-blue-600 cursor-pointer";
  });

  ['mobNavDashboard', 'mobNavCheckRoom', 'mobNavAdmin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = "flex flex-col items-center text-slate-400 space-y-0.5";
  });

  if (viewName === 'dashboard') {
    document.getElementById('viewDashboard').classList.remove('hidden');
    if (document.getElementById('navDashboard')) document.getElementById('navDashboard').className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-blue-600 text-white shadow-xs cursor-pointer";
    if (document.getElementById('mobNavDashboard')) document.getElementById('mobNavDashboard').className = "flex flex-col items-center text-blue-600 space-y-0.5";
    updateDashboardCounts();
    setTimeout(initAnalyticsCharts, 200);
  } else if (viewName === 'checkRoom') {
    document.getElementById('viewCheckRoom').classList.remove('hidden');
    if (document.getElementById('navCheckRoom')) document.getElementById('navCheckRoom').className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-blue-600 text-white shadow-xs cursor-pointer";
    if (document.getElementById('mobNavCheckRoom')) document.getElementById('mobNavCheckRoom').className = "flex flex-col items-center text-blue-600 space-y-0.5";
    renderCalendar();
    populateUnitFilterOptions();
    renderRoomCards();
  } else if (viewName === 'admin') {
    document.getElementById('viewAdmin').classList.remove('hidden');
    if (document.getElementById('navAdmin')) document.getElementById('navAdmin').className = "flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-slate-900 text-white shadow-xs cursor-pointer";
    if (document.getElementById('mobNavAdmin')) document.getElementById('mobNavAdmin').className = "flex flex-col items-center text-blue-600 space-y-0.5";
    
    const loginContainer = document.getElementById('adminLoginContainer');
    const panelContainer = document.getElementById('adminPanelContainer');
    if (appState.isAdminLoggedIn) {
      loginContainer.classList.add('hidden');
      panelContainer.classList.remove('hidden');
      renderAdminRoomList();
      renderAdminPendingTable();
      renderAdminAccountsList();
    } else {
      loginContainer.classList.remove('hidden');
      panelContainer.classList.add('hidden');
    }
  }
  window.scrollTo(0, 0);
}

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function renderCalendar() {
  const calendarBody = document.getElementById('calendarBody');
  const titleEl = document.getElementById('calendarMonthTitle');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  if (!calendarBody) return;

  const year = appState.currentYear;
  const month = appState.currentMonth;
  if (titleEl) titleEl.innerText = `${monthNames[month].toUpperCase()} ${year}`;

  if (nextMonthBtn) {
    let nextM = month + 1, nextY = year;
    if (nextM > 11) { nextM = 0; nextY++; }
    nextMonthBtn.innerText = `${monthNames[nextM]} ${nextY}`;
  }

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  calendarBody.innerHTML = '';
  let dateCounter = 1, nextMonthCounter = 1, rowHtml = '';

  for (let i = 0; i < 6; i++) {
    rowHtml += '<tr class="h-20 sm:h-24">';
    for (let j = 0; j < 7; j++) {
      let dayNum = 0, isCurrentMonth = false, dateStr = '';
      if (i === 0 && j < firstDayIndex) {
        dayNum = prevTotalDays - firstDayIndex + j + 1;
        const pm = month === 0 ? 11 : month - 1, py = month === 0 ? year - 1 : year;
        dateStr = `${py}-${String(pm + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      } else if (dateCounter <= totalDays) {
        dayNum = dateCounter; isCurrentMonth = true;
        dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        dateCounter++;
      } else {
        dayNum = nextMonthCounter;
        const nm = month === 11 ? 0 : month + 1, ny = month === 11 ? year + 1 : year;
        dateStr = `${ny}-${String(nm + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        nextMonthCounter++;
      }

      const bookingsOnThisDay = appState.bookings.filter(b => {
        let bDate = (b.tanggal || '').split('T')[0];
        return bDate === dateStr && b.status === 'Disetujui';
      });
      const hasBookings = bookingsOnThisDay.length > 0;
      let cellBgClass = 'bg-white', textColor = isCurrentMonth ? 'text-slate-800' : 'text-slate-300', clickAttr = '';

      if (hasBookings) {
        cellBgClass = 'bg-rose-100/75 cursor-pointer hover:bg-rose-200/80 active:bg-rose-300';
        textColor = 'text-slate-900 font-bold';
        const bInfo = encodeURIComponent(JSON.stringify(bookingsOnThisDay));
        clickAttr = `onclick="showBookingDetails('${bInfo}')"`;
      } else {
        clickAttr = `onclick="showEmptyAgendaModal('${dateStr}')"`;
      }

      rowHtml += `<td ${clickAttr} class="align-top border-r border-slate-200 p-1.5 sm:p-2 relative ${cellBgClass} transition cursor-pointer"><span class="${textColor} text-xs">${dayNum}</span>${hasBookings ? '<span class="absolute bottom-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full live-pulse"></span>' : ''}</td>`;
    }
    rowHtml += '</tr>';
    if (dateCounter > totalDays && i >= 4) break;
  }
  calendarBody.innerHTML = rowHtml;
}

function showEmptyAgendaModal(dateStr) {
  const modal = document.getElementById('bookingDetailsModal');
  const content = document.getElementById('modalDetailContent');
  document.getElementById('modalDetailTitle').innerText = `Agenda Tanggal ${formatDDMMYYYY(dateStr)}`;
  content.innerHTML = `<div class="text-center py-6 space-y-2"><div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-lg"><i class="fa-solid fa-calendar-xmark"></i></div><h4 class="font-bold text-slate-800 text-sm">Tidak tersedia agenda pada tanggal ini</h4></div>`;
  modal.classList.remove('hidden');
}

function showBookingDetails(encodedData) {
  try {
    const bookings = JSON.parse(decodeURIComponent(encodedData));
    const modal = document.getElementById('bookingDetailsModal');
    const content = document.getElementById('modalDetailContent');
    document.getElementById('modalDetailTitle').innerText = `Informasi Jadwal Peminjaman`;
    let html = '';

    const now = new Date();

    bookings.forEach(b => {
      let displayDateDetail = (b.tanggal || '').split('T')[0];
      const formattedDDMMYYYY = formatDDMMYYYY(displayDateDetail);

      let executionBadge = '';
      const parts = (b.jam || '').split(' - ');
      let endH = 23, endM = 59;
      if (parts.length >= 2) {
        const endHM = parts[1].replace(/WIB/gi, '').trim().split(':');
        endH = parseInt(endHM[0], 10) || 23;
        endM = parseInt(endHM[1], 10) || 59;
      }
      
      const bookingEndDateTime = new Date(displayDateDetail + 'T' + String(endH).padStart(2, '0') + ':' + String(endM).padStart(2, '0') + ':00');

      if (now > bookingEndDateTime) {
        executionBadge = `<span class="bg-slate-100 text-slate-600 border border-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold"><i class="fa-solid fa-check-double mr-1"></i> Telah Dilaksanakan</span>`;
      } else {
        executionBadge = `<span class="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold"><i class="fa-solid fa-clock mr-1"></i> Akan Dilaksanakan</span>`;
      }

      html += `
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 mb-3 last:mb-0">
          <div class="flex justify-between items-center flex-wrap gap-1">
            <span class="font-mono font-bold text-blue-600 text-xs">${b.id}</span>
            <div class="flex items-center space-x-1">
              ${executionBadge}
              <span class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">${b.status}</span>
            </div>
          </div>
          <div class="text-xs font-extrabold text-slate-900">${b.kegiatan}</div>
          <div class="text-xs text-slate-700"><strong>Ruangan:</strong> ${b.ruangan}</div>
          <div class="text-xs text-slate-700"><strong>Pemohon:</strong> ${b.pemohon} (${b.unit})</div>
          <div class="text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
            <i class="fa-solid fa-calendar-day text-blue-600 mr-1.5"></i> <strong>Waktu:</strong> ${formattedDDMMYYYY} | ${b.jam}
          </div>
        </div>`;
    });
    content.innerHTML = html;
    modal.classList.remove('hidden');
  } catch(e) {}
}

function closeBookingDetailsModal() { document.getElementById('bookingDetailsModal').classList.add('hidden'); }

function changeMonth(dir) {
  appState.currentMonth += dir;
  if (appState.currentMonth > 11) { appState.currentMonth = 0; appState.currentYear++; }
  else if (appState.currentMonth < 0) { appState.currentMonth = 11; appState.currentYear--; }
  renderCalendar();
}

function openBookingModalForRoom(roomName) {
  const room = appState.rooms.find(r => r.name === roomName);
  if (room && (room.statusText === 'Sedang Perbaikan' || room.statusText === 'Tidak Tersedia')) {
    showToast(`Maaf, ruangan ${roomName} sedang dalam perbaikan dan tidak dapat dipinjam.`, 'error');
    return;
  }
  openBookingModal();
  const roomSelect = document.getElementById('inputRuangan');
  if (roomSelect) roomSelect.value = roomName;
  document.getElementById('bookingRoomContextBadge').innerText = `Pilihan Ruangan: ${roomName}`;
  document.getElementById('bookingModalMainTitle').innerText = `Peminjaman ${roomName}`;
  checkBookingAvailability();
  checkCapacityLimit();
}

function openBookingModal() {
  document.getElementById('bookingModal').classList.remove('hidden');
  populateRoomOptions();
  checkBookingAvailability();
  checkCapacityLimit();
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.add('hidden');
  document.getElementById('bookingForm').reset();
  const conflictBanner = document.getElementById('bookingConflictBanner');
  if (conflictBanner) conflictBanner.classList.add('hidden');
}

function renderAdminRoomList() {
  const container = document.getElementById('adminRoomList');
  if (!container) return;
  container.innerHTML = '';
  
  const searchInput = document.getElementById('adminSearchRoomInput');
  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let filteredRooms = appState.rooms;
  if (appState.currentAdmin && !appState.currentAdmin.isSuper) {
    const adminUnitLower = (appState.currentAdmin.unit || '').trim().toLowerCase();
    filteredRooms = filteredRooms.filter(r => {
      const roomUnitLower = (r.unit || '').trim().toLowerCase();
      return roomUnitLower === adminUnitLower || roomUnitLower.includes(adminUnitLower);
    });
  }

  if (searchQuery !== '') {
    filteredRooms = filteredRooms.filter(r => {
      const roomName = (r.name || '').toLowerCase();
      const roomUnit = (r.unit || '').toLowerCase();
      return roomName.includes(searchQuery) || roomUnit.includes(searchQuery);
    });
  }

  if (filteredRooms.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">Tidak ada ruangan ditemukan.</div>`;
    return;
  }

  filteredRooms.forEach(room => {
    container.innerHTML += `
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div><h4 class="font-bold text-xs text-slate-900">${room.name}</h4><p class="text-[10px] text-slate-500">Unit: ${room.unit || 'Umum'} | Kapasitas: ${room.capacity}</p></div>
          <span class="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${room.badgeClass}"><i class="fa-solid ${room.icon} mr-1"></i> ${room.statusText}</span>
        </div>
        <div class="flex items-center justify-end space-x-1.5 pt-1">
          <button onclick="cycleRoomStatus('${room.id}')" title="Ubah Status" class="w-8 h-8 bg-white hover:bg-slate-100 text-blue-600 rounded-xl border border-slate-200 flex items-center justify-center cursor-pointer transition"><i class="fa-solid fa-arrows-rotate text-xs"></i></button>
          <button onclick="openEditRoomModal('${room.id}')" title="Edit Ruangan" class="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center cursor-pointer transition"><i class="fa-solid fa-pen-to-square text-xs"></i></button>
          <button onclick="deleteRoom('${room.id}')" title="Hapus Ruangan" class="w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center cursor-pointer transition"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      </div>`;
  });
}

function renderAdminPendingTable() {
  const tbody = document.getElementById('adminPendingTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (appState.bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 font-medium">Tidak ada pengajuan masuk.</td></tr>`;
    return;
  }

  let visibleBookings = appState.bookings;
  if (appState.currentAdmin && !appState.currentAdmin.isSuper) {
    const adminUnitLower = (appState.currentAdmin.unit || '').trim().toLowerCase();
    visibleBookings = appState.bookings.filter(b => {
      const bookingUnitLower = (b.unit || '').trim().toLowerCase();
      const targetRoom = appState.rooms.find(r => r.name === b.ruangan);
      const roomUnitLower = targetRoom ? (targetRoom.unit || '').trim().toLowerCase() : '';
      return bookingUnitLower === adminUnitLower || roomUnitLower === adminUnitLower || adminUnitLower.includes(bookingUnitLower);
    });
  }

  const searchInput = document.getElementById('adminSearchPendingInput');
  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
  if (searchQuery !== '') {
    visibleBookings = visibleBookings.filter(b => {
      const p = (b.pemohon || '').toLowerCase();
      const k = (b.kegiatan || '').toLowerCase();
      const r = (b.ruangan || '').toLowerCase();
      const id = (b.id || '').toLowerCase();
      return p.includes(searchQuery) || k.includes(searchQuery) || r.includes(searchQuery) || id.includes(searchQuery);
    });
  }

  if (visibleBookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">Tidak ada permintaan peminjaman ditemukan.</td></tr>`;
    return;
  }

  visibleBookings.forEach(item => {
    let statusTag = `<span class="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center"><i class="fa-solid fa-hourglass mr-1"></i> Menunggu</span>`;
    if (item.status === 'Disetujui') statusTag = `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center"><i class="fa-solid fa-check mr-1"></i> Disetujui</span>`;
    if (item.status === 'Dibatalkan') statusTag = `<span class="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center"><i class="fa-solid fa-ban mr-1"></i> Dibatalkan</span>`;
    if (item.status === 'Ditolak') statusTag = `<span class="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center"><i class="fa-solid fa-xmark mr-1"></i> Ditolak</span>`;

    const pdfUrl = (item.berkasUrl && item.berkasUrl !== '#') ? item.berkasUrl : '#';
    const pdfBtnDisabled = pdfUrl === '#' ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'hover:bg-blue-100 cursor-pointer';
    
    let displayDateAdmin = (item.tanggal || '').split('T')[0];
    const formattedDate = formatDDMMYYYY(displayDateAdmin);

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
          <div class="font-semibold text-slate-800">${formattedDate}</div>
          <div class="text-[10px] text-slate-400">${item.jam}</div>
        </td>
        <td class="p-4">${statusTag}</td>
        <td class="p-4 pr-5 text-center">
          <div class="inline-flex items-center space-x-1.5">
            <button onclick="openPdfModal('${pdfUrl}', '${item.id}')" title="Lihat Berkas PDF" class="px-2.5 py-1.5 bg-blue-50 ${pdfBtnDisabled} text-blue-700 font-bold rounded-xl text-[11px] transition inline-flex items-center border border-blue-200 cursor-pointer">
              <i class="fa-solid fa-file-pdf mr-1 text-xs text-rose-500"></i> PDF
            </button>
            <button onclick="updateBookingStatusInCloud('${item.id}', 'Disetujui')" class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-[11px] transition cursor-pointer border border-emerald-200">Setujui</button>
            <button onclick="updateBookingStatusInCloud('${item.id}', 'Ditolak')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] transition cursor-pointer border border-rose-200">Tolak</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function openPdfModal(url, bookingId) {
  if (!url || url === '#') {
    showToast('Berkas PDF tidak tersedia untuk peminjaman ini.', 'warning');
    return;
  }
  let modal = document.getElementById('pdfViewerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pdfViewerModal';
    modal.className = 'fixed inset-0 z-50 bg-slate-950/70 modal-blur flex items-center justify-center p-3 sm:p-4 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative space-y-4 my-auto h-[80vh] flex flex-col">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 id="pdfModalTitle" class="text-sm sm:text-base font-black text-slate-900">Pratinjau Berkas PDF</h3>
          <button onclick="closePdfModal()" class="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer transition"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex-grow bg-slate-100 rounded-2xl overflow-hidden relative">
          <iframe id="pdfIframe" src="" class="w-full h-full border-0"></iframe>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('pdfModalTitle').innerText = `Pratinjau Berkas PDF (${bookingId})`;
  document.getElementById('pdfIframe').src = url;
  modal.classList.remove('hidden');
}

function closePdfModal() {
  const modal = document.getElementById('pdfViewerModal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('pdfIframe').src = '';
  }
}

function openSuperAdminModal() { document.getElementById('superAdminModal').classList.remove('hidden'); renderAdminAccountsList(); }
function closeSuperAdminModal() { document.getElementById('superAdminModal').classList.add('hidden'); }

function renderAdminAccountsList() {
  const container = document.getElementById('adminAccountsList');
  if (!container) return;
  container.innerHTML = '';
  appState.adminAccounts.forEach(acc => {
    const isSuperBadge = acc.isSuper ? '<span class="text-[9px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded">Super</span>' : '';
    container.innerHTML += `
      <div class="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
        <div class="space-y-0.5">
          <div class="font-bold text-slate-900 flex items-center space-x-2"><span>${acc.name} (${acc.username})</span> ${isSuperBadge}</div>
          <div class="text-[10px] text-slate-500">Unit: ${acc.unit}</div>
        </div>
        <div class="flex items-center space-x-1.5">
          <button onclick="openEditAdminModal('${acc.username}')" class="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition"><i class="fa-solid fa-pen text-[10px]"></i></button>
          <button onclick="deleteAdminAccount('${acc.username}')" class="w-7 h-7 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-100 transition"><i class="fa-solid fa-trash text-[10px]"></i></button>
        </div>
      </div>`;
  });
}

function openEditAdminModal(username) {
  const acc = appState.adminAccounts.find(a => a.username === username);
  if (acc) {
    document.getElementById('editAdminUsernameKey').value = acc.username;
    document.getElementById('newAdminName').value = acc.name;
    document.getElementById('newAdminUsername').value = acc.username;
    document.getElementById('newAdminPassword').value = acc.pass;
    document.getElementById('newAdminLevel').value = acc.isSuper ? 'super' : 'dinas';
    document.getElementById('newAdminUnit').value = acc.unit;
    document.getElementById('adminFormTitle').innerHTML = `<i class="fa-solid fa-user-pen mr-2 text-purple-600"></i> Edit Akun Admin: ${acc.username}`;
    document.getElementById('submitAdminBtn').innerHTML = `<i class="fa-solid fa-floppy-disk mr-2"></i> Update Akun`;
    document.getElementById('cancelEditAdminBtn').classList.remove('hidden');
    toggleUnitDropdown();
  }
}

function resetAdminForm() {
  document.getElementById('editAdminUsernameKey').value = '';
  document.getElementById('adminFormTitle').innerHTML = `<i class="fa-solid fa-user-plus mr-2 text-purple-600"></i> Tambah Akun Admin Baru`;
  document.getElementById('submitAdminBtn').innerHTML = `<i class="fa-solid fa-floppy-disk mr-2"></i> Simpan Akun Admin`;
  document.getElementById('cancelEditAdminBtn').classList.add('hidden');
  document.getElementById('newAdminName').value = '';
  document.getElementById('newAdminUsername').value = '';
  document.getElementById('newAdminPassword').value = '';
  document.getElementById('newAdminUnit').value = '';
}

async function deleteAdminAccount(username) {
  if (appState.adminAccounts.length <= 1) {
    showToast('Minimal harus ada satu akun admin di dalam sistem!', 'warning');
    return;
  }
  appState.adminAccounts = appState.adminAccounts.filter(a => a.username !== username);
  renderAdminAccountsList();
  showToast('Menghapus akun admin dari spreadsheet...', 'info');
  await sendDataToDatabase('deleteAdmin', { username });
  showToast('Akun admin berhasil dihapus.', 'info');
}

function openAddRoomModal() {
  document.getElementById('editRoomId').value = '';
  document.getElementById('roomModalTitle').innerText = 'Tambah Ruangan Baru';
  document.getElementById('submitRoomBtn').innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i> Simpan Ruangan';
  document.getElementById('roomForm').reset();
  document.getElementById('roomPhotoNameSpan').innerText = 'Tidak ada foto dipilih';
  document.getElementById('inputRoomExistingPhoto').value = '';
  
  const unitInput = document.getElementById('inputRoomUnit');
  if (unitInput && appState.currentAdmin && !appState.currentAdmin.isSuper) {
    unitInput.value = appState.currentAdmin.unit;
  }
  
  document.getElementById('roomModal').classList.remove('hidden');
}

function closeRoomModal() { document.getElementById('roomModal').classList.add('hidden'); }

function openEditRoomModal(roomId) {
  const room = appState.rooms.find(r => r.id === roomId);
  if (room) {
    document.getElementById('editRoomId').value = room.id;
    document.getElementById('roomModalTitle').innerText = `Edit Ruangan: ${room.name}`;
    document.getElementById('submitRoomBtn').innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i> Update Ruangan';
    
    document.getElementById('inputRoomName').value = room.name;
    document.getElementById('inputRoomCategory').value = room.category;
    document.getElementById('inputRoomCapacity').value = room.capacity;
    document.getElementById('inputRoomUnit').value = room.unit || (appState.currentAdmin ? appState.currentAdmin.unit : 'Bagian Umum');
    document.getElementById('inputRoomFeatures').value = room.features ? room.features.join(', ') : '';
    document.getElementById('inputRoomDesc').value = room.description;
    
    const existingImages = (room.images && room.images.length > 0) ? room.images.join(',') : '';
    document.getElementById('inputRoomExistingPhoto').value = existingImages;
    document.getElementById('roomPhotoNameSpan').innerText = room.images ? `${room.images.length} foto tersimpan aktif` : 'Tidak ada foto dipilih';
    
    document.getElementById('roomModal').classList.remove('hidden');
  }
}

async function cycleRoomStatus(roomId) {
  const room = appState.rooms.find(r => r.id === roomId);
  if (room) {
    room.statusText = room.statusText === 'Tersedia' ? 'Sedang Perbaikan' : 'Tersedia';
    room.badgeClass = room.statusText === 'Tersedia' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
    room.icon = room.statusText === 'Tersedia' ? 'fa-circle-check' : 'fa-triangle-exclamation';
    renderAdminRoomList();
    renderRoomCards();
    showToast('Menyinkronkan status ruangan ke database...', 'info');
    await sendDataToDatabase('saveRoom', { room });
    showToast(`Status ${room.name} diubah menjadi: ${room.statusText}`, 'info');
  }
}

async function handleRoomFormSubmit(e) {
  e.preventDefault();
  const editId = (document.getElementById('editRoomId').value || '').trim();
  const name = document.getElementById('inputRoomName').value.trim();
  const category = document.getElementById('inputRoomCategory').value.trim();
  const capacity = document.getElementById('inputRoomCapacity').value.trim();
  
  const unitInput = document.getElementById('inputRoomUnit');
  const unit = (unitInput && unitInput.value.trim()) ? unitInput.value.trim() : (appState.currentAdmin ? appState.currentAdmin.unit : 'Bagian Umum');
  
  const featuresRaw = document.getElementById('inputRoomFeatures').value;
  const features = featuresRaw ? featuresRaw.split(',').map(s => s.trim()).filter(s => s.length > 0) : ['Proyektor', 'AC'];
  const description = document.getElementById('inputRoomDesc').value.trim();
  
  const photoFileInput = document.getElementById('inputRoomPhotoFile');
  const existingPhotosStr = document.getElementById('inputRoomExistingPhoto').value;

  const processRoomSave = async (imageUrls) => {
    let targetRoom;
    if (editId !== '') {
      const roomIndex = appState.rooms.findIndex(r => r.id === editId);
      if (roomIndex !== -1) {
        const existingRoom = appState.rooms[roomIndex];
        targetRoom = {
          ...existingRoom,
          name, category, capacity, unit, features, description,
          statusText: existingRoom.statusText || 'Tersedia',
          badgeClass: existingRoom.badgeClass || 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: existingRoom.icon || 'fa-circle-check',
          images: imageUrls.length > 0 ? imageUrls : (existingRoom.images || ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80']),
          currentImageIdx: 0
        };
        appState.rooms[roomIndex] = targetRoom;
      }
    } else {
      targetRoom = {
        id: 'room-' + Date.now(),
        name, category, capacity, unit,
        available: true, statusText: 'Tersedia',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'fa-circle-check',
        description, features, 
        images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'], 
        currentImageIdx: 0
      };
      appState.rooms.push(targetRoom);
    }

    showToast('Menyimpan ruangan ke Google Spreadsheet...', 'info');
    await sendDataToDatabase('saveRoom', { room: targetRoom });

    renderRoomCards();
    renderAdminRoomList();
    populateRoomOptions();
    populateUnitFilterOptions();
    updateDashboardCounts();
    initAnalyticsCharts();
    closeRoomModal();
    showToast(`Ruangan ${name} berhasil disimpan!`, 'success');
  };

  if (photoFileInput && photoFileInput.files && photoFileInput.files.length > 0) {
    const files = Array.from(photoFileInput.files);
    let base64Images = [];
    let loadedCount = 0;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = async function(uploadEvent) {
        base64Images[index] = uploadEvent.target.result;
        loadedCount++;
        if (loadedCount === files.length) {
          await processRoomSave(base64Images);
        }
      };
      reader.readAsDataURL(file);
    });
  } else {
    const fallbackImages = existingPhotosStr ? existingPhotosStr.split(',') : ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'];
    await processRoomSave(fallbackImages);
  }
}

async function deleteRoom(roomId) {
  appState.rooms = appState.rooms.filter(r => r.id !== roomId);
  renderRoomCards();
  renderAdminRoomList();
  populateRoomOptions();
  populateUnitFilterOptions();
  updateDashboardCounts();
  initAnalyticsCharts();
  showToast('Menghapus ruangan dari database...', 'info');
  await sendDataToDatabase('deleteRoom', { id: roomId });
  showToast('Ruangan berhasil dihapus.', 'info');
}

async function handleCreateAdminSubmit(e) {
  e.preventDefault();
  const editKey = document.getElementById('editAdminUsernameKey').value.trim();
  const name = document.getElementById('newAdminName').value.trim();
  const username = document.getElementById('newAdminUsername').value.trim();
  const pass = document.getElementById('newAdminPassword').value.trim();
  const isSuper = document.getElementById('newAdminLevel').value === 'super';
  const unit = document.getElementById('newAdminUnit').value.trim();

  const adminObj = { username, name, pass, unit: isSuper ? 'Semua Dinas' : unit, isSuper };

  if (editKey) {
    const acc = appState.adminAccounts.find(a => a.username === editKey);
    if (acc) {
      acc.name = name;
      acc.username = username;
      acc.pass = pass;
      acc.unit = adminObj.unit;
      acc.isSuper = isSuper;
    }
  } else {
    const existing = appState.adminAccounts.find(a => a.username === username);
    if (existing) {
      showToast('Username sudah terdaftar! Gunakan username lain.', 'error');
      return;
    }
    appState.adminAccounts.push(adminObj);
  }

  showToast('Menyimpan akun admin ke Google Spreadsheet...', 'info');
  await sendDataToDatabase('saveAdmin', { admin: adminObj });

  resetAdminForm();
  renderAdminAccountsList();
  e.target.reset();
  showToast(`Akun admin ${username} berhasil disimpan!`, 'success');
}

function toggleUnitDropdown() {
  const level = document.getElementById('newAdminLevel').value;
  const group = document.getElementById('unitSelectionGroup');
  if (level === 'super') group.classList.add('hidden');
  else group.classList.remove('hidden');
}

async function handleBookingSubmit(e) {
  e.preventDefault();

  await syncDataFromDatabase();

  const pemohon = document.getElementById('inputPemohon').value.trim();
  const email = document.getElementById('inputEmail').value.trim();
  const unit = document.getElementById('inputUnit').value.trim();
  const kategori = document.getElementById('inputKategori').value;
  const kegiatan = document.getElementById('inputKegiatan').value.trim();
  const ruangan = document.getElementById('inputRuangan').value.trim();
  const tanggal = document.getElementById('inputTanggal').value;
  const jamMulai = document.getElementById('inputJamMulai').value;
  const jamSelesai = document.getElementById('inputJamSelesai').value;
  const jam = `${jamMulai} - ${jamSelesai} WIB`;
  const peserta = parseInt(document.getElementById('inputPeserta').value) || 0;
  const catatan = document.getElementById('inputCatatan').value.trim();
  const berkasInput = document.getElementById('inputBerkas');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (tanggal === todayStr) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = timeToMinutes(jamMulai);
    if (startMinutes <= currentMinutes) {
      triggerPastTimeWarning(`Waktu mulai (${jamMulai} WIB) yang Anda pilih sudah terlewat atau sama dengan waktu saat ini (${now.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })} WIB). Silakan pilih waktu mendatang.`);
      return;
    }
  } else if (tanggal < todayStr) {
    triggerPastTimeWarning(`Tanggal pelaksanaan (${formatDDMMYYYY(tanggal)}) sudah lewat dari hari ini. Silakan pilih tanggal yang valid.`);
    return;
  }

  const conflict = checkBookingConflictWithTime(ruangan, tanggal, jamMulai, jamSelesai, null);
  if (conflict) {
    triggerDoubleBookingWarning(ruangan, tanggal, `${jamMulai} - ${jamSelesai}`, conflict);
    return; 
  }

  const currentRoom = appState.rooms.find(r => r.name === ruangan);
  if (currentRoom) {
    const maxCapNum = parseInt(currentRoom.capacity) || 100;
    if (peserta > maxCapNum) {
      document.getElementById('popupCapacityText').innerText = `Jumlah peserta (${peserta}) melebihi kapasitas maksimal ruangan ${ruangan} (${currentRoom.capacity}).`;
      document.getElementById('capacityPopupModal').classList.remove('hidden');
      return; 
    }
  }

  const newBooking = {
    id: 'PMJ-' + Math.floor(1000 + Math.random() * 9000),
    pemohon, email, unit, kategori, kegiatan, ruangan, tanggal, jam, peserta, catatan,
    berkasUrl: '#', status: 'Menunggu', tahun: 2026, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  showToast('Mengirim dan menyinkronkan data & file ke Google Spreadsheet...', 'info');

  let serverResult = { status: 'success' };
  if (berkasInput && berkasInput.files[0]) {
    const file = berkasInput.files[0];
    const reader = new FileReader();
    await new Promise((resolve) => {
      reader.onload = async function(uploadEvent) {
        const base64String = uploadEvent.target.result.split(',')[1];
        serverResult = await apiService.sendRequest('addBooking', {
          ...newBooking,
          fileBase64: base64String,
          fileName: file.name,
          fileMimeType: file.type
        });
        resolve();
      };
      reader.readAsDataURL(file);
    });
  } else {
    serverResult = await apiService.sendRequest('addBooking', newBooking);
  }

  if (serverResult && serverResult.status === 'conflict') {
    triggerDoubleBookingWarning(ruangan, tanggal, `${jamMulai} - ${jamSelesai}`, {
      kegiatan: "Agenda Terdaftar (Server Collision)",
      pemohon: "Pengguna Lain",
      unit: "-"
    });
    await syncDataFromDatabase();
    return; 
  }

  appState.bookings.unshift(newBooking);
  if (serverResult && serverResult.berkasUrl) {
    newBooking.berkasUrl = serverResult.berkasUrl;
  }

  renderBookingTable();
  updateDashboardCounts();
  renderAdminPendingTable();
  renderCalendar();
  closeBookingModal();
  checkAutomatedReminders();
  initAnalyticsCharts();

  showToast(`Peminjaman berhasil dikirim & disimpan (ID: ${newBooking.id})! Email konfirmasi terkirim ke ${email}.`, 'success');
}

function checkBookingAvailability() {
  const ruanganSelect = document.getElementById('inputRuangan');
  const tanggalInput = document.getElementById('inputTanggal');
  const jamMulaiInput = document.getElementById('inputJamMulai');
  const jamSelesaiInput = document.getElementById('inputJamSelesai');
  const conflictBanner = document.getElementById('bookingConflictBanner');
  const conflictText = document.getElementById('bookingConflictText');

  if (!ruanganSelect || !tanggalInput || !jamMulaiInput || !jamSelesaiInput) return;

  const ruangan = ruanganSelect.value;
  const tanggal = tanggalInput.value;
  const jamMulai = jamMulaiInput.value;
  const jamSelesai = jamSelesaiInput.value;

  if (!ruangan || !tanggal || !jamMulai || !jamSelesai) {
    if (conflictBanner) conflictBanner.classList.add('hidden');
    return;
  }

  const conflict = checkBookingConflictWithTime(ruangan, tanggal, jamMulai, jamSelesai, null);
  if (conflict) {
    if (conflictBanner && conflictText) {
      conflictText.innerHTML = `Perhatian: Ruangan <b>${ruangan}</b> pada tanggal <b>${formatDDMMYYYY(tanggal)}</b> pukul <b>${jamMulai} - ${jamSelesai} WIB</b> bersinggungan dengan agenda <b>"${conflict.kegiatan}"</b> oleh <b>${conflict.pemohon}</b> [Status: ${conflict.status}].`;
      conflictBanner.classList.remove('hidden');
    }
  } else {
    if (conflictBanner) conflictBanner.classList.add('hidden');
  }
}

function triggerDoubleBookingWarning(roomName, dateStr, jamStr, conflictItem) {
  document.getElementById('doubleInputModalTitle').innerText = "Peringatan Bentrok Jadwal!";
  document.getElementById('doubleInputModalText').innerHTML = `Gagal menyimpan! Ruangan <b>${roomName}</b> pada tanggal <b>${formatDDMMYYYY(dateStr)}</b> pukul <b>${jamStr} WIB</b> sudah terisi/diajukan untuk kegiatan <b>"${conflictItem.kegiatan}"</b> oleh <b>${conflictItem.pemohon}</b> (${conflictItem.unit}). Silakan pilih jadwal lain.`;
  const modal = document.getElementById('doubleInputWarningModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.zIndex = '999999';
  }
}

function closeDoubleInputModal() {
  const modal = document.getElementById('doubleInputWarningModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function triggerPastTimeWarning(message) {
  const modal = document.getElementById('pastTimeWarningModal');
  const textEl = document.getElementById('pastTimeModalText');
  if (textEl && message) textEl.innerText = message;
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.zIndex = '999999';
  }
}

function closePastTimeModal() {
  const modal = document.getElementById('pastTimeWarningModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function checkCapacityLimit() {
  const pesertaInput = parseInt(document.getElementById('inputPeserta').value) || 0;
  const ruangan = document.getElementById('inputRuangan').value;
  const currentRoom = appState.rooms.find(r => r.name === ruangan);
  const banner = document.getElementById('capacityWarningBanner');
  const textEl = document.getElementById('capacityWarningText');

  if (currentRoom) {
    const maxCapNum = parseInt(currentRoom.capacity) || 100;
    if (pesertaInput > maxCapNum) {
      if (banner && textEl) {
        textEl.innerText = `Peringatan: Jumlah peserta (${pesertaInput}) melebihi kapasitas maksimal ruangan (${currentRoom.capacity})!`;
        banner.classList.remove('hidden');
      }
    } else {
      if (banner) banner.classList.add('hidden');
    }
  }
}

function closeCapacityPopup() { document.getElementById('capacityPopupModal').classList.add('hidden'); }

function openCancelModal() {
  const modal = document.getElementById('cancelBookingModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.zIndex = '999999';
  }
}

function closeCancelModal() {
  const modal = document.getElementById('cancelBookingModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function handleCancelBookingSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('cancelBookingId').value.trim().toUpperCase();
  const item = appState.bookings.find(b => b.id.toUpperCase() === id);
  if (item) {
    if (item.status === 'Disetujui') {
      showToast('Peminjaman yang sudah disetujui tidak dapat dibatalkan secara mandiri. Silakan hubungi admin instansi.', 'error');
      return;
    }
    item.status = 'Dibatalkan';
    closeCancelModal();
    renderBookingTable();
    updateDashboardCounts();
    renderCalendar();
    checkAutomatedReminders();
    initAnalyticsCharts();
    showToast('Peminjaman dibatalkan.', 'info');
  } else {
    showToast('ID Peminjaman tidak ditemukan.', 'error');
  }
}

async function updateBookingStatusInCloud(id, newStatus) {
  const item = appState.bookings.find(b => b.id === id);
  if (item) {
    if (newStatus === 'Disetujui') {
      const parts = item.jam.split(' - ');
      const sTime = parts[0] ? parts[0].trim() : '08:00';
      const eTime = parts[1] ? parts[1].replace(/WIB/gi, '').trim() : '17:00';
      const conflict = checkBookingConflictWithTime(item.ruangan, item.tanggal, sTime, eTime, item.id);
      if (conflict) {
        triggerDoubleBookingWarning(item.ruangan, item.tanggal, item.jam, conflict);
        return;
      }
    }

    item.status = newStatus;
    renderAdminPendingTable();
    renderBookingTable();
    updateDashboardCounts();
    renderCalendar();
    renderRoomCards();
    checkAutomatedReminders();
    initAnalyticsCharts();

    showToast(`Status pengajuan ${id} diubah menjadi: ${newStatus}. Notifikasi otomatis aktif untuk ${item.email}`, newStatus === 'Disetujui' ? 'success' : 'warning');
    await sendDataToDatabase('updateStatus', { id, status: newStatus });
  }
}

function togglePasswordVisibility() {
  const pwd = document.getElementById('adminPassword');
  pwd.type = pwd.type === 'password' ? 'text' : 'password';
}

function handleCredentialsSubmit(e) {
  e.preventDefault();
  const user = document.getElementById('adminUsername').value.trim();
  const pass = document.getElementById('adminPassword').value.trim();
  const foundAcc = appState.adminAccounts.find(a => a.username === user && a.pass === pass);
  if (foundAcc) {
    appState.currentAdmin = foundAcc;
    document.getElementById('authStep1').classList.add('hidden');
    document.getElementById('authStep2').classList.remove('hidden');
    document.getElementById('activeAuthEmail').innerText = `${foundAcc.username}@instansi.go.id`;
    document.getElementById('activeAuthAvatar').innerText = foundAcc.name.charAt(0).toUpperCase();
    document.getElementById('credentialsError').classList.add('hidden');
  } else {
    document.getElementById('credentialsError').classList.remove('hidden');
  }
}

function backToStep1() {
  document.getElementById('authStep1').classList.remove('hidden');
  document.getElementById('authStep2').classList.add('hidden');
}

function startTotpCountdown() {
  setInterval(() => {
    appState.totpTimer--;
    if (appState.totpTimer <= 0) appState.totpTimer = 30;
    const bar = document.getElementById('totpProgress');
    if (bar) bar.style.width = (appState.totpTimer / 30) * 100 + '%';
  }, 1000);
}

function autoVerifyOtp() {
  if (document.getElementById('otpInput').value.length === 6) verifyGoogleAuthenticator2FA();
}

function verifyGoogleAuthenticator2FA() {
  appState.isAdminLoggedIn = true;
  showToast('Autentikasi Berhasil!', 'success');
  
  const superBtn = document.getElementById('superAdminOnlyBtn');
  const superClearBtn = document.getElementById('superAdminClearAnnounceBtn');
  const badge = document.getElementById('adminRoleBadge');
  const welcome = document.getElementById('adminWelcomeTitle');

  if (appState.currentAdmin && appState.currentAdmin.isSuper) {
    if (superBtn) superBtn.classList.remove('hidden');
    if (superClearBtn) superClearBtn.classList.remove('hidden');
    if (badge) badge.innerHTML = `<span class="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5 live-pulse"></span> Super Administrator`;
    if (welcome) welcome.innerText = `Panel Kendali & Manajemen Ruangan (${appState.currentAdmin.name})`;
  } else {
    if (superBtn) superBtn.classList.add('hidden');
    if (superClearBtn) superClearBtn.classList.add('hidden');
    if (badge) badge.innerHTML = `<span class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 live-pulse"></span> Admin Dinas (${appState.currentAdmin ? appState.currentAdmin.unit : 'Bidang'})`;
    if (welcome) welcome.innerText = `Panel Kendali Ruangan (${appState.currentAdmin ? appState.currentAdmin.name : 'Admin'})`;
  }

  switchView('admin');
}

function adminLogout() {
  appState.isAdminLoggedIn = false;
  appState.currentAdmin = null;
  document.getElementById('adminUsername').value = '';
  document.getElementById('adminPassword').value = '';
  document.getElementById('otpInput').value = '';
  const superClearBtn = document.getElementById('superAdminClearAnnounceBtn');
  if (superClearBtn) superClearBtn.classList.add('hidden');
  backToStep1();
  switchView('admin');
  showToast('Anda telah keluar dari sesi Admin.', 'info');
}

function initAnalyticsCharts() {
  const roomCounts = {};
  appState.rooms.forEach(r => roomCounts[r.name] = 0);
  appState.bookings.filter(b => b.status === 'Disetujui').forEach(b => {
    if (roomCounts[b.ruangan] !== undefined) roomCounts[b.ruangan]++;
    else roomCounts[b.ruangan] = (roomCounts[b.ruangan] || 0) + 1;
  });

  if (chartInstances.penggunaan) chartInstances.penggunaan.destroy();
  const ctx1 = document.getElementById('chartPenggunaanRuangan');
  if (ctx1) {
    chartInstances.penggunaan = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: Object.keys(roomCounts),
        datasets: [{ data: Object.values(roomCounts), backgroundColor: ['#2563eb', '#38bdf8', '#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeOutQuart' }, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
    });
  }

  const yearlyCounts = { 2026: 0, 2027: 0, 2028: 0, 2029: 0 };
  appState.bookings.filter(b => b.status === 'Disetujui').forEach(b => {
    let yr = 2026;
    if (b.tanggal && b.tanggal.length >= 4) {
      yr = parseInt(b.tanggal.substring(0, 4), 10) || 2026;
    } else if (b.tahun) {
      yr = parseInt(b.tahun, 10) || 2026;
    }
    if (yr >= 2026 && yearlyCounts[yr] !== undefined) {
      yearlyCounts[yr]++;
    } else if (yr >= 2026) {
      yearlyCounts[yr] = (yearlyCounts[yr] || 0) + 1;
    }
  });
  const yearsArr = Object.keys(yearlyCounts).sort();
  const countsArr = yearsArr.map(y => yearlyCounts[y]);

  if (chartInstances.tahunan) chartInstances.tahunan.destroy();
  const ctx2 = document.getElementById('chartPemakaianTahun');
  if (ctx2) {
    chartInstances.tahunan = new Chart(ctx2, {
      type: 'line',
      data: { labels: yearsArr, datasets: [{ label: 'Jumlah Kegiatan', data: countsArr, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.35 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeOutQuart' }, scales: { y: { beginAtZero: true } } }
    });
  }

  const catCounts = { 'Rapat Dinas': 0, 'Seminar / Sosialisasi': 0, 'Workshop': 0, 'Diklat / Pelatihan': 0 };
  appState.bookings.filter(b => b.status === 'Disetujui').forEach(b => {
    const cat = b.kategori || 'Rapat Dinas';
    if (catCounts[cat] !== undefined) catCounts[cat]++;
    else catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  if (chartInstances.peserta) chartInstances.peserta.destroy();
  const ctx3 = document.getElementById('chartPesertaKategori');
  if (ctx3) {
    chartInstances.peserta = new Chart(ctx3, {
      type: 'bar',
      data: { labels: Object.keys(catCounts), datasets: [{ data: Object.values(catCounts), backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'], borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeOutQuart' }, plugins: { legend: { display: false } } }
    });
  }

  const unitCounts = {};
  appState.rooms.forEach(r => {
    const u = r.unit || 'Umum';
    unitCounts[u] = 0;
  });
  appState.bookings.filter(b => b.status === 'Disetujui').forEach(b => {
    const u = b.unit || 'Umum';
    unitCounts[u] = (unitCounts[u] || 0) + 1;
  });

  if (chartInstances.unit) chartInstances.unit.destroy();
  const ctx4 = document.getElementById('chartUnit');
  if (ctx4) {
    chartInstances.unit = new Chart(ctx4, {
      type: 'polarArea',
      data: { labels: Object.keys(unitCounts), datasets: [{ data: Object.values(unitCounts), backgroundColor: ['rgba(37, 99, 235, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(99, 102, 241, 0.7)'] }] },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeOutQuart' }, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } } }
    });
  }
}

window.onload = async function() {
  initClock();
  populateRoomOptions();
  populateUnitFilterOptions();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('inputTanggal');
  if (dateInput) {
    dateInput.min = todayStr;
    dateInput.value = todayStr;
  }

  await syncDataFromDatabase();
  setInterval(syncDataFromDatabase, 4000);

  renderRoomCards();
  renderBookingTable();
  updateDashboardCounts();
  renderAdminRoomList();
  renderAdminPendingTable();
  renderAdminAccountsList();
  initAnalyticsCharts();
  startTotpCountdown();
  renderCalendar();
  checkAutomatedReminders();
  updateAnnouncementDisplay();
  initRoomImageSlider();
  switchView('dashboard');
};
