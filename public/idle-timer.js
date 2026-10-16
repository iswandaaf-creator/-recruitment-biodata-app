// Idle Timeout Auto-Logout (2 Jam Tanpa Aktivitas)
(function() {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 2 Jam (7,200,000 ms)
  const PING_INTERVAL_MS = 10 * 60 * 1000; // Sinkronisasi keep-alive ke server tiap 10 menit
  let lastActive = Date.now();
  let lastPing = Date.now();

  function recordActivity() {
    lastActive = Date.now();

    // Jika sudah lebih dari 10 menit sejak ping terakhir dan pengguna sedang aktif, kirim keep-alive
    if (Date.now() - lastPing > PING_INTERVAL_MS) {
      lastPing = Date.now();
      fetch('/api/keep-alive', { credentials: 'same-origin' })
        .then(function(res) {
          if (res.status === 401) {
            // Sesi di server sudah expired
            window.location.href = '/admin/login?expired=1';
          }
        })
        .catch(function() {});
    }
  }

  // Pasang listener pada seluruh event interaksi pengguna
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
  activityEvents.forEach(function(evt) {
    window.addEventListener(evt, recordActivity, { passive: true });
  });

  // Periksa inaktivitas secara berkala setiap 10 detik
  setInterval(function() {
    const idleDuration = Date.now() - lastActive;
    if (idleDuration >= TWO_HOURS_MS) {
      window.location.href = '/admin/login?expired=1';
    }
  }, 10000);
})();
