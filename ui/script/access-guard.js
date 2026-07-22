(() => {
  const page = window.location.pathname.split('/').pop();
  const protectedPage = /^s(?:0[2-9]|10|11)-/.test(page);
  const setupPage = page === 's01-kata.html';
  if (!protectedPage && !setupPage) return;

  const next = `${page}${window.location.search}`;
  const signIn = `s13-enter-password.html?next=${encodeURIComponent(next)}`;
  let profile = null;
  try { profile = JSON.parse(localStorage.getItem('kata.setup') || 'null'); } catch (_) { profile = null; }
  const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
  const validProfile = profile && hasText(profile.name) && hasText(profile.workType) && hasText(profile.gender) && hasText(profile.birthMonth) && /^\d{4}$/.test(String(profile.birthYear || '')) && Number(profile.birthYear) >= 1900 && Number(profile.birthYear) <= new Date().getFullYear() && hasText(profile.dailyKataTime) && hasText(profile.commitment) && (profile.dailyKataTime !== 'Other' || hasText(profile.otherTime));
  const expiresAt = Number(sessionStorage.getItem('kata.session.expiresAt'));
  const unlocked = sessionStorage.getItem('kata.session.unlocked') === 'true' && Number.isFinite(expiresAt) && expiresAt > Date.now();

  const configuredPin = localStorage.getItem('kata.security.pin');

  if (setupPage && validProfile && configuredPin && !unlocked) {
    sessionStorage.removeItem('kata.session.unlocked');
    sessionStorage.removeItem('kata.session.expiresAt');
    window.location.replace('s13-enter-password.html');
  } else if (!protectedPage) {
    return;
  } else if (!validProfile) window.location.replace('s01-kata.html');
  else if (!configuredPin) window.location.replace('s12-change-password.html?mode=initial');
  else if (!unlocked) {
    sessionStorage.removeItem('kata.session.unlocked');
    sessionStorage.removeItem('kata.session.expiresAt');
    window.location.replace(signIn);
  }
})();
