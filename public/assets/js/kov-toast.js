/**
 * KOV Management Portal - Bespoke Choreographed Feedback, Toast & Animation Engine
 * Features:
 * 1. Loading State Animation: Top bar laser loader, dual-ring orbital spinner, button morphing
 * 2. Submit Success Animation: Animated SVG stroke-draw checkmark modal & slide-in toast
 * 3. Error State Animation: Physics-based shake (@keyframes kovErrorShake), inline field error reveal, & animated SVG cross vector
 * No external dependencies required.
 */
(function(window) {
  'use strict';

  const ICONS = {
    success: `
      <svg class="kov-toast-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" class="kov-svg-circle" stroke="#10b981" fill="#ecfdf5"/>
        <path d="m8.5 12.5 2.3 2.3 4.7-4.8" class="kov-svg-check" stroke="#047857" style="stroke-dasharray: 20; stroke-dashoffset: 20; animation: kovDrawStroke 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.12s forwards;"/>
      </svg>
    `,
    error: `
      <svg class="kov-toast-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" stroke="#f43f5e" fill="#fff1f2"/>
        <line x1="15" y1="9" x2="9" y2="15" stroke="#be123c" style="stroke-dasharray: 12; stroke-dashoffset: 12; animation: kovDrawStroke 0.35s ease 0.1s forwards;"/>
        <line x1="9" y1="9" x2="15" y2="15" stroke="#be123c" style="stroke-dasharray: 12; stroke-dashoffset: 12; animation: kovDrawStroke 0.35s ease 0.22s forwards;"/>
      </svg>
    `,
    warning: `
      <svg class="kov-toast-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" fill="#fffbeb" stroke="#f59e0b"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="#b45309"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="#b45309"/>
      </svg>
    `,
    info: `
      <svg class="kov-toast-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" stroke="#3b82f6" fill="#eff6ff"/>
        <line x1="12" y1="16" x2="12" y2="12" stroke="#1d4ed8"/>
        <line x1="12" y1="8" x2="12.01" y2="8" stroke="#1d4ed8"/>
      </svg>
    `,
    loading: `
      <svg class="kov-toast-icon-svg kov-orbital-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.5" stroke="#d1fae5" stroke-width="2.5"/>
        <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `
  };

  const DEFAULT_TITLES = {
    success: 'Berhasil Disimpan',
    error: 'Validasi Gagal / Error',
    warning: 'Perhatian',
    info: 'Informasi Sistem',
    loading: 'Sedang Memproses...'
  };

  function getContainer() {
    let container = document.getElementById('kovToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'kovToastContainer';
      container.className = 'kov-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function showTopProgress(active = true) {
    let bar = document.getElementById('kovTopProgressBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'kovTopProgressBar';
      bar.className = 'kov-top-progress-bar';
      document.body.appendChild(bar);
    }
    if (active) {
      bar.classList.remove('is-done');
      bar.classList.add('is-active');
    } else {
      bar.classList.add('is-done');
      setTimeout(() => {
        bar.classList.remove('is-active', 'is-done');
      }, 320);
    }
  }

  function showToast({ type = 'info', title = '', message = '', duration = 2600 }) {
    const container = getContainer();
    const finalTitle = title || DEFAULT_TITLES[type] || 'Notifikasi';

    const toast = document.createElement('div');
    toast.className = `kov-toast kov-toast-${type}`;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
      <div class="kov-toast-icon-wrapper">
        ${ICONS[type] || ICONS.info}
      </div>
      <div class="kov-toast-content">
        <div class="kov-toast-title">${escapeHtml(finalTitle)}</div>
        ${message ? `<div class="kov-toast-msg">${escapeHtml(message).replace(/\n/g, '<br>')}</div>` : ''}
      </div>
      <button type="button" class="kov-toast-close" aria-label="Tutup notifikasi">&times;</button>
      <div class="kov-toast-progress">
        <div class="kov-toast-progress-bar kov-toast-progress-${type}"></div>
      </div>
    `;

    const closeBtn = toast.querySelector('.kov-toast-close');
    const progressBar = toast.querySelector('.kov-toast-progress-bar');

    let dismissed = false;
    let timer = null;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      if (timer) clearTimeout(timer);
      toast.classList.add('kov-toast-hiding');
      toast.addEventListener('animationend', () => {
        toast.remove();
      }, { once: true });
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 350);
    }

    closeBtn.addEventListener('click', dismiss);
    container.appendChild(toast);

    if (duration > 0) {
      progressBar.style.transition = `width ${duration}ms linear`;
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });

      timer = setTimeout(dismiss, duration);

      toast.addEventListener('mouseenter', () => {
        if (timer) clearTimeout(timer);
        progressBar.style.transitionPlayState = 'paused';
      });
      toast.addEventListener('mouseleave', () => {
        timer = setTimeout(dismiss, 1400);
      });
    } else {
      progressBar.parentElement.remove();
    }

    toast.dismiss = dismiss;
    return toast;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Button Loading State Helper with Dual-Ring Spinner
  function setButtonLoading(btn, loadingText = 'Memproses...') {
    if (!btn || btn.dataset.kovLoading === 'true') return;
    btn.dataset.kovLoading = 'true';
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('kov-btn-is-loading');
    showTopProgress(true);

    btn.innerHTML = `
      <span class="kov-btn-spinner" aria-hidden="true"></span>
      <span class="kov-btn-loading-text">${escapeHtml(loadingText)}</span>
    `;
  }

  function resetButtonLoading(btn) {
    showTopProgress(false);
    if (!btn || btn.dataset.kovLoading !== 'true') return;
    btn.disabled = false;
    btn.classList.remove('kov-btn-is-loading');
    if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
    }
    delete btn.dataset.kovLoading;
    delete btn.dataset.originalHtml;
  }

  // Physics-based Error Shake & Inline Field Error Helper
  function triggerError(targetEl, errorMessage = 'Mohon lengkapi kolom yang wajib diisi.', toastTitle = 'Validasi Gagal') {
    showTopProgress(false);
    if (targetEl) {
      targetEl.classList.remove('kov-error-shake');
      void targetEl.offsetWidth; // force reflow to replay shake animation
      targetEl.classList.add('kov-error-shake', 'kov-input-invalid');

      let msgEl = targetEl.parentElement ? targetEl.parentElement.querySelector('.kov-inline-error-msg') : null;
      if (!msgEl && targetEl.parentElement) {
        msgEl = document.createElement('div');
        msgEl.className = 'kov-inline-error-msg';
        targetEl.parentElement.appendChild(msgEl);
      }
      if (msgEl) {
        msgEl.innerHTML = `<i class="fas fa-circle-exclamation me-1"></i><span>${escapeHtml(errorMessage)}</span>`;
        msgEl.classList.add('is-visible');
      }

      if (typeof targetEl.focus === 'function') {
        targetEl.focus();
      }

      const clearHandler = () => {
        targetEl.classList.remove('kov-input-invalid', 'kov-error-shake');
        if (msgEl) msgEl.classList.remove('is-visible');
        targetEl.removeEventListener('input', clearHandler);
      };
      targetEl.addEventListener('input', clearHandler);
    }

    return showToast({
      type: 'error',
      title: toastTitle,
      message: errorMessage,
      duration: 3800
    });
  }

  // Interactive Submit / Approval Feedback Modal with Animated Checkmark
  function showApprovalFeedback(options = {}) {
    const {
      title = 'Data Berhasil Disimpan',
      message = 'Perubahan telah tercatat secara permanen ke dalam sistem KOV.',
      duration = 1900,
      onComplete = null
    } = options;

    showTopProgress(false);

    const overlay = document.createElement('div');
    overlay.className = 'kov-approval-overlay';
    overlay.innerHTML = `
      <div class="kov-approval-modal">
        <div class="kov-approval-icon-box">
          <svg class="kov-checkmark-svg" viewBox="0 0 52 52">
            <circle class="kov-checkmark-circle" cx="26" cy="26" r="24" fill="none"/>
            <path class="kov-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <h4 class="kov-approval-title">${escapeHtml(title)}</h4>
        <p class="kov-approval-desc">${escapeHtml(message)}</p>
      </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('kov-approval-leaving');
      overlay.addEventListener('animationend', () => {
        overlay.remove();
        if (typeof onComplete === 'function') onComplete();
      }, { once: true });
      setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 350);
    }, duration);
  }

  // Global Export
  window.KovToast = {
    show: showToast,
    success: (msg, title, duration) => showToast({ type: 'success', message: msg, title: title || 'Berhasil Disimpan', duration }),
    error: (msg, title, duration) => showToast({ type: 'error', message: msg, title: title || 'Terjadi Kesalahan', duration: duration || 4200 }),
    warning: (msg, title, duration) => showToast({ type: 'warning', message: msg, title: title || 'Perhatian', duration }),
    info: (msg, title, duration) => showToast({ type: 'info', message: msg, title: title || 'Informasi', duration }),
    loading: (msg, title) => showToast({ type: 'loading', message: msg || 'Menyinkronkan data...', title: title || 'Memproses...', duration: 0 }),
    setLoading: setButtonLoading,
    resetLoading: resetButtonLoading,
    showTopProgress: showTopProgress,
    triggerError: triggerError,
    approvalFeedback: showApprovalFeedback
  };

  // Auto-bind form submissions with data-kov-loading
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form[data-kov-loading]').forEach(form => {
      form.addEventListener('submit', function(e) {
        if (!form.checkValidity()) {
          e.preventDefault();
          const firstInvalid = form.querySelector(':invalid');
          triggerError(firstInvalid, (firstInvalid && firstInvalid.validationMessage) || 'Mohon lengkapi seluruh kolom wajib.');
          return;
        }
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
          const text = submitBtn.getAttribute('data-loading-text') || 'Menyimpan...';
          setTimeout(() => setButtonLoading(submitBtn, text), 0);
        }
      });
    });
  });

})(window);
