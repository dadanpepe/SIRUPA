const appState = {
  isAdminLoggedIn: false,
  currentAdmin: null,
  activeView: 'dashboard',
  totpTimer: 30,
  currentYear: 2026,
  currentMonth: 7, // August (0-indexed)
  announcementsList: [
    "Sistem Informasi Ruangan dan Peminjaman (SIRUPA) aktif. Proteksi anti double-input, validasi jam lampau, & pop-up bentrok ketat real-time."
  ],
  adminAccounts: [
    { username: 'superadmin', name: 'Super Administrator', pass: 'admin123', unit: 'Semua Dinas', isSuper: true },
    { username: 'admin_umum', name: 'Budi Santoso', pass: 'admin123', unit: 'Bagian Umum', isSuper: false },
    { username: 'admin_it', name: 'Siti Rahma', pass: 'admin123', unit: 'Bappeda & IT', isSuper: false }
  ],
  rooms: [
    { 
      id: 'room-1', 
      name: 'Ruang Aula Besar', 
      category: 'Auditorium', 
      capacity: '100 Orang', 
      unit: 'INSPEKTORAT', 
      available: true, 
      statusText: 'Tersedia', 
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
      icon: 'fa-circle-check', 
      description: 'Ruangan representatif untuk rapat paripurna dan pertemuan besar.', 
      features: ['Proyektor 4K', 'Sound System', 'AC Sentral'], 
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80'
      ], 
      currentImageIdx: 0 
    },
    { 
      id: 'room-2', 
      name: 'Auditorium Gedung A', 
      category: 'Auditorium', 
      capacity: '150 Orang', 
      unit: 'Bappeda & IT', 
      available: true, 
      statusText: 'Tersedia', 
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
      icon: 'fa-circle-check', 
      description: 'Aula luas untuk seminar, sosialisasi, dan diklat instansi.', 
      features: ['Panggung Utama', 'Full Sound & Lighting'], 
      images: [
        'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80'
      ], 
      currentImageIdx: 0 
    }
  ],
  bookings: [
    { id: 'PMJ-1029', pemohon: 'Ahmad Fauzi', email: 'ahmad@example.com', unit: 'Bagian Umum', kategori: 'Rapat Dinas', kegiatan: 'Rapat Koordinasi Triwulan', ruangan: 'Ruang Aula Besar', tanggal: '2026-08-21', jam: '08:00 - 17:00 WIB', peserta: 45, catatan: 'Mic wireless', berkasUrl: '#', status: 'Disetujui', tahun: 2026, timestamp: '2026-08-10 09:30' }
  ]
};

let chartInstances = {};
let roomSlideInterval = null;
