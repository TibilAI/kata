(() => {
  if (!document.querySelector('[data-app-entry]')) return;
  let profile = null;
  try { profile = JSON.parse(localStorage.getItem('kata.setup') || 'null'); } catch (_) { profile = null; }
  const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
  const validProfile = profile && hasText(profile.name) && hasText(profile.workType) && hasText(profile.gender) && hasText(profile.birthMonth) && /^\d{4}$/.test(String(profile.birthYear || '')) && Number(profile.birthYear) >= 1900 && Number(profile.birthYear) <= new Date().getFullYear() && hasText(profile.dailyKataTime) && hasText(profile.commitment) && (profile.dailyKataTime !== 'Other' || hasText(profile.otherTime));
  if (!validProfile) {
    window.location.replace('html/s01-kata.html');
    return;
  }
  if (!localStorage.getItem('kata.security.pin')) {
    window.location.replace('html/s12-change-password.html?mode=initial');
    return;
  }
  window.location.replace('html/s13-enter-password.html');
})();

(() => {
  const form = document.querySelector('#kata-setup-form');
  const latestCompletedAt = (type) => {
    const prefix = `kata.${type}.`;
    let latest = null;
    Object.keys(localStorage).filter((key) => key.startsWith(prefix)).forEach((key) => {
      try {
        const record = JSON.parse(localStorage.getItem(key));
        if (!record?.completed) return;
        const timestamp = Date.parse(record.completedAt || record.updatedAt || '');
        if (!Number.isNaN(timestamp) && (latest === null || timestamp > latest)) latest = timestamp;
      } catch (_) {}
    });
    return latest;
  };

  document.querySelectorAll('[data-practice-status]').forEach((element) => {
    const type = element.dataset.practiceStatus;
    const timestamp = latestCompletedAt(type);
    if (timestamp === null) {
      element.textContent = 'No data available';
      return;
    }
    const elapsedDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
    element.textContent = elapsedDays <= 0 ? 'Today' : `${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`;
  });

  if (!form) return;

  const storageKey = 'kata.setup';
  const message = document.querySelector('#form-message');
  const otherTime = document.querySelector('#other-time');
  const birthYear = document.querySelector('#birth-year');
  birthYear.max = String(new Date().getFullYear());
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  const firstTimeSetup = !saved;
  const parameters = new URLSearchParams(window.location.search);
  const profileMode = parameters.get('mode') === 'profile';

  if (profileMode) {
    document.querySelector('[data-profile-title]').textContent = 'Update Your Profile';
    document.querySelector('[data-profile-copy]').innerHTML = 'Keep your KATA practice aligned<br>with what works for you.';
    document.querySelector('[data-profile-submit-label]').textContent = 'Save Changes';
    const back = document.querySelector('.profile-back');
    back.hidden = false;
    const section = parameters.get('section');
    if (section) requestAnimationFrame(() => document.querySelector(`#section-${section}`)?.scrollIntoView({ block: 'center' }));
  }

  if (saved) {
    form.elements.name.value = saved.name || '';
    form.elements.workType.value = saved.workType || '';
    form.elements.gender.value = saved.gender || '';
    form.elements.birthMonth.value = saved.birthMonth || '';
    birthYear.value = saved.birthYear || '';
    const dailyChoice = form.querySelector(`[name="dailyKataTime"][value="${CSS.escape(saved.dailyKataTime || '')}"]`);
    if (dailyChoice) dailyChoice.checked = true;
    otherTime.value = saved.otherTime || '';
    const commitmentChoice = form.querySelector(`[name="commitment"][value="${CSS.escape(saved.commitment || '')}"]`);
    if (commitmentChoice) commitmentChoice.checked = true;
  }

  otherTime.addEventListener('focus', () => {
    form.querySelector('[name="dailyKataTime"][value="Other"]').checked = true;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.textContent = '';
    const data = Object.fromEntries(new FormData(form));

    const currentYear = new Date().getFullYear();
    const validBirthYear = /^\d{4}$/.test(String(data.birthYear || '')) && Number(data.birthYear) >= 1900 && Number(data.birthYear) <= currentYear;
    if (!data.name?.trim() || !data.workType?.trim() || !data.gender || !data.birthMonth || !validBirthYear || !data.dailyKataTime || !data.commitment) {
      message.textContent = 'Please complete each section to continue.';
      return;
    }
    if (data.dailyKataTime === 'Other' && !data.otherTime?.trim()) {
      message.textContent = 'Please tell us when you plan to do your Daily Kata.';
      otherTime.focus();
      return;
    }

    data.name = data.name.trim();
    data.workType = data.workType.trim();
    data.otherTime = (data.otherTime || '').trim();
    data.birthYear = String(data.birthYear);
    data.startedAt = saved?.startedAt || saved?.updatedAt || new Date().toISOString();
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify(data));
    message.style.color = '#357047';
    message.textContent = profileMode ? 'Your profile has been saved.' : 'Your KATA practice has been saved.';
    window.setTimeout(() => {
      if (profileMode) window.location.href = 's10-my-profile.html';
      else window.location.href = firstTimeSetup ? 's12-change-password.html?mode=initial' : 's02-my-practice.html';
    }, 250);
  });

})();

