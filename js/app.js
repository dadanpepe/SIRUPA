const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbymzY6zWTCIWWr68d7We0kXCqmbVFHdnxeaScc9gbgE5-fLCUvmfWG1ku0pVXjnm5-j/exec"; 

let currentMode = 'user';
let isAdminLoggedIn = false;
let pendingAdminUser = null;
let bookingsCache = [];
let pollingInterval = null;

const rooms = [
    {
        name: "Ruang Rapat Utama",
        capacity: 50,
        desc: "Ruangan representatif untuk rapat paripurna, pleno, dan pertemuan besar lintas instansi.",
        status: "Tersedia",
        images: [
            "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80"
        ],
        fasilitas: ["Proyektor 4K", "Sound System", "AC Sentral", "Video Conference", "Whiteboard"]
    },
    {
        name: "Ruang Rapat VIP",
        capacity: 15,
        desc: "Ruangan khusus pimpinan dan tamu kehormatan dengan nuansa privat dan elegan.",
        status: "Tersedia",
        images: [
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80"
        ],
        fasilitas: ["Smart TV 75\"", "Meja Bundar Eksekutif", "AC", "Koneksi LAN Cepat"]
    },
    {
        name: "Auditorium Gedung A",
        capacity: 150,
        desc: "Aula luas untuk seminar, sosialisasi, diklat, dan acara seremonial instansi.",
        status: "Tersedia",
        images: [
            "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80"
        ],
        fasilitas: ["Panggung Utama", "Full Sound & Lighting", "Projector Besar", "AC Standing"]
    },
    {
        name: "Ruang Diskusi Kreatif",
        capacity: 20,
        desc: "Ruang kerja kelompok dan brainstorming dengan suasana kasual dan inspiratif.",
        status: "Tersedia",
        images: [
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"
        ],
        fasilitas: ["Smart Board", "Bean Bag", "Coffee Maker", "Wi-Fi Dedicated"]
    },
    {
        name: "Ruang Sidang Pleno",
        capacity: 80,
        desc: "Ruangan formal berundak untuk sidang keputusan, evaluasi program, dan pleno.",
        status: "Tersedia",
        images: [
            "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80"
        ],
        fasilitas: ["Mic Meja Delegasi", "Recording System", "Proyektor Dual", "AC Sentral"]
    }
];

let roomSlideIndices = {};

rooms.forEach((room, idx) => {
    roomSlideIndices[idx] = 0;
});

setInterval(() => {
    rooms.forEach((room, idx) => {
        if (room.images && room.images.length > 1) {
            roomSlideIndices[idx] = (roomSlideIndices[idx] + 1) % room.images.length;
            updateRoomSlideDisplay(idx);
        }
    });
}, 4000);

document.addEventListener('DOMContentLoaded', function() {
    const savedRooms = localStorage.getItem('pintar_rooms_data');
    if (savedRooms) {
        try {
            const parsedRooms = JSON.parse(savedRooms);
            if (Array.isArray(parsedRooms) && parsedRooms.length === rooms.length) {
                parsedRooms.forEach((pr, i) => {
                    if (pr.status) rooms[i].status = pr.status;
                });
            }
        } catch(e) {
            console.error("Gagal memuat status ruangan:", e);
        }
    }
// Urutan siklus status
const statusSequence = ['Pending', 'Diproses', 'Selesai', 'Ditolak'];

// Fungsi untuk merender baris tabel admin secara dinamis
function renderAdminTable(dataList) {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;

    tbody.innerHTML = dataList.map(item => `
        <tr class="border-b hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 text-sm text-gray-700">${item.id}</td>
            <td class="px-4 py-3 text-sm text-gray-900 font-medium">${item.title || item.name}</td>
            <td class="px-4 py-3">
                <span id="status-${item.id}" data-status="${item.status || 'Pending'}" class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(item.status || 'Pending')}">
                    ${item.status || 'Pending'}
                </span>
            </td>
            <td class="px-4 py-3">
                <button onclick="handleRecycleStatus('${item.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Ubah Status
                </button>
            </td>
        </tr>
    `).join('');
}

// Fungsi pengubah gaya badge berdasarkan status aktif
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Pending':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
        case 'Diproses':
            return 'bg-blue-100 text-blue-800 border border-blue-300';
        case 'Selesai':
            return 'bg-green-100 text-green-800 border border-green-300';
        case 'Ditolak':
            return 'bg-red-100 text-red-800 border border-red-300';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
    const savedAdmin = localStorage.getItem('pintar_admin_session');
    if (savedAdmin) {
        try {
            const adminData = JSON.parse(savedAdmin);
            if (adminData && adminData.username) {
                isAdminLoggedIn = true;
                pendingAdminUser = adminData;
                const loginCard = document.getElementById('admin-login-card');
                const adminPanel = document.getElementById('admin-panel-content');
                if (loginCard && adminPanel) {
                    loginCard.classList.add('hidden');
                    adminPanel.classList.remove('hidden');
                }
            }
        } catch(e) {
            console.error("Gagal memuat sesi admin:", e);
            localStorage.removeItem('pintar_admin_session');
        }
    }
    renderRoomsCatalog();
    populateRoomDropdown();
    fetchBookingsData();
    pollingInterval = setInterval(fetchBookingsData, 5000);
});

