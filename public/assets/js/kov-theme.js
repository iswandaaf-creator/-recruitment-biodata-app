(function(window) {
  'use strict';
  try {
    if (localStorage.getItem('kov_theme') === 'dark') {
      localStorage.setItem('kov_theme', 'light');
    }
    document.documentElement.removeAttribute('data-theme');
  } catch (e) {}

  window.toggleKovTheme = function() {
    var root = document.documentElement;
    var isAlt = root.getAttribute('data-theme') === 'pastel-sage';
    if (isAlt) {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', 'pastel-sage');
    }
    var sidebarText = document.getElementById('themeSidebarText');
    if (sidebarText) {
      sidebarText.textContent = isAlt ? 'Nuansa Pastel' : 'Nuansa Linen';
    }
  };
})(window);