(() => {
  const form = document.querySelector('[data-pin-form]');
  if (!form) return;
  const pinMode = new URLSearchParams(window.location.search).get('mode');
  const resetMode = pinMode === 'reset';
  const initialMode = pinMode === 'initial';
  const profile = (() => { try { return JSON.parse(localStorage.getItem('kata.setup') || 'null'); } catch (_) { return null; } })();
  const profileIsComplete = profile && typeof profile.name === 'string' && profile.name.trim() && typeof profile.workType === 'string' && profile.workType.trim() && typeof profile.gender === 'string' && profile.gender.trim() && typeof profile.birthMonth === 'string' && profile.birthMonth.trim() && /^\d{4}$/.test(String(profile.birthYear || '')) && Number(profile.birthYear) >= 1900 && Number(profile.birthYear) <= new Date().getFullYear() && typeof profile.dailyKataTime === 'string' && profile.dailyKataTime.trim() && typeof profile.commitment === 'string' && profile.commitment.trim() && (profile.dailyKataTime !== 'Other' || (typeof profile.otherTime === 'string' && profile.otherTime.trim()));
  if (initialMode && !profileIsComplete) {
    window.location.replace('s01-kata.html');
    return;
  }
  if (resetMode && sessionStorage.getItem('kata.security.resetApproved') !== 'true') {
    window.location.replace('s14-forgot-password.html');
    return;
  }
  if (resetMode) {
    document.querySelector('[data-pin-title]').textContent = 'Change PIN';
    document.querySelector('[data-pin-subtitle]').textContent = 'Choose a new PIN for your KATA app';
    document.querySelector('[data-pin-back]').href = 's13-enter-password.html';
    document.querySelector('[data-pin-back]').setAttribute('aria-label', 'Back to sign in');
    document.querySelector('[data-pin-cancel]').href = 's13-enter-password.html';
    document.querySelector('[data-pin-reset-progress]').hidden = false;
  }
  if (initialMode) {
    document.querySelector('[data-pin-title]').textContent = 'Change Password';
    document.querySelector('[data-pin-subtitle]').textContent = 'Create a PIN to secure your KATA app';
    document.querySelector('.pin-introduction p').innerHTML = 'Set a new 4-digit PIN to access your KATA app.<br>You’ll enter it each time you return.';
    document.querySelector('[data-pin-back]').href = 's01-kata.html?mode=profile';
    document.querySelector('[data-pin-back]').setAttribute('aria-label', 'Back to profile setup');
    document.querySelector('[data-pin-cancel]').href = 's01-kata.html?mode=profile';
  }
  const groups = [...form.querySelectorAll('[data-pin-group]')];
  const inputs = groups.flatMap((group) => [...group.querySelectorAll('[data-pin-input]')]);
  const message = form.querySelector('[data-pin-message]');
  const submit = form.querySelector('[data-pin-submit]');
  const pinFor = (group) => [...group.querySelectorAll('[data-pin-input]')].map((input) => input.value).join('');
  const resetErrors = () => inputs.forEach((input) => input.removeAttribute('aria-invalid'));
  const validate = () => {
    const newPin = pinFor(groups[0]);
    const confirmation = pinFor(groups[1]);
    const complete = newPin.length === 4 && confirmation.length === 4;
    submit.disabled = !complete || newPin !== confirmation;
    if (message.classList.contains('success')) return;
    message.textContent = complete && newPin !== confirmation ? 'The PINs do not match. Please try again.' : '';
  };
  const fillFrom = (start, value) => {
    const digits = value.replace(/\D/g, '').slice(0, inputs.length - start).split('');
    digits.forEach((digit, index) => { inputs[start + index].value = digit; });
    const next = inputs[Math.min(start + digits.length, inputs.length - 1)];
    next?.focus();
    validate();
  };
  inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      const digits = input.value.replace(/\D/g, '');
      if (digits.length > 1) { fillFrom(index, digits); return; }
      input.value = digits;
      resetErrors(); message.classList.remove('success');
      if (digits && inputs[index + 1]) inputs[index + 1].focus();
      validate();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !input.value && inputs[index - 1]) { inputs[index - 1].focus(); }
      if (event.key === 'ArrowLeft' && inputs[index - 1]) { event.preventDefault(); inputs[index - 1].focus(); }
      if (event.key === 'ArrowRight' && inputs[index + 1]) { event.preventDefault(); inputs[index + 1].focus(); }
    });
    input.addEventListener('paste', (event) => {
      event.preventDefault();
      fillFrom(index, event.clipboardData.getData('text'));
    });
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const newPin = pinFor(groups[0]);
    const confirmation = pinFor(groups[1]);
    resetErrors(); message.classList.remove('success');
    if (!/^\d{4}$/.test(newPin)) {
      message.textContent = 'Enter a four-digit PIN using numbers only.';
      groups[0].querySelector('[data-pin-input]').focus();
      return;
    }
    if (newPin !== confirmation) {
      message.textContent = 'The PINs do not match. Please try again.';
      [...groups[1].querySelectorAll('[data-pin-input]')].forEach((input) => input.setAttribute('aria-invalid', 'true'));
      groups[1].querySelector('[data-pin-input]').focus();
      return;
    }
    localStorage.setItem('kata.security.pin', newPin);
    sessionStorage.removeItem('kata.session.unlocked');
    sessionStorage.removeItem('kata.session.expiresAt');
    message.textContent = 'Your PIN has been updated.';
    message.classList.add('success');
    submit.disabled = true;
    if (resetMode) sessionStorage.removeItem('kata.security.resetApproved');
    window.setTimeout(() => {
      if (resetMode) window.location.href = 's14-forgot-password.html?step=complete';
      else if (initialMode) window.location.href = 's13-enter-password.html';
      else window.location.href = 's10-my-profile.html';
    }, 500);
  });
})();