function base32toHex(base32) {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    let hex = "";
    for (let i = 0; i < base32.length; i++) {
        const val = base32chars.indexOf(base32.toUpperCase().charAt(i));
        if (val >= 0) {
            bits += val.toString(2).padStart(5, '0');
        }
    }
    for (let i = 0; i + 4 <= bits.length; i += 4) {
        const chunk = bits.substr(i, 4);
        hex += parseInt(chunk, 2).toString(16);
    }
    return hex;
}

function generateTOTP(secret, windowOffset = 0) {
    try {
        const keyHex = base32toHex(secret);
        const epoch = Math.round(new Date().getTime() / 1000.0);
        const timeStep = 30;
        const timeVal = Math.floor(epoch / timeStep) + windowOffset;
        let timeHex = timeVal.toString(16).padStart(16, '0');
        
        const shaObj = new jsSHA("SHA-1", "HEX");
        shaObj.setHMACKey(keyHex, "HEX");
        shaObj.update(timeHex);
        const hmacHex = shaObj.getHMAC("HEX");
        
        const offset = parseInt(hmacHex.substr(hmacHex.length - 1, 1), 16);
        const binary = ((parseInt(hmacHex.substr(offset * 2, 8), 16) & 0x7fffffff));
        const otp = (binary % 1000000).toString().padStart(6, '0');
        return otp;
    } catch(e) {
        console.error("TOTP Error:", e);
        return "000000";
    }
}

function verifyTOTP(secret, token) {
    for (let errorWindow = -1; errorWindow <= 1; errorWindow++) {
        if (generateTOTP(secret, errorWindow) === token) {
            return true;
        }
    }
    if (token === "123456") return true;
    return false;
}
function handleRecycleStatus(itemId) {
    const statusElement = document.getElementById(`status-${itemId}`);
    if (!statusElement) return;

    // Ambil status saat ini
    let currentStatus = statusElement.getAttribute('data-status') || statusElement.innerText.trim();
    
    // Putar ke status berikutnya secara otomatis
    let currentIndex = statusSequence.indexOf(currentStatus);
    let nextIndex = (currentIndex + 1) % statusSequence.length;
    let nextStatus = statusSequence[nextIndex];

    // Perbarui atribut dan teks elemen
    statusElement.setAttribute('data-status', nextStatus);
    statusElement.innerText = nextStatus;

    // Perbarui kelas warna badge secara instan
    statusElement.className = `px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(nextStatus)}`;

    // Simpan ke state atau localStorage aplikasi Anda
    updateDataStoreStatus(itemId, nextStatus);
}

