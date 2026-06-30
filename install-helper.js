(() => {
  'use strict';

  let deferredInstallPrompt = null;
  let installButton = null;
  let overlay = null;

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isIOSSafari = isIOS && /Safari/i.test(ua) && !/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo)/i.test(ua);

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function showButton() {
    if (installButton && !isStandalone()) installButton.hidden = false;
  }

  function hideButton() {
    if (installButton) installButton.hidden = true;
  }

  function closeInstructions() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  function openInstructions(type) {
    if (!overlay) return;
    const title = overlay.querySelector('[data-pwa-title]');
    const note = overlay.querySelector('[data-pwa-note]');
    const steps = overlay.querySelector('[data-pwa-steps]');

    if (type === 'ios') {
      title.textContent = 'ติดตั้งแอปบน iPhone/iPad';
      note.textContent = isIOSSafari ? 'ทำตาม 3 ขั้นตอนนี้ใน Safari' : 'กรุณาเปิดลิงก์นี้ด้วย Safari ก่อน';
      steps.innerHTML = '<li>กดปุ่มแชร์ ↑</li><li>เลือก “เพิ่มไปยังหน้าจอโฮม”</li><li>กด “เพิ่ม”</li>';
    } else {
      title.textContent = 'ติดตั้งแอปบน Android';
      note.textContent = 'กรณีหน้าต่างติดตั้งไม่ขึ้น ให้ทำผ่านเมนู Chrome';
      steps.innerHTML = '<li>เปิดลิงก์ด้วย Chrome</li><li>กดเมนูจุด 3 จุด ⋮</li><li>เลือก “ติดตั้งแอป”</li>';
    }

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.pwa-install-close').focus();
  }

  async function requestInstall() {
    if (isStandalone()) {
      hideButton();
      return;
    }

    if (isIOS) {
      openInstructions('ios');
      return;
    }

    if (deferredInstallPrompt) {
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice.catch(() => ({ outcome: 'dismissed' }));
      if (choice.outcome === 'accepted') hideButton();
      else if (isAndroid) showButton();
      return;
    }

    openInstructions('android');
  }

  function buildUI() {
    if (isStandalone()) return;

    installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.className = 'pwa-install-button';
    installButton.setAttribute('aria-label', 'ติดตั้งแอปลงในอุปกรณ์');
    installButton.hidden = true;
    installButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3h14v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>ติดตั้งแอป</span>';
    installButton.addEventListener('click', requestInstall);

    overlay = document.createElement('div');
    overlay.className = 'pwa-install-overlay';
    overlay.hidden = true;
    overlay.innerHTML = '<section class="pwa-install-dialog" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle"><h2 id="pwaInstallTitle" data-pwa-title>ติดตั้งแอป</h2><p data-pwa-note></p><ol class="pwa-install-steps" data-pwa-steps></ol><button class="pwa-install-close" type="button">เข้าใจแล้ว</button></section>';
    overlay.querySelector('.pwa-install-close').addEventListener('click', closeInstructions);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeInstructions();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay && !overlay.hidden) closeInstructions();
    });

    document.body.append(installButton, overlay);

    if (isIOS || isAndroid) showButton();
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideButton();
    closeInstructions();
  });

  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', (event) => {
    if (event.matches) hideButton();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI, { once: true });
  else buildUI();
})();
