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
    let nextM = month + 1;
    let nextY = year;
    if (nextM > 11) {
      nextM = 0;
      nextY++;
    }
    nextMonthBtn.innerText = `${monthNames[nextM]} ${nextY}`;
  }

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  calendarBody.innerHTML = '';
  let dateCounter = 1;
  let nextMonthCounter = 1;
  let rowHtml = '';

  for (let i = 0; i < 6; i++) {
    rowHtml += '<tr class="h-24">';
    for (let j = 0; j < 7; j++) {
      let dayNum = 0;
      let isCurrentMonth = false;
      let dateStr = '';

      if (i === 0 && j < firstDayIndex) {
        dayNum = prevTotalDays - firstDayIndex + j + 1;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      } else if (dateCounter <= totalDays) {
        dayNum = dateCounter;
        isCurrentMonth = true;
        dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        dateCounter++;
      } else {
        dayNum = nextMonthCounter;
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        nextMonthCounter++;
      }

      const bookingsOnThisDay = appState.bookings.filter(b => b.tanggal === dateStr && b.status === 'Disetujui');
      const hasBookings = bookingsOnThisDay.length > 0;

      let cellBgClass = 'bg-white';
      let textColor = isCurrentMonth ? 'text-slate-800' : 'text-slate-300';
      let dblClickAttr = '';

      if (hasBookings) {
        cellBgClass = 'bg-rose-100/75 cursor-pointer hover:bg-rose-200/80';
        textColor = 'text-slate-900 font-bold';
        
        const bInfo = encodeURIComponent(JSON.stringify(bookingsOnThisDay));
        dblClickAttr = `ondblclick="showBookingDetails('${bInfo}')" title="Double-click untuk melihat detail peminjaman"`;
      } else {
        dblClickAttr = `ondblclick="showEmptyAgendaModal('${dateStr}')" title="Double-click untuk cek agenda"`;
      }

      rowHtml += `
        <td ${dblClickAttr} class="align-top border-r border-slate-200 p-2 relative ${cellBgClass} transition cursor-pointer">
          <div class="flex justify-between items-center">
            <span class="${textColor} text-xs">${dayNum}</span>
          </div>
        </td>
      `;
    }
    rowHtml += '</tr>';
    if (dateCounter > totalDays && i >= 4) break;
  }
  calendarBody.innerHTML = rowHtml;
}

function showEmptyAgendaModal(dateStr) {
  const modal = document.getElementById('bookingDetailsModal');
  const content = document.getElementById('modalDetailContent');
  const titleEl = document.getElementById('modalDetailTitle');
  if (!modal || !content) return;

  if (titleEl) titleEl.innerText = `Agenda Tanggal ${dateStr}`;
  content.innerHTML = `
    <div class="text-center py-6 space-y-2">
      <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-lg">
        <i class="fa-solid fa-calendar-xmark"></i>
      </div>
      <h4 class="font-bold text-slate-800 text-sm">Tidak tersedia agenda</h4>
      <p class="text-[11px] text-slate-500">Tidak ada peminjaman ruangan yang terjadwal pada tanggal ${dateStr}.</p>
    </div>
  `;
  modal.classList.remove('hidden');
}

function showBookingDetails(encodedData) {
  try {
    const bookings = JSON.parse(decodeURIComponent(encodedData));
    const modal = document.getElementById('bookingDetailsModal');
    const content = document.getElementById('modalDetailContent');
    const titleEl = document.getElementById('modalDetailTitle');
    if (!modal || !content) return;

    if (titleEl) titleEl.innerText = `Informasi Jadwal Peminjaman`;

    let html = '';
    bookings.forEach(b => {
      html += `
        <div class="bg-white p-3 rounded-xl border border-slate-200 mb-2 last:mb-0 space-y-1">
          <div class="flex justify-between items-center"><span class="font-bold text-blue-600">${b.id}</span><span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">${b.status}</span></div>
          <div><strong class="text-slate-800">Kegiatan:</strong> ${b.kegiatan}</div>
          <div><strong class="text-slate-800">Ruangan:</strong> ${b.ruangan}</div>
          <div><strong class="text-slate-800">Pemohon:</strong> ${b.pemohon} (${b.unit})</div>
          <div><strong class="text-slate-800">Waktu:</strong> ${b.tanggal} | ${b.jam}</div>
          <div><strong class="text-slate-800">Peserta:</strong> ${b.peserta} Orang</div>
          <div><strong class="text-slate-800">Berkas Drive:</strong> <a href="${b.berkasUrl}" target="_blank" class="text-blue-600 underline">Buka Google Drive</a></div>
        </div>
      `;
    });

    content.innerHTML = html;
    modal.classList.remove('hidden');
  } catch(e) {
    console.error(e);
  }
}

function closeBookingDetailsModal() {
  const modal = document.getElementById('bookingDetailsModal');
  if (modal) modal.classList.add('hidden');
}

function changeMonth(direction) {
  appState.currentMonth += direction;
  if (appState.currentMonth > 11) {
    appState.currentMonth = 0;
    appState.currentYear++;
  } else if (appState.currentMonth < 0) {
    appState.currentMonth = 11;
    appState.currentYear--;
  }
  renderCalendar();
}
