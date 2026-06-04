function showSearchError(message) {
  const errorBox = document.getElementById('search-error');

  if (!errorBox) return;

  errorBox.textContent = message;
  errorBox.classList.add('visible');
}

function clearSearchError() {
  const errorBox = document.getElementById('search-error');

  if (!errorBox) return;

  errorBox.textContent = '';
  errorBox.classList.remove('visible');
}  