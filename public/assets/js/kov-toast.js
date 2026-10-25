/**
 * KOV Management Portal - Bespoke Human-Crafted Toast & Micro-Interaction Utility
 * High-contrast, tactile notifications, animated SVG checkmarks & button loading states.
 * No external dependencies required.
 */
(function(window) {
  'use strict';

  // SVG Icons with crisp saturated vectors
  const ICONS = {
    success: `
      <svg class="kov-toast-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" class="kov-svg-circle" stroke="#10b981" fill="#ecfdf5"/>
        <path d="m9 12 2 2 4-4" class="kov-svg-check" stroke="#047857"/>
      </svg>
    `,
    error: `
      <svg class="kov-toast-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" stroke="#f43f5e" fill="#fff1f2"/>
        <line x1="15" y1="9" x2="9" y2="15" stroke="#be123c"/>
        <line x1="9" y1="9" x2="15" y2="15" stroke="#be123c"/>
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
    `
  };

  const DEFAULT_TITLES = {
    success: 'Berhasil',
    error: 'Terjadi Kesalahan',
    warning: 'Perhatian',
    info: 'Informasi'
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

  function showToast({ type = 'info', title = '', message = '', duration = 2200 }) {
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
        if (container.children.length === 0) {
          // keep container in DOM for reuse
        }
      }, { once: true });
    }

    closeBtn.addEventListener('click', dismiss);

    container.appendChild(toast);

    if (duration > 0) {
      progressBar.style.transition = `width ${duration}ms linear`;
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });

      timer = setTimeout(dismiss, duration);

      // Pause timer on hover
      toast.addEventListener('mouseenter', () => {
        if (timer) clearTimeout(timer);
        progressBar.style.transitionPlayState = 'paused';
      });
      toast.addEventListener('mouseleave', () => {
        timer = setTimeout(dismiss, 1500);
      });
    } else {
      progressBar.parentElement.remove();
    }

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

  // Button Loading State Helper
  function setButtonLoading(btn, loadingText = 'Memproses...') {
    if (!btn || btn.dataset.kovLoading === 'true') return;
    btn.dataset.kovLoading = 'true';
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('kov-btn-is-loading');

    btn.innerHTML = `
      <span class="kov-btn-spinner" aria-hidden="true"></span>
      <span class="kov-btn-loading-text">${escapeHtml(loadingText)}</span>
    `;
  }

  function resetButtonLoading(btn) {
    if (!btn || btn.dataset.kovLoading !== 'true') return;
    btn.disabled = false;
    btn.classList.remove('kov-btn-is-loading');
    if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
    }
    delete btn.dataset.kovLoading;
    delete btn.dataset.originalHtml;
  }

  // Interactive Approval Modal / Feedback with Animated Checkmark
  function showApprovalFeedback(options = {}) {
    const {
      title = 'Persetujuan Berhasil Disimpan',
      message = 'Perubahan status dokumen telah berhasil diperbarui ke dalam sistem.',
      duration = 2500,
      onComplete = null
    } = options;

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
    }, duration);
  }

  // Global Export
  window.KovToast = {
    show: showToast,
    success: (msg, title, duration) => showToast({ type: 'success', message: msg, title: title || 'Berhasil', duration }),
    error: (msg, title, duration) => showToast({ type: 'error', message: msg, title: title || 'Gagal', duration: duration || 5000 }),
    warning: (msg, title, duration) => showToast({ type: 'warning', message: msg, title: title || 'Perhatian', duration }),
    info: (msg, title, duration) => showToast({ type: 'info', message: msg, title: title || 'Informasi', duration }),
    setLoading: setButtonLoading,
    resetLoading: resetButtonLoading,
    approvalFeedback: showApprovalFeedback
  };

  // Auto-bind form submissions with data-kov-loading (failsafe for validation)
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form[data-kov-loading]').forEach(form => {
      form.addEventListener('submit', function(e) {
        if (!form.checkValidity()) {
          return; // Let browser HTML5 validation show without disabling the button!
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
