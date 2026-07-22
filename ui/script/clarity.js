(() => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const root = /\/html\//.test(window.location.pathname) ? '../' : './';
  const screenNames = {
    'index.html': 'app_entry',
    's01-kata.html': 'before_you_begin',
    's02-my-practice.html': 'my_practice',
    's03-my-practice-daily.html': 'daily_kata',
    's04-my-practice-weekly.html': 'weekly_kata',
    's05-my-practice-monthly.html': 'monthly_kata',
    's06-my-journey.html': 'my_journey',
    's07-my-journey-my-flow.html': 'my_flow',
    's08-my-journey-my-reflections.html': 'my_reflections',
    's09-my-kata.html': 'my_kata',
    's10-my-profile.html': 'my_profile',
    's11-about.html': 'about',
    's12-change-password.html': 'change_pin',
    's13-enter-password.html': 'enter_pin',
    's14-forgot-password.html': 'forgot_pin'
  };
  const generalConsentKey = 'kata.analytics.generalConsent';
  const demographicConsentKey = 'kata.analytics.demographicConsent';
  let configPromise;
  let started = false;
  let closed = false;

  const hasGeneralConsent = () => localStorage.getItem(generalConsentKey) === 'granted';
  const hasDemographicConsent = () => localStorage.getItem(demographicConsentKey) === 'granted';
  const readProfile = () => { try { return JSON.parse(localStorage.getItem('kata.setup') || 'null'); } catch (_) { return null; } };
  const migrateExistingPreferences = () => {
    const profile = readProfile();
    if (!profile) return;
    if (localStorage.getItem(generalConsentKey) === null) localStorage.setItem(generalConsentKey, 'granted');
    if (localStorage.getItem(demographicConsentKey) === null) {
      localStorage.setItem(demographicConsentKey, profile.demographicSharing === false ? 'denied' : 'granted');
    }
  };
  const isAdult = (profile) => {
    const year = Number(profile?.birthYear);
    return Number.isInteger(year) && year >= 1900 && new Date().getFullYear() - year >= 18;
  };
  const config = () => {
    if (!configPromise) configPromise = fetch(`${root}data/clarity-config.json`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .catch(() => null);
    return configPromise;
  };
  const usable = (settings) => Boolean(settings?.enabled && /^[a-z0-9]+$/i.test(settings.projectId || '') && hasGeneralConsent() && isAdult(readProfile()));
  const call = (...args) => { if (typeof window.clarity === 'function') window.clarity(...args); };
  const sendDemographics = () => {
    const profile = readProfile();
    if (!started || !hasDemographicConsent() || !isAdult(profile)) return;
    call('set', 'gender', profile.gender);
    call('set', 'birth_month', profile.birthMonth);
    call('set', 'birth_year', String(profile.birthYear));
  };
  const start = async () => {
    const settings = await config();
    if (started) return true;
    if (!usable(settings)) return false;
    window.clarity = window.clarity || function clarity() { (window.clarity.q = window.clarity.q || []).push(arguments); };
    call('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(settings.projectId)}`;
    document.head.append(script);
    started = true;
    sendDemographics();
    return true;
  };
  const track = async (eventName) => {
    if (!/^[a-z0-9_]+$/.test(eventName)) return;
    if (await start()) call('event', eventName);
  };
  const updateConsent = (generalGranted, demographicGranted) => {
    const generalChanged = (localStorage.getItem(generalConsentKey) === 'granted') !== Boolean(generalGranted);
    const demographicsChanged = (localStorage.getItem(demographicConsentKey) === 'granted') !== Boolean(generalGranted && demographicGranted);
    localStorage.setItem(generalConsentKey, generalGranted ? 'granted' : 'denied');
    localStorage.setItem(demographicConsentKey, generalGranted && demographicGranted ? 'granted' : 'denied');
    if (!generalGranted) call('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
    else start().then(() => {
      sendDemographics();
      if (generalChanged) track('analytics_consent_changed');
      if (demographicsChanged) track('demographic_sharing_changed');
    });
  };

  window.KataAnalytics = { track, updateConsent, sendDemographics };
  migrateExistingPreferences();
  track(`screen_open_${screenNames[page] || 'unknown'}`);
  const clickEvents = {
    's03-my-practice-daily.html': 'practice_open_daily',
    's04-my-practice-weekly.html': 'practice_open_weekly',
    's05-my-practice-monthly.html': 'practice_open_monthly',
    's07-my-journey-my-flow.html': 'journey_open_flow',
    's08-my-journey-my-reflections.html': 'journey_open_reflections',
    's12-change-password.html': 'change_pin_opened',
    's14-forgot-password.html': 'forgot_pin_opened'
  };
  document.querySelectorAll('.profile-card, .reflection-timeline, .reflection-archive, .reflection-composer').forEach((element) => {
    element.setAttribute('data-clarity-mask', 'true');
  });
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (link.classList.contains('profile-edit-all')) track('profile_edit_opened');
    const destination = link.getAttribute('href').split('?')[0];
    if (clickEvents[destination]) track(clickEvents[destination]);
  });
  window.addEventListener('pagehide', () => {
    if (closed) return;
    closed = true;
    track(`screen_close_${screenNames[page] || 'unknown'}`);
  });
})();
