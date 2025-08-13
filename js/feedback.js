/* BestDeal — Feedback Step 2: local media + OCR stub + parse */

(() => {
  // ---- Config ----
  const USE_OCR = false;
  const FEEDBACK_KEY = 'bd-feedback';
  const IDB_NAME = 'bestdeal-feedback';
  const IDB_STORE = 'media'; // { key, blob, w, h, type }

  // ---- DOM ----
  const $openBtn   = document.getElementById('goFeedback')    // кнопка на экране
                    || document.getElementById('btn-feed');    // (если есть)
  const $modal     = document.getElementById('add-discount');
  const $photo     = document.getElementById('discount-photo');
  const $store     = document.getElementById('discount-store');
  const $send      = document.getElementById('send-discount');
  const $cancel    = document.getElementById('cancel-discount');
  const $toast     = document.getElementById('toast');

  // ---- Helpers: toast & modal ----
  function showToast(msg = 'Saved locally') {
    if (!$toast) return;
    $toast.textContent = msg;
    $toast.hidden = false;
    setTimeout(() => ($toast.hidden = true), 1800);
  }
  function openModal()  { if ($modal) $modal.removeAttribute('hidden'); }
  function closeModal() { if ($modal) $modal.setAttribute('hidden', ''); }

  if ($openBtn) $openBtn.addEventListener('click', openModal);
  if ($cancel)  $cancel.addEventListener('click', closeModal);
  if ($modal) {
    // клик по фону — закрыть (если есть overlay в стилях)
    $modal.addEventListener('click', (e) => {
      if (e.target === $modal) closeModal();
    });
  }

  // ---- LocalStorage: feedback entries ----
  function readEntries() {
    try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); }
    catch { return []; }
  }
  function writeEntries(list) {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
  }
  function genId() {
    const r = Math.random().toString(36).slice(2, 6);
    return `fb_${Date.now()}_${r}`;
  }

  // ---- IndexedDB: simple Blob store ----
  function idbOpen() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbPut(record) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ---- Image processing: master (≤2048px) & thumb (200x200) as WebP ----
  async function fileToBitmap(file) {
    const buf = await file.arrayBuffer();
    return await createImageBitmap(new Blob([buf]));
  }
  function fitWithin(w, h, maxSide = 2048) {
    const scale = Math.min(1, maxSide / Math.max(w, h));
    return { w: Math.round(w * scale), h: Math.round(h * scale) };
  }
  async function bitmapToCanvas(bitmap, { w, h }) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    return c;
  }
  async function canvasToWebP(canvas, q = 0.8) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', q);
    });
  }
  async function makeMasterWebP(bitmap) {
    const size = fitWithin(bitmap.width, bitmap.height, 2048);
    const c = await bitmapToCanvas(bitmap, size);
    const blob = await canvasToWebP(c, 0.8);
    return { blob, w: size.w, h: size.h };
  }
  async function makeThumbWebP(bitmap) {
    // центр-кроп до квадрата, затем 200x200
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width  - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);

    const cCrop = document.createElement('canvas');
    cCrop.width = side; cCrop.height = side;
    cCrop.getContext('2d').drawImage(bitmap, sx, sy, side, side, 0, 0, side, side);

    const c200 = document.createElement('canvas');
    c200.width = 200; c200.height = 200;
    c200.getContext('2d').drawImage(cCrop, 0, 0, 200, 200);

    const blob = await canvasToWebP(c200, 0.7);
    return { blob, w: 200, h: 200 };
  }

  // ---- OCR stub + parsing ----
  async function runOCRStub(/* blob */) {
    if (!USE_OCR) return { text: null, conf: null };
    // На будущее: сюда подключим Tesseract.js (eng+rus) с предобработкой.
    return { text: null, conf: null };
  }

  // Regex v1 из нашего пакета материалов
  const PRICE_RE = /(?:(\\$)?)\\s*(\\d{1,3}(?:[.,]\\d{2})?)/; // простая вырезка
  const REG_RE   = /(?i)\\b(reg(?:ular)?\\s*price|was)\\b[:\\s]*\\$?\\s*(\\d{1,3}(?:[.,]\\d{2})?)/;
  const DATE_RE  = new RegExp(
    String.raw`\\b(\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\.?\\s+\\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\.?\\s+\\d{1,2},\\s*\\d{4})\\b`,
    'i'
  );

  function parseFromText(txt) {
    if (!txt) return { price: null, regular_price: null, valid_till: null };
    let price = null, regular_price = null, valid_till = null;
    const m1 = txt.match(PRICE_RE); if (m1) price = parseFloat(m1[2].replace(',', '.'));
    const m2 = txt.match(REG_RE);   if (m2) regular_price = parseFloat(m2[2].replace(',', '.'));
    const m3 = txt.match(DATE_RE);  if (m3) valid_till = m3[1];
    return { price, regular_price, valid_till };
  }

  // ---- Send handler ----
  if ($send) {
    $send.addEventListener('click', async () => {
      try {
        const hasPhoto = $photo?.files?.length > 0;
        let store = ($store?.value || '').trim();
        if (!hasPhoto) { showToast('Attach a photo'); return; }
        if (!store)    { showToast('Select a store'); return; }

        const id = genId();
        const file = $photo.files[0];

        // 1) Read & process
        const bmp = await fileToBitmap(file);
        const master = await makeMasterWebP(bmp);
        const thumb  = await makeThumbWebP(bmp);

        // limit checks (в КБ)
        const masterKB = Math.round(master.blob.size / 1024);
        const thumbKB  = Math.round(thumb.blob.size / 1024);
        if (masterKB > 1500) { showToast('Master too large'); return; }
        if (thumbKB  >   80) { showToast('Thumb too large');  return; }

        // 2) Save to IndexedDB
        await idbPut({ key: `${id}:master`, blob: master.blob, w: master.w, h: master.h, type: 'image/webp' });
        await idbPut({ key: `${id}:thumb`,  blob: thumb.blob,  w: thumb.w,  h: thumb.h,  type: 'image/webp'  });

        // 3) OCR stub + parse
        const ocr = await runOCRStub(master.blob);
        const parsed = parseFromText(ocr.text);

        // 4) Save metadata into localStorage
        const created_at = new Date().toISOString();
        const entries = readEntries();
        entries.push({
          id,
          created_at,
          store,
          price: parsed.price,
          regular_price: parsed.regular_price,
          valid_till: parsed.valid_till,
          ocr_text: ocr.text,
          ocr_conf: ocr.conf,
          master_key: `${id}:master`,
          thumb_key:  `${id}:thumb`,
          master_w: master.w, master_h: master.h,
          thumb_w: thumb.w,   thumb_h: thumb.h,
          status: 'new'
        });
        writeEntries(entries);

        // 5) Reset UI
        if ($photo) $photo.value = '';
        if ($store) $store.value = '';
        closeModal();
        showToast('Saved locally');
      } catch (err) {
        console.error(err);
        showToast('Error');
      }
    });
  }
})();
})(); // ← конец основной функции

// --- Feedback button opens modal ---
const $feedbackBtn = document.getElementById('goFeedback');
const $feedbackModal = document.getElementById('add-discount'); // ID модального окна
const $cancelBtn = document.getElementById('cancel-discount');

if ($feedbackBtn && $feedbackModal) {
    $feedbackBtn.addEventListener('click', () => {
        $feedbackModal.removeAttribute('hidden');
        $feedbackModal.style.opacity = '0';
        setTimeout(() => {
            $feedbackModal.style.transition = 'opacity 0.3s ease';
            $feedbackModal.style.opacity = '1';
        }, 10);
    });
}

function closeModalSmooth() {
    $feedbackModal.style.opacity = '0';
    setTimeout(() => {
        $feedbackModal.setAttribute('hidden', '');
    }, 300); // ждём анимацию
}

if ($cancelBtn && $feedbackModal) {
    $cancelBtn.addEventListener('click', closeModalSmooth);
}

// --- Закрытие кликом по фону ---
if ($feedbackModal) {
    $feedbackModal.addEventListener('click', (e) => {
        if (e.target === $feedbackModal) {
            closeModalSmooth();
        }
    });
}
