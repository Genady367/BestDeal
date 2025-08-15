// feedback.js — minimal working modal logic (Lana)
(function () {
  const $open   = document.getElementById('goFeedback');
  const $modal  = document.getElementById('add-discount');
  const $cancel = document.getElementById('cancel-discount');
  const $send   = document.getElementById('send-discount');
  const $photo  = document.getElementById('discount-photo');
  const $store  = document.getElementById('discount-store');

  if (!$open || !$modal) {
    console.warn('[Feedback] Button or modal not found');
    return;
  }

  // --- Toast helper ---
  function getToast() {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      t.hidden = true;
      document.body.appendChild(t);
    }
    return t;
  }
  function showToast(msg, ms = 1800) {
    const t = getToast();
    t.textContent = msg;
    t.hidden = false;
    t.style.opacity = '0';
    requestAnimationFrame(() => {
      t.style.transition = 'opacity .2s ease';
      t.style.opacity = '1';
    });
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => (t.hidden = true), 200);
    }, ms);
  }

  // --- Modal open/close ---
  function openModal() {
    $modal.removeAttribute('hidden');
    $modal.style.opacity = '0';
    requestAnimationFrame(() => {
      $modal.style.transition = 'opacity .25s ease';
      $modal.style.opacity = '1';
    });
  }
  function closeModal() {
    $modal.style.opacity = '0';
    setTimeout(() => $modal.setAttribute('hidden', ''), 250);
  }

  $open.addEventListener('click', openModal);
  if ($cancel) $cancel.addEventListener('click', closeModal);
  // клик по фону
  $modal.addEventListener('click', (e) => { if (e.target === $modal) closeModal(); });
  // Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$modal.hasAttribute('hidden')) closeModal();
  });

  // --- Local save (MVP) ---
  function readEntries() {
    try { return JSON.parse(localStorage.getItem('bd-feedback')) || []; }
    catch { return []; }
  }
  function writeEntries(items) {
    localStorage.setItem('bd-feedback', JSON.stringify(items));
  }
  function uid4() {
    return Math.random().toString(36).slice(2, 6);
  }

  if ($send) {
    $send.addEventListener('click', async () => {
      // Validate
      if (!$photo?.files?.length) {
        showToast('Add a photo'); return;
      }
      if (!$store || !$store.value) {
        showToast('Select a store'); return;
      }

      // Build entry (no real image persist in MVP)
      const id = `fb_${Date.now()}_${uid4()}`;
      const entry = {
        id,
        created_at: new Date().toISOString(),
        store: $store.value,
        ocr_text: null,
        price: null,
        regular_price: null,
        valid_till: null,
        ocr_conf: null,
        master_key: `${id}:master`, // placeholders
        thumb_key:  `${id}:thumb`,
        status: 'new'
      };

      const entries = readEntries();
      entries.unshift(entry);
      writeEntries(entries);

      // Reset + close + toast
      if ($photo) $photo.value = '';
      if ($store) $store.value = '';
      closeModal();
      showToast('Saved locally');
    });
  }
})();
