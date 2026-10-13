/**
 * Helper to format date strings/objects into DD/MM/YYYY format
 * @param {string|Date|number} dateVal 
 * @param {boolean} includeTime 
 * @returns {string}
 */
function formatDate(dateVal, includeTime = false) {
  if (!dateVal) return '-';

  const str = String(dateVal).trim();
  if (str === '' || str === '-' || str === 'null' || str === 'undefined') return '-';

  // If already in DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/.test(str)) {
    return includeTime ? str : str.split(' ')[0];
  }

  // Pure YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }

  // Handle standard Date object or SQLite timestamp / ISO string
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    // If it contains YYYY-MM-DD pattern
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return str;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  return `${day}/${month}/${year}`;
}

function formatDateTime(dateVal) {
  return formatDate(dateVal, true);
}

module.exports = {
  formatDate,
  formatDateTime
};
