function formatDDMMYYYY(dateStr) {
  if (!dateStr) return '-';
  try {
    let cleanDate = String(dateStr).trim();
    if (cleanDate.includes('T')) {
      cleanDate = cleanDate.split('T')[0];
    }
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch(e) {}
  return dateStr;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.replace(/WIB/gi, '').trim();
  const parts = clean.split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toastId = 'toast-' + Date.now();
  let bgClass = 'bg-slate-900 text-white border-slate-800';
  let iconHtml = '<i class="fa-solid fa-circle-info text-blue-400 text-base shrink-0"></i>';
  
  if (type === 'success') {
    bgClass = 'bg-emerald-950/95 text-emerald-100 border-emerald-800/60';
    iconHtml = '<i class="fa-solid fa-circle-check text-emerald-400 text-base shrink-0"></i>';
  } else if (type === 'warning') {
    bgClass = 'bg-amber-950/95 text-amber-100 border-amber-800/60';
    iconHtml = '<i class="fa-solid fa-triangle-exclamation text-amber-400 text-base shrink-0 animate-bounce"></i>';
  } else if (type === 'error') {
    bgClass = 'bg-rose-950/95 text-rose-100 border-rose-800/60';
    iconHtml = '<i class="fa-solid fa-circle-xmark text-rose-400 text-base shrink-0"></i>';
  }

  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `backdrop-blur-xl border shadow-2xl rounded-2xl p-4 flex items-start space-x-3 text-xs font-medium transition-all transform translate-y-3 opacity-0 pointer-events-auto max-w-sm w-full ${bgClass} animate-fade-in`;
  toast.innerHTML = `
    <div class="mt-0.5">${iconHtml}</div>
    <div class="flex-grow space-y-0.5">
      <div class="font-bold tracking-tight uppercase text-[9px] opacity-75">${type === 'warning' ? 'Perhatian Khusus' : 'Informasi Sistem'}</div>
      <div class="leading-relaxed">${message}</div>
    </div>
    <button onclick="document.getElementById('${toastId}').remove()" class="text-white/50 hover:text-white transition cursor-pointer p-1">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;
  
  container.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-y-3', 'opacity-0'), 50);
  setTimeout(() => {
    const el = document.getElementById(toastId);
    if (el) {
      el.classList.add('opacity-0', 'translate-y-3');
      setTimeout(() => el.remove(), 300);
    }
  }, 5000);
}