(() => {
  const form = document.querySelector('[data-enter-pin-form]');
  if (!form) return;
  const profile = (() => { try { return JSON.parse(localStorage.getItem('kata.setup') || 'null'); } catch (_) { return null; } })();
  const profileIsComplete = profile && typeof profile.name === 'string' && profile.name.trim() && typeof profile.workType === 'string' && profile.workType.trim() && typeof profile.gender === 'string' && profile.gender.trim() && typeof profile.birthMonth === 'string' && profile.birthMonth.trim() && /^\d{4}$/.test(String(profile.birthYear || '')) && Number(profile.birthYear) >= 1900 && Number(profile.birthYear) <= new Date().getFullYear() && typeof profile.dailyKataTime === 'string' && profile.dailyKataTime.trim() && typeof profile.commitment === 'string' && profile.commitment.trim() && (profile.dailyKataTime !== 'Other' || (typeof profile.otherTime === 'string' && profile.otherTime.trim()));
  if (!profileIsComplete) {
    window.location.replace('s01-kata.html');
    return;
  }
  if (!localStorage.getItem('kata.security.pin')) {
    window.location.replace('s12-change-password.html?mode=initial');
    return;
  }
  const inputs = [...form.querySelectorAll('[data-enter-pin-input]')];
  const message = form.querySelector('[data-enter-pin-message]');
  const enteredPin = () => inputs.map((input) => input.value).join('');
  const clear = () => inputs.forEach((input) => { input.value = ''; });
  const submitWhenReady = () => {
    if (enteredPin().length !== 4) return;
    const savedPin = localStorage.getItem('kata.security.pin');
    if (enteredPin() !== savedPin) {
      message.textContent = 'That PIN is not correct. Please try again.';
      clear();
      inputs[0].focus();
      return;
    }
    const autoLockRaw = localStorage.getItem('kata.security.autoLockMinutes') || '';
    const autoLockMinutes = /^[1-5]$/.test(autoLockRaw) ? Number(autoLockRaw) : 5;
    sessionStorage.setItem('kata.session.unlocked', 'true');
    sessionStorage.setItem('kata.session.expiresAt', String(Date.now() + (autoLockMinutes * 60 * 1000)));
    message.textContent = '';
    const requested = new URLSearchParams(window.location.search).get('next');
    const allowedNext = /^(?:s0[2-9]|s10|s11)-[a-z0-9-]+\.html(?:\?[^#]*)?$/i.test(requested || '') ? requested : null;
    window.location.href = allowedNext || 's02-my-practice.html';
  };
  const fillFrom = (start, value) => {
    const digits = value.replace(/\D/g, '').slice(0, inputs.length - start).split('');
    digits.forEach((digit, index) => { inputs[start + index].value = digit; });
    const next = inputs[Math.min(start + digits.length, inputs.length - 1)];
    next?.focus();
    submitWhenReady();
  };
  inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      const digits = input.value.replace(/\D/g, '');
      if (digits.length > 1) { fillFrom(index, digits); return; }
      input.value = digits;
      message.textContent = '';
      if (digits && inputs[index + 1]) inputs[index + 1].focus();
      submitWhenReady();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !input.value && inputs[index - 1]) inputs[index - 1].focus();
      if (event.key === 'ArrowLeft' && inputs[index - 1]) { event.preventDefault(); inputs[index - 1].focus(); }
      if (event.key === 'ArrowRight' && inputs[index + 1]) { event.preventDefault(); inputs[index + 1].focus(); }
    });
    input.addEventListener('paste', (event) => { event.preventDefault(); fillFrom(index, event.clipboardData.getData('text')); });
  });
})();

(() => {
  const form = document.querySelector('[data-forgot-pin-form]');
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  const progress = document.querySelector('[data-reset-progress]');
  const complete = document.querySelector('[data-reset-complete]');
  const subtitle = document.querySelector('[data-reset-subtitle]');
  if (params.get('step') === 'complete') {
    form.hidden = true;
    complete.hidden = false;
    subtitle.textContent = 'Your PIN reset is complete';
    progress.querySelectorAll('li').forEach((item, index) => item.classList.toggle('active', index === 2));
    return;
  }
  const message = form.querySelector('[data-forgot-pin-message]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const saved = JSON.parse(localStorage.getItem('kata.setup') || 'null');
    const supplied = Object.fromEntries(new FormData(form));
    const currentYear = new Date().getFullYear();
    if (!saved) { message.textContent = 'No profile details are available to verify.'; return; }
    const savedDemographicsPresent = saved.gender && saved.birthMonth && /^\d{4}$/.test(String(saved.birthYear || ''));
    if (!savedDemographicsPresent) { message.textContent = 'Add your gender and birth details in My Profile before resetting your PIN.'; return; }
    const validBirthYear = /^\d{4}$/.test(String(supplied.birthYear || '')) && Number(supplied.birthYear) >= 1900 && Number(supplied.birthYear) <= currentYear;
    const allProvided = supplied.gender && supplied.birthMonth && validBirthYear;
    if (!allProvided) { message.textContent = 'Please complete each profile detail to continue.'; return; }
    const matches = supplied.gender === saved.gender && supplied.birthMonth === saved.birthMonth && String(supplied.birthYear) === String(saved.birthYear);
    if (!matches) { message.textContent = 'We could not verify those details. Please try again.'; return; }
    sessionStorage.setItem('kata.security.resetApproved', 'true');
    window.location.href = 's12-change-password.html?mode=reset';
  });
})();

(() => {
  const about = document.querySelector('.about-screen');
  if (!about) return;
  const formatReleaseDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short'
    }).format(date);
  };
  const render = (info) => {
    const values = { description: info.description, product: info.product, version: info.version, release: formatReleaseDate(info.releaseDate), builder: info.builtBy };
    Object.entries(values).forEach(([key, value]) => { const element = document.querySelector(`[data-about-${key}]`); if (element && value) element.textContent = value; });
  };
  fetch('../data/app-info.json').then((response) => response.ok ? response.json() : Promise.reject()).then(render).catch(() => {});
})();

(() => {
  const triggers = document.querySelectorAll('[data-bottom-more]');
  if (!triggers.length) return;
  const menus = [];
  const closeMenus = (returnFocus = false) => menus.forEach(({ trigger, menu }) => {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  });
  triggers.forEach((trigger, index) => {
    const menu = document.createElement('div');
    const menuId = `more-menu-${index}`;
    menu.id = menuId; menu.className = 'more-popup'; menu.hidden = true; menu.setAttribute('role', 'menu');
    menu.innerHTML = '<a href="s10-my-profile.html" role="menuitem">My Profile</a><a href="s11-about.html" role="menuitem">About</a><button type="button" role="menuitem" data-lock-app><span class="more-lock-icon" aria-hidden="true"></span>Lock app</button>';
    document.body.append(menu);
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-controls', menuId);
    trigger.setAttribute('aria-expanded', 'false');
    menus.push({ trigger, menu });
    trigger.addEventListener('click', () => {
      const wasOpen = !menu.hidden;
      closeMenus(false);
      if (wasOpen) return;
      menu.hidden = false;
      const bounds = trigger.getBoundingClientRect();
      menu.style.top = `${Math.max(8, bounds.top - menu.offsetHeight - 8)}px`;
      menu.style.left = `${Math.max(8, bounds.right - menu.offsetWidth)}px`;
      trigger.setAttribute('aria-expanded', 'true');
      menu.querySelector('a').focus();
    });
    menu.querySelector('[data-lock-app]').addEventListener('click', () => {
      const page = window.location.pathname.split('/').pop();
      const next = `${page}${window.location.search}`;
      sessionStorage.removeItem('kata.session.unlocked');
      sessionStorage.removeItem('kata.session.expiresAt');
      closeMenus(false);
      window.location.replace(`s13-enter-password.html?next=${encodeURIComponent(next)}`);
    });
  });
  document.addEventListener('pointerdown', (event) => {
    if (!menus.some(({ trigger, menu }) => trigger.contains(event.target) || menu.contains(event.target))) closeMenus(false);
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenus(true); });
})();

