/**
 * KOV Management Portal - Dual Theme Engine (Light Framed-Sheet / Midnight Dark)
 * High-performance theme synchronization with zero FOUC and persistence.
 */
(function(window) {
  'use strict';

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    const root = document.documentElement;
    
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      if (document.body) document.body.classList.add('theme-dark');
    } else {
      root.removeAttribute('data-theme');
      if (document.body) document.body.classList.remove('theme-dark');
    }

    try {
      localStorage.setItem('kov_theme', theme);
    } catch (e) {}

    updateThemeUI(isDark);
  }

  function updateThemeUI(isDark) {
    // Update all theme toggle buttons and icons across topbar, sidebar, and right panel
    document.querySelectorAll('.kov-theme-icon').forEach(function(el) {
      el.className = isDark ? 'fas fa-sun text-warning kov-theme-icon' : 'fas fa-moon kov-theme-icon';
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

  // Global toggle function accessible by buttons
  window.toggleKovTheme = function() {
    const isCurrentDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isCurrentDark ? 'light' : 'dark';
    applyTheme(newTheme);

    if (window.KovToast && typeof window.KovToast.info === 'function') {
      window.KovToast.info(
        newTheme === 'dark' ? 'Mode Gelap (Midnight Slate) aktif' : 'Mode Terang (Framed-Sheet) aktif',
        'Tema Diperbarui'
      );
    }
  };

  // Immediate execution on script load to prevent FOUC
  try {
    const savedTheme = localStorage.getItem('kov_theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}

  // Sync icons once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      updateThemeUI(isDark);
    });
  } else {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    updateThemeUI(isDark);
  }
})(window);
