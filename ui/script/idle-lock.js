(() => {
  const page = window.location.pathname.split('/').pop();
  if (!/^s(?:0[2-9]|10|11)-/.test(page)) return;

  const autoLockMinutes = () => {
    const value = localStorage.getItem('kata.security.autoLockMinutes') || '';
    return /^[1-5]$/.test(value) ? Number(value) : 5;
  };
  const timeoutMs = () => autoLockMinutes() * 60 * 1000;
  const next = `${page}${window.location.search}`;
  const signIn = `s13-enter-password.html?next=${encodeURIComponent(next)}`;
  let timer;
  let lastRefresh = 0;
  let locking = false;
  const expiresAt = () => Number(sessionStorage.getItem('kata.session.expiresAt'));
  const clearSession = () => {
    sessionStorage.removeItem('kata.session.unlocked');
    sessionStorage.removeItem('kata.session.expiresAt');
  };
  const lock = () => {
    if (locking) return;
    locking = true;
    clearSession();
    window.location.replace(signIn);
  };
  const schedule = () => {
    window.clearTimeout(timer);
    const remaining = expiresAt() - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) { lock(); return; }
    timer = window.setTimeout(lock, remaining);
  };
  const refresh = () => {
    if (document.hidden || locking) return;
    const now = Date.now();
    const remaining = expiresAt() - now;
    if (remaining <= 0 || !Number.isFinite(remaining)) { lock(); return; }
    if (now - lastRefresh >= 1000 || remaining < 2000) {
      sessionStorage.setItem('kata.session.expiresAt', String(now + timeoutMs()));
      lastRefresh = now;
    }
    schedule();
  };
  const checkVisibility = () => {
    if (document.hidden) { schedule(); return; }
    if (expiresAt() <= Date.now()) { lock(); return; }
    refresh();
  };

  ['pointerdown', 'keydown', 'touchstart', 'scroll', 'focus'].forEach((eventName) => {
    window.addEventListener(eventName, refresh, { passive: true });
  });
  document.addEventListener('visibilitychange', checkVisibility);
  window.addEventListener('pageshow', checkVisibility);
  window.addEventListener('kata:autolockchange', schedule);
  schedule();
})();