(() => {
  const screen = document.querySelector('.profile-screen');
  if (!screen) return;
  const profile = JSON.parse(localStorage.getItem('kata.setup') || 'null') || {};
  const set = (selector, value) => { const element = document.querySelector(selector); if (element) element.textContent = value || 'Not set'; };
  set('[data-profile-name]', profile.name);
  set('[data-profile-work]', profile.workType);
  set('[data-profile-gender]', profile.gender);
  set('[data-profile-birth-month]', profile.birthMonth);
  set('[data-profile-birth-year]', profile.birthYear);
  const timing = profile.dailyKataTime === 'Other' ? (profile.otherTime ? `Other: ${profile.otherTime}` : 'Other') : profile.dailyKataTime;
  set('[data-profile-timing]', timing);
  set('[data-profile-commitment]', profile.commitment);
})();

(() => {
  const input = document.querySelector('#auto-lock-minutes');
  if (!input) return;
  const message = document.querySelector('[data-auto-lock-message]');
  const key = 'kata.security.autoLockMinutes';
  const validMinutes = (value) => /^[1-5]$/.test(String(value).trim()) ? Number(value) : null;
  let current = validMinutes(localStorage.getItem(key)) || 5;
  input.value = current;
  const save = () => {
    const next = validMinutes(input.value);
    message.classList.remove('success');
    input.removeAttribute('aria-invalid');
    if (!next) {
      input.value = current;
      input.setAttribute('aria-invalid', 'true');
      message.textContent = 'Enter a whole number from 1 to 5.';
      return;
    }
    current = next;
    localStorage.setItem(key, String(next));
    if (sessionStorage.getItem('kata.session.unlocked') === 'true') {
      sessionStorage.setItem('kata.session.expiresAt', String(Date.now() + (next * 60 * 1000)));
      window.dispatchEvent(new CustomEvent('kata:autolockchange'));
    }
    message.textContent = `Auto-lock set to ${next} minute${next === 1 ? '' : 's'}.`;
    message.classList.add('success');
  };
  input.addEventListener('change', save);
  input.addEventListener('blur', save);
  input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); message.textContent = ''; message.classList.remove('success'); });
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); input.blur(); } });
})();

(() => {
  const fields = document.querySelectorAll('.reflection-form textarea');
  if (!fields.length) return;

  const resize = (field) => {
    field.style.height = 'auto';
    field.style.height = `${Math.max(43, field.scrollHeight)}px`;
  };
  fields.forEach((field) => field.addEventListener('input', () => resize(field)));
  requestAnimationFrame(() => fields.forEach(resize));
})();

