// notify.js - toast notifications system

const Notify = (function() {
  const container = document.getElementById('notifications-container');
  // MAX_TOASTS: a burst of notifications drops the oldest toast instead
  // of stacking off-screen without bound.
  const MAX_TOASTS = 4;

  // show: pop a toast notification. message is inserted as TEXT into
  // the toast body (never HTML — callers pass file names, package names
  // and other user-influenced strings); type picks the icon
  // ('info' | 'success' | 'error'). slides in on the next animation
  // frame, auto dismisses after 3s.
  function show(message, type = 'info') {
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    // role="status" announces info/success toasts politely without
    // stealing keyboard focus; errors use role="alert" so screen
    // readers announce them immediately instead of queueing them
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    let iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

    if (type === 'success') {
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }

    // The icon is a static literal per type (safe to inline), but the
    // message is user-influenced (file names, package names, app names
    // from other modules) — it must go in as text, never HTML, or a
    // crafted name like '"><img src=x onerror=...>' would execute here.
    const iconWrap = document.createElement('div');
    iconWrap.className = 'toast-icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.innerHTML = iconSvg;
    toast.appendChild(iconWrap);

    const textEl = document.createElement('div');
    textEl.className = 'toast-text';
    textEl.textContent = message;
    toast.appendChild(textEl);

    container.appendChild(toast);
    while (container.children.length > MAX_TOASTS) {
      container.removeChild(container.children[0]);
    }

    // Sound is a separate module (sound.js loads after this one): if it
    // failed to load, an unguarded call here threw and killed the toast
    // that was being shown — a silent toast beats a broken one.
    if (window.Sound && typeof Sound.notify === 'function') Sound.notify();

    // trigger slide in on next frame
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // auto dismiss after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 3000);
  }

  return {
    show
  };
})();
