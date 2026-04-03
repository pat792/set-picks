const TOAST_Z = 99999;
const TOAST_DURATION_MS = 4500;

function mountToast(message, variant) {
  if (typeof document === 'undefined') return;

  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;

  const isError = variant === 'error';
  Object.assign(el.style, {
    position: 'fixed',
    left: '50%',
    bottom: '1.5rem',
    transform: 'translateX(-50%)',
    zIndex: String(TOAST_Z),
    maxWidth: 'min(90vw, 24rem)',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '700',
    boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
    border: isError ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(52,211,153,0.5)',
    background: isError ? 'rgba(127,29,29,0.95)' : 'rgba(6,78,59,0.95)',
    color: isError ? '#fecaca' : '#a7f3d0',
  });

  document.body.appendChild(el);
  window.setTimeout(() => {
    el.remove();
  }, TOAST_DURATION_MS);
}

export function showSuccessToast(message) {
  mountToast(message, 'success');
}

export function showErrorToast(message) {
  mountToast(message, 'error');
}