(() => {
  const timeline = document.querySelector('[data-reflection-timeline]');
  if (!timeline) return;

  const archive = document.querySelector('[data-reflection-archive]');
  const typeSelect = document.querySelector('[data-entry-type]');
  const searchInput = document.querySelector('[data-entry-search]');
  const searchToggle = document.querySelector('[data-search-toggle]');
  const filterToggle = document.querySelector('[data-filter-toggle]');
  const addButton = document.querySelector('[data-add-reflection]');
  const composer = document.querySelector('[data-reflection-composer]');
  const composerForm = document.querySelector('[data-reflection-form]');
  const composerTitle = document.querySelector('[data-composer-title]');
  const composerDate = document.querySelector('[data-composer-date]');
  const composerSave = document.querySelector('[data-composer-save]');
  const composerClose = document.querySelector('[data-composer-close]');
  const toolbar = document.querySelector('.reflections-toolbar');
  const reflectionKey = 'kata.reflections';
  let showArchive = true;
  let editingReflectionId = null;
  let composerTrigger = null;

  const safeParse = (value, fallback) => { try { return JSON.parse(value || ''); } catch { return fallback; } };
  const stored = (prefix) => Object.keys(localStorage).filter((key) => key.startsWith(prefix)).map((key) => safeParse(localStorage.getItem(key), null)).filter((entry) => entry?.completed);
  const dateFor = (date, updatedAt) => {
    const time = updatedAt ? new Date(updatedAt) : new Date();
    if (!date) return time;
    const selected = new Date(`${date}T12:00:00`);
    selected.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return selected;
  };
  const firstAnswer = (...values) => values.find((value) => String(value || '').trim()) || 'A completed practice to reflect on.';
  const formatType = { reflection: 'Reflection', daily: 'Daily Loop', weekly: 'Weekly Reset', monthly: 'Monthly Challenge' };
  const artFor = { reflection: '../style/icons/art-reflection-quill.png', daily: '../style/icons/art-enso.png', weekly: '../style/icons/art-bonsai.png', monthly: '../style/icons/art-archer.png' };
  const colorFor = { reflection: '#695181', daily: '#be522f', weekly: '#507838', monthly: '#695181' };
  const allEntries = () => {
    const personal = safeParse(localStorage.getItem(reflectionKey), []).map((entry) => ({ ...entry, type: 'reflection', date: new Date(entry.createdAt) }));
    const daily = stored('kata.daily.').map((entry) => ({ type: 'daily', period: entry.date, date: dateFor(entry.date, entry.updatedAt), content: firstAnswer(entry.decision, entry.problem, entry.impact, entry.tomorrow) }));
    const weekly = stored('kata.weekly.').map((entry) => ({ type: 'weekly', period: entry.week, date: new Date(entry.updatedAt), content: firstAnswer(entry.specificAction, entry.realValue, entry.patterns, entry.nextTask) }));
    const monthly = stored('kata.monthly.').map((entry) => ({ type: 'monthly', period: entry.month, date: new Date(entry.updatedAt), content: firstAnswer(entry.problemSolving, entry.actualWork, entry.impact, entry.nextImprovement) }));
    return [...personal, ...daily, ...weekly, ...monthly].filter((entry) => entry.date instanceof Date && !Number.isNaN(entry.date.getTime())).sort((a, b) => b.date - a.date);
  };
  const sameDay = (left, right) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  const entryNode = (entry) => {
    const isPractice = entry.type !== 'reflection';
    const button = document.createElement(isPractice ? 'a' : 'button');
    if (isPractice) {
      const pages = { daily: 's03-my-practice-daily.html', weekly: 's04-my-practice-weekly.html', monthly: 's05-my-practice-monthly.html' };
      const parameters = new URLSearchParams({ from: 'reflections' });
      parameters.set(entry.type === 'daily' ? 'date' : entry.type === 'weekly' ? 'week' : 'month', entry.period);
      button.href = `${pages[entry.type]}?${parameters}`;
      button.setAttribute('aria-label', `Open ${formatType[entry.type]} entry`);
    } else button.type = 'button';
    button.className = 'reflection-entry'; button.style.setProperty('--entry-color', colorFor[entry.type]);
    const date = document.createElement('span'); date.className = 'entry-date';
    const day = document.createElement('strong'); day.textContent = entry.date.getDate();
    const month = document.createElement('span'); month.textContent = entry.date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const weekday = document.createElement('span'); weekday.textContent = entry.date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
    date.append(day, month, weekday);
    const art = document.createElement('img'); art.className = 'entry-art'; art.src = artFor[entry.type]; art.alt = '';
    const copy = document.createElement('span'); copy.className = 'entry-copy';
    const meta = document.createElement('span'); meta.className = 'entry-meta';
    const type = document.createElement('strong'); type.textContent = formatType[entry.type];
    const time = document.createElement('span'); time.textContent = entry.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const preview = document.createElement('p'); preview.className = 'entry-preview'; preview.textContent = entry.content;
    meta.append(type, time); copy.append(meta, preview);
    const chevron = document.createElement('img'); chevron.className = 'entry-chevron'; chevron.src = '../style/icons/icon-entry-chevron.png'; chevron.alt = '';
    button.append(date, art, copy, chevron);
    if (!isPractice) button.addEventListener('click', () => openComposer(entry, button));
    return button;
  };
  const emptyNode = (text) => {
    const empty = document.createElement('p'); empty.className = 'reflection-empty';
    const art = document.createElement('img'); art.src = '../style/icons/art-reflection-quill.png'; art.alt = '';
    empty.append(art, document.createTextNode(text)); return empty;
  };
  const filteredEntries = () => {
    const type = typeSelect.value;
    const query = searchInput.value.trim().toLocaleLowerCase();
    return allEntries().filter((entry) => (type === 'all' || entry.type === type) && (!query || entry.content.toLocaleLowerCase().includes(query) || formatType[entry.type].toLocaleLowerCase().includes(query)));
  };
  const render = () => {
    const entries = filteredEntries(); const today = new Date();
    const todayEntries = entries.filter((entry) => sameDay(entry.date, today));
    const olderEntries = entries.filter((entry) => !sameDay(entry.date, today));
    timeline.replaceChildren(); archive.replaceChildren();
    const heading = document.createElement('h2'); heading.className = 'timeline-heading'; heading.textContent = 'Today'; timeline.append(heading);
    if (todayEntries.length) todayEntries.forEach((entry) => timeline.append(entryNode(entry))); else timeline.append(emptyNode(entries.length ? 'No entries today. Browse your archive below.' : 'Your completed practices and reflections will appear here.'));
    const groups = new Map();
    olderEntries.forEach((entry) => {
      const key = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups.has(key)) groups.set(key, []); groups.get(key).push(entry);
    });
    [...groups.entries()].forEach(([key, group]) => {
      const details = document.createElement('details'); details.className = 'archive-row';
      const summary = document.createElement('summary');
      const month = new Date(`${key}-01T12:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const count = document.createElement('span'); count.className = 'archive-count'; count.textContent = `${group.length} reflection${group.length === 1 ? '' : 's'}`;
      summary.append(document.createTextNode(month), count); details.append(summary);
      const entriesWrap = document.createElement('div'); entriesWrap.className = 'archive-entries'; group.forEach((entry) => entriesWrap.append(entryNode(entry))); details.append(entriesWrap); archive.append(details);
    });
    archive.hidden = !showArchive || !olderEntries.length;
  };
  const closeSearch = (returnFocus = true) => {
    if (searchInput.hidden) return;
    searchInput.hidden = true;
    searchInput.value = '';
    toolbar.classList.remove('search-open');
    render();
    if (returnFocus) searchToggle.focus();
  };
  const openSearch = () => {
    searchInput.hidden = false;
    toolbar.classList.add('search-open');
    searchInput.focus();
  };
  searchToggle.addEventListener('click', () => { if (searchInput.hidden) openSearch(); else closeSearch(); });
  searchInput.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSearch(); });
  document.addEventListener('pointerdown', (event) => {
    if (!searchInput.hidden && !searchInput.contains(event.target) && !searchToggle.contains(event.target)) closeSearch(false);
  });
  filterToggle.addEventListener('click', () => { showArchive = !showArchive; filterToggle.setAttribute('aria-pressed', String(showArchive)); render(); });
  typeSelect.addEventListener('change', render); searchInput.addEventListener('input', render);
  const openComposer = (entry = null, trigger = null) => {
    editingReflectionId = entry?.id || null;
    composerTrigger = trigger;
    composerTitle.textContent = entry ? 'Reflection' : 'New Reflection';
    composerSave.textContent = entry ? 'Save Changes' : 'Save Reflection';
    composerForm.elements.content.value = entry?.content || '';
    if (entry?.createdAt) {
      composerDate.textContent = new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      composerDate.hidden = false;
    } else composerDate.hidden = true;
    composer.showModal();
    composerForm.elements.content.focus();
  };
  const closeComposer = () => {
    composer.close();
    composerForm.reset();
    editingReflectionId = null;
    composerDate.hidden = true;
    composerTrigger?.focus();
  };
  addButton.addEventListener('click', () => openComposer(null, addButton));
  composerClose.addEventListener('click', closeComposer);
  composer.addEventListener('cancel', (event) => { event.preventDefault(); closeComposer(); });
  composerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const submitter = event.submitter?.value;
    if (submitter === 'cancel') { closeComposer(); return; }
    const content = composerForm.elements.content.value.trim();
    if (!content) return;
    const reflections = safeParse(localStorage.getItem(reflectionKey), []);
    if (editingReflectionId) {
      const index = reflections.findIndex((entry) => entry.id === editingReflectionId);
      if (index !== -1) reflections[index] = { ...reflections[index], content, updatedAt: new Date().toISOString() };
    } else reflections.push({ id: crypto.randomUUID?.() || String(Date.now()), content, createdAt: new Date().toISOString() });
    localStorage.setItem(reflectionKey, JSON.stringify(reflections));
    const trigger = composerTrigger;
    composer.close(); composerForm.reset(); editingReflectionId = null; composerDate.hidden = true; render(); trigger?.focus();
  });
  render();
})();

(() => {
  const form = document.querySelector('#monthly-kata-form');
  if (!form) return;

  const monthInput = document.querySelector('#monthly-date');
  const message = document.querySelector('#monthly-message');
  const fields = ['problemSolving', 'success', 'options', 'approach', 'actualWork', 'tradeoffs', 'impact', 'nextImprovement'];
  const maxMonth = new Date().toISOString().slice(0, 7);
  const parameters = new URLSearchParams(window.location.search);
  const requestedMonth = parameters.get('month');
  monthInput.max = maxMonth;
  monthInput.value = requestedMonth && requestedMonth <= maxMonth ? requestedMonth : maxMonth;
  if (parameters.get('from') === 'reflections') document.querySelector('.back-button').href = 's08-my-journey-my-reflections.html';
  const rejectFutureMonth = () => {
    if (monthInput.value <= maxMonth) return false;
    monthInput.value = maxMonth;
    loadRecord();
    message.style.color = '#a63922';
    message.textContent = 'Future months aren’t available for practice entries.';
    return true;
  };
  const recordKey = () => `kata.monthly.${monthInput.value}`;
  const loadRecord = () => {
    const record = JSON.parse(localStorage.getItem(recordKey()) || '{}');
    fields.forEach((name) => { form.elements[name].value = record[name] || ''; });
    form.querySelectorAll('[name="clarity"]').forEach((option) => { option.checked = false; });
    const clarity = form.querySelector(`[name="clarity"][value="${record.clarity || ''}"]`);
    if (clarity) clarity.checked = true;
    message.textContent = record.completed ? 'Completed Monthly Practice.' : '';
    message.style.color = record.completed ? '#357047' : '';
  };
  const saveRecord = (completed = false) => {
    if (rejectFutureMonth()) return false;
    const existing = JSON.parse(localStorage.getItem(recordKey()) || '{}');
    const now = new Date().toISOString();
    const record = {
      ...existing,
      month: monthInput.value,
      clarity: form.elements.clarity.value || '',
      updatedAt: now,
      completed: completed || existing.completed || false,
      completedAt: completed ? now : existing.completedAt
    };
    fields.forEach((name) => { record[name] = form.elements[name].value; });
    localStorage.setItem(recordKey(), JSON.stringify(record));
    return true;
  };

  loadRecord();
  form.addEventListener('input', () => saveRecord());
  form.addEventListener('change', () => saveRecord());
  monthInput.addEventListener('change', () => {
    if (!rejectFutureMonth()) loadRecord();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!saveRecord(true)) return;
    localStorage.setItem('kata.completed.monthly', new Date().toISOString());
    message.style.color = '#357047';
    message.textContent = 'Completed Monthly Practice.';
  });
})();

(() => {
  const form = document.querySelector('#weekly-kata-form');
  if (!form) return;

  const weekInput = document.querySelector('#weekly-date');
  const message = document.querySelector('#weekly-message');
  const fields = ['avoidThinking', 'realValue', 'patterns', 'specificAction', 'nextTask'];
  const checks = ['understandingProblems', 'makingDecisions', 'creatingImpact', 'learningOutcomes'];
  const currentWeek = () => {
    const date = new Date();
    const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
    return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  };
  const maxWeek = currentWeek();
  const parameters = new URLSearchParams(window.location.search);
  const requestedWeek = parameters.get('week');
  weekInput.max = maxWeek;
  weekInput.value = requestedWeek && requestedWeek <= maxWeek ? requestedWeek : maxWeek;
  if (parameters.get('from') === 'reflections') document.querySelector('.back-button').href = 's08-my-journey-my-reflections.html';
  const rejectFutureWeek = () => {
    if (weekInput.value <= maxWeek) return false;
    weekInput.value = maxWeek;
    loadRecord();
    message.style.color = '#a63922';
    message.textContent = 'Future weeks aren’t available for practice entries.';
    return true;
  };
  const recordKey = () => `kata.weekly.${weekInput.value}`;
  const loadRecord = () => {
    const record = JSON.parse(localStorage.getItem(recordKey()) || '{}');
    fields.forEach((name) => { form.elements[name].value = record[name] || ''; });
    checks.forEach((name) => { form.elements[name].checked = Boolean(record.checks?.[name]); });
    form.querySelectorAll('[name="reality"]').forEach((option) => { option.checked = false; });
    const reality = form.querySelector(`[name="reality"][value="${record.reality || ''}"]`);
    if (reality) reality.checked = true;
    message.textContent = record.completed ? 'Completed Weekly Practice.' : '';
    message.style.color = record.completed ? '#357047' : '';
  };
  const saveRecord = (completed = false) => {
    if (rejectFutureWeek()) return false;
    const existing = JSON.parse(localStorage.getItem(recordKey()) || '{}');
    const now = new Date().toISOString();
    const record = {
      ...existing,
      week: weekInput.value,
      checks: Object.fromEntries(checks.map((name) => [name, form.elements[name].checked])),
      reality: form.elements.reality.value || '',
      updatedAt: now,
      completed: completed || existing.completed || false,
      completedAt: completed ? now : existing.completedAt
    };
    fields.forEach((name) => { record[name] = form.elements[name].value; });
    localStorage.setItem(recordKey(), JSON.stringify(record));
    return true;
  };

  loadRecord();
  form.addEventListener('input', () => saveRecord());
  form.addEventListener('change', () => saveRecord());
  weekInput.addEventListener('change', () => {
    if (!rejectFutureWeek()) loadRecord();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!saveRecord(true)) return;
    localStorage.setItem('kata.completed.weekly', new Date().toISOString());
    message.style.color = '#357047';
    message.textContent = 'Completed Weekly Practice.';
  });
})();

(() => {
  const form = document.querySelector('#daily-kata-form');
  if (!form) return;

  const dateInput = document.querySelector('#daily-date');
  const message = document.querySelector('#daily-message');
  const fields = ['problem', 'assumption', 'decision', 'impact', 'tomorrow'];
  const checks = ['understood', 'questioned', 'decisionClear', 'impactThought', 'improvement'];
  const today = new Date().toISOString().slice(0, 10);
  const parameters = new URLSearchParams(window.location.search);
  const requestedDate = parameters.get('date');
  dateInput.max = today;
  dateInput.value = requestedDate && requestedDate <= today ? requestedDate : today;
  if (parameters.get('from') === 'reflections') document.querySelector('.back-button').href = 's08-my-journey-my-reflections.html';

  const rejectFutureDate = () => {
    if (dateInput.value <= today) return false;
    dateInput.value = today;
    loadRecord();
    message.style.color = '#a63922';
    message.textContent = 'Future dates aren’t available for practice entries.';
    return true;
  };

  const recordKey = () => `kata.daily.${dateInput.value}`;
  const loadRecord = () => {
    const record = JSON.parse(localStorage.getItem(recordKey()) || '{}');
    fields.forEach((name) => { form.elements[name].value = record[name] || ''; });
    checks.forEach((name) => { form.elements[name].checked = Boolean(record.checks?.[name]); });
    message.textContent = record.completed ? 'Completed Daily Kata.' : '';
    message.style.color = record.completed ? '#357047' : '';
  };
  const saveRecord = (completed = false) => {
    if (rejectFutureDate()) return false;
    const existing = JSON.parse(localStorage.getItem(recordKey()) || '{}');
    const now = new Date().toISOString();
    const record = {
      ...existing,
      date: dateInput.value,
      checks: Object.fromEntries(checks.map((name) => [name, form.elements[name].checked])),
      updatedAt: now,
      completed: completed || existing.completed || false,
      completedAt: completed ? now : existing.completedAt
    };
    fields.forEach((name) => { record[name] = form.elements[name].value; });
    localStorage.setItem(recordKey(), JSON.stringify(record));
    return record;
  };

  loadRecord();
  form.addEventListener('input', () => saveRecord());
  form.addEventListener('change', () => saveRecord());
  dateInput.addEventListener('change', () => {
    if (!rejectFutureDate()) loadRecord();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!saveRecord(true)) return;
    localStorage.setItem('kata.completed.daily', `${dateInput.value}T12:00:00`);
    message.style.color = '#357047';
    message.textContent = 'Completed Daily Kata.';
  });
})();

(() => {
  const stateKey = 'kata.flow.state';
  const capabilities = {
    understanding: { label: 'Understanding Problems', advice: ['Define the real problem before acting', 'Separate the task from the underlying problem', 'Check what you know before deciding'] },
    assumptions: { label: 'Challenging Assumptions', advice: ['Name one assumption before acting', 'Check the evidence behind your first answer', 'Ask what could prove you wrong'] },
    decisions: { label: 'Decision Making', advice: ['Compare options before choosing', 'State why this approach is the best fit', 'Make the trade-offs explicit'] },
    impact: { label: 'Creating Impact', advice: ['Think about stakeholders before acting', 'Ask “Who benefits?”', 'Capture measurable outcomes'] },
    improvement: { label: 'Continuous Improvement', advice: ['Choose one small improvement', 'Reflect on what happened', 'Carry the learning into your next task'] }
  };
  const dayMs = 86400000;
  const dateOnly = (value) => new Date(`${value.slice(0, 10)}T12:00:00`);
  const completed = (prefix) => Object.keys(localStorage).filter((key) => key.startsWith(prefix)).map((key) => {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }).filter((record) => record?.completed);
  const weekDate = (week) => {
    const [year, number] = week.split('-W').map(Number);
    const firstThursday = new Date(Date.UTC(year, 0, 4));
    const monday = new Date(firstThursday);
    monday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + (number - 1) * 7);
    return new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(), 12);
  };
  const monthDate = (month) => new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1, 12);
  const filled = (value) => Boolean(String(value || '').trim());

  function collect() {
    const daily = completed('kata.daily.');
    const weekly = completed('kata.weekly.');
    const monthly = completed('kata.monthly.');
    const scores = Object.fromEntries(Object.keys(capabilities).map((key) => [key, { answered: 0, possible: 0 }]));
    const add = (capability, answer) => { scores[capability].possible += 1; if (filled(answer)) scores[capability].answered += 1; };
    daily.forEach((entry) => {
      add('understanding', entry.problem); add('assumptions', entry.assumption); add('decisions', entry.decision); add('impact', entry.impact); add('improvement', entry.tomorrow);
    });
    weekly.forEach((entry) => { add('understanding', entry.avoidThinking); add('impact', entry.realValue); add('improvement', entry.patterns); });
    monthly.forEach((entry) => { add('understanding', entry.problemSolving); add('decisions', entry.approach); add('impact', entry.impact); add('improvement', entry.nextImprovement); });
    const allAnswers = [
      ...daily.flatMap((entry) => [entry.problem, entry.assumption, entry.decision, entry.impact, entry.tomorrow]),
      ...weekly.flatMap((entry) => [entry.avoidThinking, entry.realValue, entry.patterns, entry.specificAction, entry.nextTask]),
      ...monthly.flatMap((entry) => [entry.problemSolving, entry.success, entry.options, entry.approach, entry.actualWork, entry.tradeoffs, entry.impact, entry.nextImprovement])
    ];
    const dates = [...daily.map((entry) => dateOnly(entry.date)), ...weekly.map((entry) => weekDate(entry.week)), ...monthly.map((entry) => monthDate(entry.month))].filter((date) => !Number.isNaN(date.getTime()));
    const setup = JSON.parse(localStorage.getItem('kata.setup') || 'null');
    const startDate = setup?.startedAt || setup?.updatedAt;
    const start = startDate ? new Date(startDate) : (dates.length ? new Date(Math.min(...dates)) : new Date());
    start.setHours(12, 0, 0, 0);
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const elapsedDays = Math.max(1, Math.floor((today - start) / dayMs) + 1);
    const expectedDaily = elapsedDays;
    const expectedWeekly = Math.max(1, Math.ceil(elapsedDays / 7));
    const expectedMonthly = Math.max(1, (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth() + 1);
    const consistency = Math.min(30, daily.length / expectedDaily * 30) + Math.min(20, weekly.length / expectedWeekly * 20) + Math.min(20, monthly.length / expectedMonthly * 20);
    const reflection = allAnswers.length ? allAnswers.filter(filled).length / allAnswers.length * 20 : 0;
    const mostRecent = dates.length ? Math.max(...dates) : null;
    const daysSince = mostRecent ? Math.max(0, Math.floor((today - mostRecent) / dayMs)) : Infinity;
    const recency = daysSince === 0 ? 10 : daysSince === 1 ? 8 : daysSince === 2 ? 6 : daysSince === 3 ? 4 : daysSince <= 7 ? 2 : 0;
    return { daily, weekly, monthly, scores, dates, index: Math.round(Math.min(100, consistency + reflection + recency)), daysSince };
  }

  function longestDailyGap(daily) {
    const dates = [...new Set(daily.map((entry) => entry.date))].sort().map(dateOnly);
    if (dates.length < 2) return Infinity;
    return Math.max(...dates.slice(1).map((date, index) => Math.floor((date - dates[index]) / dayMs) - 1));
  }
  function state() { return JSON.parse(localStorage.getItem(stateKey) || '{"level":0,"baseline":{"daily":0,"weekly":0,"monthly":0},"snapshots":[]}'); }
  function levelInfo(level) {
    return [
      { name: 'Shodan', summary: 'Beginning your reflective practice', message: 'Start small. Build your habit.' },
      { name: 'Rensha', summary: 'Practicing with consistency', message: 'You’re building momentum. Keep going deeper.' },
      { name: 'Dōsha', summary: 'Flowing with mastery', message: 'Your thinking habits are becoming deliberate.' }
    ][level];
  }
  function maybePromote(data, flowState) {
    if (flowState.level >= 2) return flowState;
    const snapshots = flowState.snapshots.length ? flowState.snapshots : [data.index];
    const average = snapshots.reduce((sum, score) => sum + score, 0) / snapshots.length;
    const additional = { daily: data.daily.length - flowState.baseline.daily, weekly: data.weekly.length - flowState.baseline.weekly, monthly: data.monthly.length - flowState.baseline.monthly };
    const requirement = flowState.level === 0 ? { daily: 21, weekly: 3, monthly: 1, index: 60, gap: 7 } : { daily: 60, weekly: 8, monthly: 3, index: 80, gap: 14 };
    if (additional.daily >= requirement.daily && additional.weekly >= requirement.weekly && additional.monthly >= requirement.monthly && average >= requirement.index && longestDailyGap(data.daily) <= requirement.gap) {
      flowState.level += 1;
      flowState.baseline = { daily: data.daily.length, weekly: data.weekly.length, monthly: data.monthly.length };
    }
    return flowState;
  }
  function render(data = collect(), flowState = state()) {
    const level = levelInfo(flowState.level);
    const capability = Object.entries(data.scores).sort(([, a], [, b]) => (a.possible ? a.answered / a.possible : 0) - (b.possible ? b.answered / b.possible : 0))[0][0];
    document.querySelectorAll('[data-flow-level-name]').forEach((element) => { element.textContent = level.name; });
    document.querySelectorAll('[data-flow-level-summary]').forEach((element) => { element.textContent = level.summary; });
    document.querySelectorAll('[data-flow-level-message]').forEach((element) => { element.textContent = level.message; });
    document.querySelectorAll('[data-flow-level-badge]').forEach((element) => { element.textContent = `Level ${flowState.level + 1} of 3`; });
    document.querySelectorAll('[data-flow-step]').forEach((element) => {
      const step = Number(element.dataset.flowStep);
      element.classList.toggle('active', step === flowState.level);
      element.classList.toggle('achieved', step < flowState.level);
    });
    const track = document.querySelector('.level-track'); if (track) track.style.setProperty('--level-line', `${flowState.level * 34}%`);
    document.querySelectorAll('[data-flow-capability]').forEach((element) => { element.textContent = capabilities[capability].label; });
    document.querySelectorAll('[data-flow-advice]').forEach((list) => { list.replaceChildren(...capabilities[capability].advice.map((advice) => Object.assign(document.createElement('li'), { textContent: advice }))); });
    document.querySelectorAll('[data-flow-index]').forEach((element) => { element.textContent = data.index; });
    document.querySelectorAll('[data-flow-ring]').forEach((element) => { element.style.setProperty('--flow-progress', `${data.index}%`); });
    document.querySelectorAll('[data-flow-bar]').forEach((element) => { element.style.width = `${data.index}%`; });
    const indexHeading = data.index >= 80 ? 'Strong progress!' : data.index >= 60 ? 'Building momentum' : 'Build your practice';
    const indexMessage = data.index >= 60 ? 'You’re on the right path. Stay consistent.' : 'Complete reflections to see your progress.';
    document.querySelectorAll('[data-flow-index-heading]').forEach((element) => { element.textContent = indexHeading; });
    document.querySelectorAll('[data-flow-index-message]').forEach((element) => { element.textContent = indexMessage; });
    return { data, flowState };
  }
  function calculationFingerprint(data) {
    return JSON.stringify({
      daily: data.daily.map((entry) => [entry.date, entry.updatedAt]),
      weekly: data.weekly.map((entry) => [entry.week, entry.updatedAt]),
      monthly: data.monthly.map((entry) => [entry.month, entry.updatedAt])
    });
  }
  function calculateOnOpen() {
    const data = collect();
    const flowState = state();
    const fingerprint = calculationFingerprint(data);
    if (flowState.lastCalculationFingerprint !== fingerprint) {
      flowState.snapshots = [...flowState.snapshots, data.index].slice(-200);
      flowState.lastCalculationFingerprint = fingerprint;
    }
    maybePromote(data, flowState);
    flowState.lastComputedAt = new Date().toISOString();
    localStorage.setItem(stateKey, JSON.stringify(flowState));
    return render(data, flowState);
  }
  window.KataFlow = { calculateOnOpen };
  if (document.querySelector('[data-flow-index]')) {
    const loader = document.querySelector('[data-flow-loading]');
    const dashboard = document.querySelector('[data-flow-dashboard]');
    const asOf = document.querySelector('[data-flow-as-of]');
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        const { flowState } = window.KataFlow.calculateOnOpen();
        const timestamp = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(flowState.lastComputedAt));
        asOf.textContent = `As of ${timestamp}`;
        asOf.hidden = false;
        loader.hidden = true;
        dashboard.hidden = false;
      }, 350);
    });
  }
})();
