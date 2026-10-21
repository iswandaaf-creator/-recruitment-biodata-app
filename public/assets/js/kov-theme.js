/**
 * KOV Management Portal - Coinbase Dual Theme Engine (Light Alabaster / Dark Cosmic Midnight)
 * Persists theme selection in localStorage without flash of unstyled content (FOUC).
 */
(function(window) {
  'use strict';

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (document.body) document.body.classList.add('theme-dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (document.body) document.body.classList.remove('theme-dark');
    }
    updateThemeUI(theme);
  }

  function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    
    // Update all theme toggle buttons and icons
    document.querySelectorAll('.kov-theme-icon').forEach(function(el) {
      el.className = isDark ? 'fas fa-sun text-warning kov-theme-icon' : 'fas fa-moon text-secondary kov-theme-icon';
    });
    
    const sidebarIcon = document.getElementById('themeSidebarIcon');
    const sidebarText = document.getElementById('themeSidebarText');
    if (sidebarIcon) {
      sidebarIcon.className = isDark ? 'fas fa-sun text-warning' : 'fas fa-moon';
    }
    if (sidebarText) {
      sidebarText.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
    }
  }

  // Global toggle function
  window.toggleKovTheme = function() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    try {
      localStorage.setItem('kov_theme', newTheme);
    } catch (e) {}
    applyTheme(newTheme);

    if (window.KovToast && typeof window.KovToast.show === 'function') {
      window.KovToast.show({
        type: 'info',
        title: 'Tema Diperbarui',
        message: newTheme === 'dark' ? 'Mode Cosmic Midnight (#1e0338) aktif' : 'Mode Alabaster Lilac (#fff9fe) aktif'
      });
    }
  };

  // Run initial sync on DOM load
  document.addEventListener('DOMContentLoaded', function() {
    let savedTheme = 'light';
    try {
      savedTheme = localStorage.getItem('kov_theme') || 'light';
    } catch (e) {}
    applyTheme(savedTheme);
  });
})(window);
