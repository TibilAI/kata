(() => {
  if (!('serviceWorker' in navigator)) return;

  let refreshing = false;
  let notice;

  const showUpdateNotice = (registration) => {
    if (!registration.waiting || notice) return;
    notice = document.createElement('aside');
    notice.className = 'pwa-update-notice';
    notice.setAttribute('role', 'status');
    notice.innerHTML = '<span>A KATA update is ready.</span><button type="button">Update</button>';
    notice.querySelector('button').addEventListener('click', () => {
      refreshing = true;
      registration.waiting.postMessage({ type: 'KATA_SKIP_WAITING' });
    });
    document.body.append(notice);
    window.KataAnalytics?.track('pwa_update_available');
  };

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        `${document.documentElement.dataset.appRoot || ''}sw.js`,
        { scope: document.documentElement.dataset.appRoot || './' }
      );
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

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) window.location.reload();
  });
})();
