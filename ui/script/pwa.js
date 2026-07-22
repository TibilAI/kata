(() => {
  const dismissKey = 'kata.pwa.installCtaDismissedUntil';
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  let deferredInstallPrompt = null;
  let refreshing = false;
  let updateNotice;
  let installDialog;
  let installAvailabilityRecorded = false;

  const dismissed = () => Number(localStorage.getItem(dismissKey)) > Date.now();
  const getInstallState = () => ({ available: !isStandalone() && (Boolean(deferredInstallPrompt) || isIos), standalone: isStandalone(), landingDismissed: dismissed(), isIos });
  const track = (eventName) => window.KataAnalytics?.track(eventName);
  const showToast = (message) => {
    const toast = document.createElement('p');
    toast.className = 'pwa-install-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.append(toast);
    window.setTimeout(() => toast.remove(), 4000);
  };
  const updateInstallUi = () => {
    const state = getInstallState();
    document.querySelectorAll('[data-install-kata-cta]').forEach((element) => { element.hidden = !state.available || state.landingDismissed; });
    document.dispatchEvent(new CustomEvent('kata:pwa-install-state', { detail: state }));
    if (state.available && !installAvailabilityRecorded) { track('pwa_install_available'); installAvailabilityRecorded = true; }
  };
  const closeInstallDialog = () => installDialog?.close();
  const showIosInstructions = () => {
    if (!installDialog) {
      installDialog = document.createElement('dialog');
      installDialog.className = 'pwa-install-dialog';
      installDialog.setAttribute('aria-labelledby', 'install-kata-title');
      installDialog.innerHTML = '<section><button class="pwa-install-dialog-close" type="button" aria-label="Close install instructions">×</button><img src="../style/icons/kata-app-icon-192.png" alt=""><h2 id="install-kata-title">Install KATA</h2><p>In Safari, tap the Share button, then choose <strong>Add to Home Screen</strong>.</p><button class="pwa-install-dialog-done" type="button">Got it</button></section>';
      document.body.append(installDialog);
      installDialog.querySelectorAll('button').forEach((button) => button.addEventListener('click', closeInstallDialog));
      installDialog.addEventListener('click', (event) => { if (event.target === installDialog) closeInstallDialog(); });
    }
    track('pwa_install_instructions_shown');
    installDialog.showModal();
  };
  const requestInstall = async (source) => {
    const state = getInstallState();
    if (!state.available || state.standalone) return;
    if (state.isIos && !deferredInstallPrompt) { showIosInstructions(); return; }
    track('pwa_install_prompted');
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      track('pwa_install_accepted');
      deferredInstallPrompt = null;
      localStorage.removeItem(dismissKey);
      showToast('KATA has been installed.');
    } else {
      track('pwa_install_dismissed');
      if (source === 'landing') localStorage.setItem(dismissKey, String(Date.now() + 7 * 86400000));
    }
    updateInstallUi();
  };

  window.KataPWA = {
    getInstallState,
    requestInstall,
    dismissLandingInstall: () => { localStorage.setItem(dismissKey, String(Date.now() + 7 * 86400000)); track('pwa_install_cta_dismissed'); updateInstallUi(); }
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallUi();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    localStorage.removeItem(dismissKey);
    updateInstallUi();
  });
  document.querySelectorAll('[data-request-install-kata]').forEach((button) => button.addEventListener('click', () => requestInstall('landing')));
  document.querySelectorAll('[data-dismiss-install-kata]').forEach((button) => button.addEventListener('click', () => window.KataPWA.dismissLandingInstall()));
  updateInstallUi();

  if (!('serviceWorker' in navigator)) return;
  const showUpdateNotice = (registration) => {
    if (!registration.waiting || updateNotice) return;
    updateNotice = document.createElement('aside');
    updateNotice.className = 'pwa-update-notice';
    updateNotice.setAttribute('role', 'status');
    updateNotice.innerHTML = '<span>A KATA update is ready.</span><button type="button">Update</button>';
    updateNotice.querySelector('button').addEventListener('click', () => {
      refreshing = true;
      registration.waiting.postMessage({ type: 'KATA_SKIP_WAITING' });
    });
    document.body.append(updateNotice);
    track('pwa_update_available');
  };

  window.addEventListener('load', async () => {
    try {
      const root = document.documentElement.dataset.appRoot || './';
      const registration = await navigator.serviceWorker.register(`${root}sw.js`, { scope: root });
      showUpdateNotice(registration);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateNotice(registration);
        });
      });
    } catch (_) {
      // The app remains fully usable in the browser if registration is unavailable.
    }
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) window.location.reload(); });
})();