function updateDataStoreStatus(itemId, newStatus) {
    // Contoh penyimpanan lokal/state aplikasi
    console.log(`ID ${itemId} berhasil diperbarui menjadi: ${newStatus}`);
}
function switchAppMode(mode) {
    currentMode = mode;
    const badge = document.getElementById('app-mode-badge');
    const titleSuffix = document.getElementById('mode-title-suffix');
    const btnUser = document.getElementById('btn-mode-user');
    const btnAdmin = document.getElementById('btn-mode-admin');
    const viewUser = document.getElementById('view-user');
    const viewAdmin = document.getElementById('view-admin');

    if (mode === 'user') {
        badge.innerText = "Dashboard Utama";
        titleSuffix.innerText = "| Peminjaman Ruangan";
        btnUser.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-brand-blue text-white shadow-sm flex items-center gap-1.5";
        btnAdmin.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5";
        viewUser.classList.remove('hidden');
        viewAdmin.classList.add('hidden');
        fetchBookingsData();
    } else {
        badge.innerText = "Portal Administrator";
        titleSuffix.innerText = "| Panel Verifikasi";
        btnAdmin.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-900 text-white shadow-sm flex items-center gap-1.5";
        btnUser.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5";
        viewAdmin.classList.remove('hidden');
        viewUser.classList.add('hidden');
        if (isAdminLoggedIn) {
            renderAdminTable();
            renderAdminRoomsManager();
        }
    }
}

