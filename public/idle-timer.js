// Idle Timeout Auto-Logout (2 Jam Tanpa Aktivitas dengan Proteksi Background Tab)
(function() {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 2 Jam (7,200,000 ms)
  const PING_INTERVAL_MS = 10 * 60 * 1000; // Sinkronisasi keep-alive ke server tiap 10 menit
  let lastActive = Date.now();
  let lastPing = Date.now();
  let isCheckingTimeout = false;

  function verifySession(onSuccess, onExpired) {
    fetch('/api/keep-alive', { credentials: 'same-origin' })
      .then(function(res) {
        if (res.status === 401) {
          if (onExpired) onExpired();
          else window.location.href = '/admin/login?expired=1';
        } else if (res.ok) {
          lastPing = Date.now();
          if (onSuccess) onSuccess();
        }
      })
      .catch(function() {
        // Network error / offline, do not aggressively force logout
      });
  }

  function recordActivity() {
    lastActive = Date.now();

    // Jika sudah lebih dari 10 menit sejak ping terakhir dan pengguna sedang aktif, kirim keep-alive
    if (Date.now() - lastPing > PING_INTERVAL_MS) {
      lastPing = Date.now();
      verifySession();
    }
  }

  // Pasang listener pada seluruh event interaksi pengguna
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
  activityEvents.forEach(function(evt) {
    window.addEventListener(evt, recordActivity, { passive: true });
  });

  // Cegah false-positive auto-logout pada background tab yang diaktifkan kembali
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      verifySession(function() {
        lastActive = Date.now();
      });
    }
  });

  // Periksa inaktivitas secara berkala setiap 15 detik
  setInterval(function() {
    const idleDuration = Date.now() - lastActive;
    if (idleDuration >= TWO_HOURS_MS && !isCheckingTimeout) {
      isCheckingTimeout = true;
      // Validasi ganda ke server sebelum memutuskan logout paksa
      verifySession(
        function() {
          // Server masih mengonfirmasi sesi aktif (misal pengguna aktif di tab lain)
          lastActive = Date.now();
          isCheckingTimeout = false;
        },
        function() {
          // Terkonfirmasi sesi telah berakhir di server
          window.location.href = '/admin/login?expired=1';
        }
      );
    }
  }, 15000);
})();
