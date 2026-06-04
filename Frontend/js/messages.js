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

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast-message');

  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('visible', 'error');

  if (type === 'error') {
    toast.classList.add('error');
  }

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 2600);
}