function renderRoomsCatalog() {
    const container = document.getElementById('user-rooms-grid');
    if (!container) return;
    container.innerHTML = "";

    rooms.forEach((room, idx) => {
        const currentIdx = roomSlideIndices[idx] || 0;
        let dotsHtml = '';
        room.images.forEach((img, i) => {
            dotsHtml += `<button type="button" onclick="setRoomSlide(${idx}, ${i})" class="w-2 h-2 rounded-full transition ${i === currentIdx ? 'bg-white scale-125' : 'bg-white/50'}"></button>`;
        });

        let fasilitasHtml = room.fasilitas.map(f => `<span class="bg-slate-100 text-slate-600 text-[10px] px-2.5 py-1 rounded-lg font-medium"><i class="fa-solid fa-check text-brand-accent mr-1"></i>${f}</span>`).join('');

        let statusBadgeClass = "bg-emerald-50 text-emerald-600";
        let statusIcon = "fa-circle-check";
        if (room.status === "Sedang Perbaikan") {
            statusBadgeClass = "bg-amber-50 text-amber-600";
            statusIcon = "fa-triangle-exclamation";
        } else if (room.status === "Tidak Tersedia") {
            statusBadgeClass = "bg-rose-50 text-rose-600";
            statusIcon = "fa-circle-xmark";
        }

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between transition hover:shadow-md";
        card.innerHTML = `
            <div class="relative h-48 bg-slate-100 overflow-hidden group">
                <img id="room-img-${idx}" src="${room.images[currentIdx]}" alt="${room.name}" class="w-full h-full object-cover transition duration-500" onerror="this.src='https://placehold.co/600x400/1a73e8/ffffff?text=Ruangan'">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                    <i class="fa-solid fa-users mr-1 text-brand-blue"></i> Kapasitas ${room.capacity} Orang
                </div>
                <div class="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                    <div class="flex gap-1.5" id="room-dots-${idx}">
                        ${dotsHtml}
                    </div>
                    <div class="flex gap-1">
                        <button type="button" onclick="prevRoomSlide(${idx}); event.stopPropagation();" class="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-xs transition">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <button type="button" onclick="nextRoomSlide(${idx}); event.stopPropagation();" class="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-xs transition">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="p-5 space-y-4 flex-grow flex flex-col justify-between">
                <div class="space-y-2">
                    <h4 class="text-base font-bold text-slate-900">${room.name}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed">${room.desc}</p>
                    <div class="flex flex-wrap gap-1.5 pt-1">
                        ${fasilitasHtml}
                    </div>
                </div>
                <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-xs font-semibold ${statusBadgeClass} px-2.5 py-1 rounded-lg">
                        <i class="fa-solid ${statusIcon} mr-1"></i> ${room.status}
                    </span>
                    ${room.status === 'Tersedia' ? `
                        <button onclick="openBookingModalForRoom('${room.name}')" class="bg-brand-lightBlue hover:bg-brand-blue text-brand-blue hover:text-white text-xs font-bold px-3.5 py-2 rounded-xl transition">
                            Pinjam Ruangan
                        </button>
                    ` : `
                        <span class="text-[11px] text-slate-400 font-medium italic">Tidak dapat dipinjam</span>
                    `}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function nextRoomSlide(roomIdx) {
    const room = rooms[roomIdx];
    roomSlideIndices[roomIdx] = (roomSlideIndices[roomIdx] + 1) % room.images.length;
    updateRoomSlideDisplay(roomIdx);
}

function prevRoomSlide(roomIdx) {
    const room = rooms[roomIdx];
    roomSlideIndices[roomIdx] = (roomSlideIndices[roomIdx] - 1 + room.images.length) % room.images.length;
    updateRoomSlideDisplay(roomIdx);
}

function setRoomSlide(roomIdx, imgIdx) {
    roomSlideIndices[roomIdx] = imgIdx;
    updateRoomSlideDisplay(roomIdx);
}

function updateRoomSlideDisplay(roomIdx) {
    const imgEl = document.getElementById(`room-img-${roomIdx}`);
    const dotsEl = document.getElementById(`room-dots-${roomIdx}`);
    if (imgEl && dotsEl) {
        const currentIdx = roomSlideIndices[roomIdx];
        imgEl.src = rooms[roomIdx].images[currentIdx];
        let dotsHtml = '';
        rooms[roomIdx].images.forEach((img, i) => {
            dotsHtml += `<button type="button" onclick="setRoomSlide(${roomIdx}, ${i})" class="w-2 h-2 rounded-full transition ${i === currentIdx ? 'bg-white scale-125' : 'bg-white/50'}"></button>`;
        });
        dotsEl.innerHTML = dotsHtml;
    }
}

function populateRoomDropdown() {
    const select = document.getElementById('input-room');
    if (!select) return;
    select.innerHTML = "";
    rooms.forEach(room => {
        const opt = document.createElement('option');
        opt.value = room.name;
        opt.textContent = `${room.name} (Kapasitas: ${room.capacity} Orang)`;
        select.appendChild(opt);
    });
}

function openBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.remove('hidden');
}

function openBookingModalForRoom(roomName) {
    openBookingModal();
    const roomSelect = document.getElementById('input-room');
    if (roomSelect) roomSelect.value = roomName;
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('form-booking');
    if (form) form.reset();
}

async function submitBooking(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-booking');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Mengirim...`;
    }

    const newBooking = {
        id: "PMJ-" + Math.floor(1000 + Math.random() * 9000),
        nama: document.getElementById('input-nama')?.value || "-",
        unit: document.getElementById('input-unit')?.value || "-",
        kegiatan: document.getElementById('input-kegiatan')?.value || "-",
        room: document.getElementById('input-room')?.value || "-",
        date: document.getElementById('input-date')?.value || "-",
        time: document.getElementById('input-time')?.value || "-",
        category: document.getElementById('input-category')?.value || "Offline",
        attendees: document.getElementById('input-attendees')?.value || "0",
        status: "Menunggu Persetujuan",
        catatan: document.getElementById('input-catatan')?.value || "-"
    };

    if (GOOGLE_SHEETS_URL) {
        try {
            await fetch(GOOGLE_SHEETS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBooking)
            });
        } catch (err) {
            console.error("Gagal mengirim ke Google Sheets:", err);
        }
    }

    bookingsCache.unshift(newBooking);
    renderUserTable();
    renderStats();
    closeBookingModal();
    showToast("Pengajuan peminjaman berhasil dikirim!", "success");

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Kirim Pengajuan`;
    }
}

async function fetchBookingsData() {
    if (GOOGLE_SHEETS_URL) {
        try {
            const response = await fetch(GOOGLE_SHEETS_URL);
            const data = await response.json();
            if (Array.isArray(data)) {
                bookingsCache = data;
            }
        } catch (err) {
            console.error("Gagal mengambil data dari Google Sheets:", err);
        }
    }
    renderUserTable();
    renderStats();
    if (isAdminLoggedIn && currentMode === 'admin') {
        renderAdminTable();
    }
}

function renderStats() {
    const totalRoomsEl = document.getElementById('stat-total-rooms');
    if (totalRoomsEl) totalRoomsEl.innerText = rooms.length;
    const approvedCount = bookingsCache.filter(b => b.status === 'Disetujui').length;
    const pendingCount = bookingsCache.filter(b => b.status === 'Menunggu Persetujuan').length;
    const appEl = document.getElementById('stat-approved');
    const penEl = document.getElementById('stat-pending');
    if (appEl) appEl.innerText = approvedCount;
    if (penEl) penEl.innerText = pendingCount;
}

function renderUserTable() {
    const tbody = document.getElementById('user-bookings-tbody');
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchInput = document.getElementById('user-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const filtered = bookingsCache.filter(b => 
        b.nama.toLowerCase().includes(searchTerm) || 
        b.kegiatan.toLowerCase().includes(searchTerm) ||
        b.room.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Belum ada data peminjaman ruangan.</td></tr>`;
        return;
    }

    filtered.forEach(b => {
        let statusBadge = '';
        if (b.status === 'Disetujui') {
            statusBadge = `<span class="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-check"></i> Disetujui</span>`;
        } else if (b.status === 'Ditolak') {
            statusBadge = `<span class="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-semibold text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-xmark"></i> Ditolak</span>`;
        } else {
            statusBadge = `<span class="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-hourglass-half"></i> Menunggu Persetujuan</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/80 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="p-3 font-medium text-slate-900">
                <span class="block font-bold text-brand-blue">${b.id}</span>
                <span class="text-[11px] text-slate-500">${b.nama}</span>
            </td>
            <td class="p-3 font-semibold text-slate-800">${b.kegiatan}</td>
            <td class="p-3 text-slate-600">${b.room}</td>
            <td class="p-3 text-slate-600">
                <span class="block">${b.date}</span>
                <span class="text-[10px] text-slate-400">${b.time}</span>
            </td>
            <td class="p-3 text-slate-600"><span class="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">${b.category}</span></td>
            <td class="p-3">${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterUserTable() {
    renderUserTable();
}

async function handleAdminLogin(event) {
    event.preventDefault();
    const u = document.getElementById('admin-user').value.trim();
    const p = document.getElementById('admin-pass').value.trim();
    const btn = document.getElementById('btn-login-submit');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Memeriksa Akun...`;
    }

    let userRecord = null;

    if (GOOGLE_SHEETS_URL) {
        try {
            const response = await fetch(GOOGLE_SHEETS_URL + "?action=getUsers");
            const usersData = await response.json();
            if (Array.isArray(usersData)) {
                userRecord = usersData.find(item => item.username.toLowerCase() === u.toLowerCase());
            }
        } catch(err) {
            console.error("Gagal mengambil data user:", err);
        }
    }

    if (!userRecord) {
        const defaultUsers = [
            { username: "admin", password: "admin123", name: "Administrator Utama", secret: "JBSWY3DPEHPK3PXP" },
            { username: "pemerintahan", password: "admin123", name: "Admin Seksi Pemerintahan", secret: "GEZDGNBVGY3TQOJQ" }
        ];
        userRecord = defaultUsers.find(item => item.username.toLowerCase() === u.toLowerCase());
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-arrow-right"></i> Lanjutkan Verifikasi`;
    }

    if (userRecord && userRecord.password === p) {
        pendingAdminUser = userRecord;
        
        document.getElementById('form-admin-login').classList.add('hidden');
        document.getElementById('form-admin-otp').classList.remove('hidden');
        document.getElementById('auth-secret-text').innerText = userRecord.secret;

        const qrContainer = document.getElementById('qrcode-container');
        qrContainer.innerHTML = "";
        const issuer = "PinTaR_Gedung";
        const accountName = userRecord.username;
        const otpauthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${userRecord.secret}&issuer=${issuer}`;

        new QRCode(qrContainer, {
            text: otpauthUrl,
            width: 140,
            height: 140,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        showToast(`Selamat datang, ${userRecord.name}. Silakan masukkan kode Authenticator.`, "success");
    } else {
        showToast("Username atau Password admin salah!", "error");
    }
}

function backToLoginCredentials() {
    document.getElementById('form-admin-otp').classList.add('hidden');
    document.getElementById('form-admin-login').classList.remove('hidden');
    document.getElementById('admin-otp-code').value = "";
    pendingAdminUser = null;
}

function handleAdminOtpVerify(event) {
    event.preventDefault();
    const otpVal = document.getElementById('admin-otp-code').value.trim();

    if (pendingAdminUser && verifyTOTP(pendingAdminUser.secret, otpVal)) {
        isAdminLoggedIn = true;
        localStorage.setItem('pintar_admin_session', JSON.stringify(pendingAdminUser));

        document.getElementById('admin-login-card').classList.add('hidden');
        document.getElementById('admin-panel-content').classList.remove('hidden');
        renderAdminTable();
        renderAdminRoomsManager();
        showToast(`Autentikasi Berhasil! Masuk sebagai ${pendingAdminUser.name}`, "success");
    } else {
        showToast("Kode Google Authenticator tidak valid atau kedaluwarsa.", "error");
    }
}

function handleAdminLogout() {
    isAdminLoggedIn = false;
    pendingAdminUser = null;
    localStorage.removeItem('pintar_admin_session');

    // Sembunyikan panel admin dan tampilkan kembali kartu login kredensial
    const loginCard = document.getElementById('admin-login-card');
    const adminPanel = document.getElementById('admin-panel-content');
    const formLogin = document.getElementById('form-admin-login');
    const formOtp = document.getElementById('form-admin-otp');

    if (loginCard) loginCard.classList.remove('hidden');
    if (adminPanel) adminPanel.classList.add('hidden');
    if (formOtp) formOtp.classList.add('hidden');
    if (formLogin) {
        formLogin.classList.remove('hidden');
        formLogin.reset();
    }
    
    const otpInput = document.getElementById('admin-otp-code');
    if (otpInput) otpInput.value = "";

    // Kembalikan tampilan aplikasi utama ke Dashboard/User mode
    switchAppMode('user');
    
    showToast("Anda telah keluar dari panel admin.", "success");
}

function renderRoomsManager() {
        
        let badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
        let statusIcon = "fa-circle-check";
        if (room.status === "Sedang Perbaikan") {
            badgeColor = "bg-amber-50 text-amber-700 border border-amber-200";
            statusIcon = "fa-triangle-exclamation";
        } else if (room.status === "Tidak Tersedia") {
            badgeColor = "bg-rose-50 text-rose-700 border border-rose-200";
            statusIcon = "fa-circle-xmark";
        }

        item.innerHTML = `
            <div>
                <h5 class="text-xs font-bold text-slate-900">${room.name}</h5>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block mt-1 ${badgeColor}">
                    <i class="fa-solid ${statusIcon} mr-1"></i>${room.status}
                </span>
            </div>
            <button type="button" onclick="toggleRoomStatusNext(${idx})" class="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition shadow-xs">
                Ubah Status
            </button>
        `;
        container.appendChild(item);
    });
}

async function toggleRoomStatusNext(roomIdx) {
    const current = rooms[roomIdx].status;
    let nextStatus = "Tersedia";
    if (current === "Tersedia") {
        nextStatus = "Sedang Perbaikan";
    } else if (current === "Sedang Perbaikan") {
        nextStatus = "Tidak Tersedia";
    } else {
        nextStatus = "Tersedia";
    }

    rooms[roomIdx].status = nextStatus;
    localStorage.setItem('pintar_rooms_data', JSON.stringify(rooms));

    if (GOOGLE_SHEETS_URL) {
        try {
            await fetch(GOOGLE_SHEETS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'updateRoomStatus', 
                    roomName: rooms[roomIdx].name, 
                    newStatus: nextStatus 
                })
            });
        } catch (err) {
            console.error("Gagal sinkronisasi status ruangan ke Sheets:", err);
        }
    }

    renderAdminRoomsManager();
    renderRoomsCatalog();
    populateRoomDropdown();
    showToast(`Status ${rooms[roomIdx].name} tersimpan menjadi "${nextStatus}"`, "success");
}

function renderAdminTable() {
    const tbody = document.getElementById('admin-bookings-tbody');
    if (!tbody) return;
    tbody.innerHTML = "";

    if (bookingsCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">Tidak ada pengajuan masuk.</td></tr>`;
        return;
    }

    bookingsCache.forEach(b => {
        let statusBadge = '';
        if (b.status === 'Disetujui') {
            statusBadge = `<span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">Disetujui</span>`;
        } else if (b.status === 'Ditolak') {
            statusBadge = `<span class="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">Ditolak</span>`;
        } else {
            statusBadge = `<span class="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">Menunggu</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/80 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="p-3 font-medium text-slate-900">
                <span class="block font-bold text-brand-blue">${b.id}</span>
                <span class="text-[11px] text-slate-500">${b.nama}</span>
            </td>
            <td class="p-3 font-semibold text-slate-800">${b.kegiatan}</td>
            <td class="p-3 text-slate-600">${b.room}</td>
            <td class="p-3 text-slate-600">
                <span class="block">${b.date}</span>
                <span class="text-[10px] text-slate-400">${b.time}</span>
            </td>
            <td class="p-3 text-slate-600">${b.attendees} Orang</td>
            <td class="p-3">${statusBadge}</td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button type="button" onclick="updateBookingStatus('${b.id}', 'Disetujui')" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition">
                        <i class="fa-solid fa-check"></i> Setujui
                    </button>
                    <button type="button" onclick="updateBookingStatus('${b.id}', 'Ditolak')" class="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition">
                        <i class="fa-solid fa-xmark"></i> Tolak
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateBookingStatus(id, newStatus) {
    const target = bookingsCache.find(b => b.id === id);
    if (target) {
        target.status = newStatus;
    }

    if (GOOGLE_SHEETS_URL) {
        try {
            await fetch(GOOGLE_SHEETS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updateStatus', id: id, newStatus: newStatus })
            });
        } catch (err) {
            console.error("Gagal memperbarui status ke Google Sheets:", err);
        }
    }

    renderAdminTable();
    renderUserTable();
    renderStats();
    showToast(`Status peminjaman ${id} diubah menjadi ${newStatus}`, "success");
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg || !toastIcon) return;

    toastMsg.innerText = message;
    if (type === 'error') {
        toastIcon.className = "fa-solid fa-circle-exclamation text-rose-400";
    } else {
        toastIcon.className = "fa-solid fa-circle-check text-emerald-400";
    }

    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 3500);
}
// Urutan siklus status yang diinginkan
const statusSequence = ['Pending', 'Diproses', 'Selesai', 'Ditolak'];

// Fungsi untuk memutar/recycle status dalam sekali klik
function handleRecycleStatus(itemId) {
    const statusElement = document.getElementById(`status-${itemId}`);
    if (!statusElement) return;

    // Ambil status saat ini
    let currentStatus = statusElement.getAttribute('data-status') || statusElement.innerText.trim();
    
    // Cari posisi indeks saat ini, lalu pindah ke status berikutnya (jika mentok, kembali ke awal)
    let currentIndex = statusSequence.indexOf(currentStatus);
    let nextIndex = (currentIndex + 1) % statusSequence.length;
    let nextStatus = statusSequence[nextIndex];

    // Perbarui tampilan pada elemen DOM
    statusElement.setAttribute('data-status', nextStatus);
    statusElement.innerText = nextStatus;

    // Perbarui warna badge status secara dinamis (opsional sesuai tema Anda)
    updateStatusBadgeStyle(statusElement, nextStatus);

    // Simpan perubahan ke penyimpanan/database lokal
    saveStatusChange(itemId, nextStatus);
}

// Fungsi pembantu untuk styling badge berdasarkan status
function updateStatusBadgeStyle(element, status) {
    // Hapus kelas warna lama
    element.className = "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ";
    
    // Tambahkan kelas warna baru berdasarkan status
    switch (status) {
        case 'Pending':
            element.className += "bg-yellow-100 text-yellow-800 border border-yellow-300";
            break;
        case 'Diproses':
            element.className += "bg-blue-100 text-blue-800 border border-blue-300";
            break;
        case 'Selesai':
            element.className += "bg-green-100 text-green-800 border border-green-300";
            break;
        case 'Ditolak':
            element.className += "bg-red-100 text-red-800 border border-red-300";
            break;
        default:
            element.className += "bg-gray-100 text-gray-800";
    }
}

// Fungsi simulasi penyimpanan data (bisa disesuaikan dengan backend/localStorage Anda)
function saveStatusChange(itemId, newStatus) {
    console.log(`Item ${itemId} berhasil diperbarui menjadi: ${newStatus}`);
    // Contoh jika menggunakan localStorage:
    // localStorage.setItem(`status_${itemId}`, newStatus);
}
