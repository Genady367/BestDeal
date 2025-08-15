// feedback.js — drop-in modal that works with .feedback-btn and auto-builds markup
(function () {
  const openBtn = document.querySelector('.feedback-btn');
  if (!openBtn) {
    console.warn('[Feedback] .feedback-btn not found');
    return;
  }

  // --- build modal on the fly (once) ---
  function buildModal() {
    // overlay
    const overlay = document.createElement('div');
    overlay.id = 'bd-feedback-overlay';
    overlay.setAttribute('hidden', '');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '9999', opacity: '0', transition: 'opacity .25s ease'
    });

    // modal
    const modal = document.createElement('div');
    Object.assign(modal.style, {
      width: 'min(520px, 92vw)', background: '#fff', color: '#111',
      borderRadius: '12px', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,.2)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
    });

    modal.innerHTML = `
      <h3 style="margin:0 0 12px;font-size:18px;">Add discount (Feedback)</h3>

      <label style="display:block;margin:8px 0 4px;">Store</label>
      <select id="discount-store" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:8px;">
        <option value="">Select…</option>
        <option>Walmart</option>
        <option>Superstore</option>
        <option>Costco</option>
        <option>Safeway</option>
      </select>

      <label style="display:block;margin:12px 0 4px;">Photo of the discount</label>
      <input id="discount-photo" type="file" accept="image/*" style="width:100%;"/>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
        <button id="cancel-discount" style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:#f6f6f6;">Cancel</button>
        <button id="send-discount"   style="padding:8px 12px;border-radius:8px;border:1px solid #0a7; background:#10b981; color:#fff;">Save</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // toast
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      Object.assign(toast.style, {
        position: 'fixed', left: '50%', bottom: '18px', transform: 'translateX(-50%)',
        background: '#111', color: '#fff', padding: '10px 14px', borderRadius: '10px',
        zIndex: '10000', opacity: '0', transition: 'opacity .2s ease'
      });
      toast.setAttribute('hidden', '');
      document.body.appendChild(toast);
    }

    function showToast(msg, ms = 1800) {
      toast.textContent = msg;
      toast.removeAttribute('hidden');
      requestAnimationFrame(() => (toast.style.opacity = '1'));
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.setAttribute('hidden', ''), 200);
      }, ms);
    }

    function open()  { overlay.removeAttribute('hidden'); requestAnimationFrame(() => (overlay.style.opacity = '1')); }
    function close() { overlay.style.opacity = '0'; setTimeout(() => overlay.setAttribute('hidden',''), 250); }

    // events
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) close(); });
    modal.querySelector('#cancel-discount').addEventListener('click', close);

    modal.querySelector('#send-discount').addEventListener('click', () => {
      const store = modal.querySelector('#discount-store').value.trim();
      const photo = modal.querySelector('#discount-photo');

      if (!photo?.files?.length) { showToast('Add a photo'); return; }
      if (!store) { showToast('Select a store'); return; }

      // simple local entry (no actual image persist yet)
      const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      const entry = {
        id, created_at: new Date().toISOString(), store,
        ocr_text: null, price: null, regular_price: null, valid_till: null, ocr_conf: null,
        master_key: `${id}:master`, thumb_key: `${id}:thumb`, status: 'new'
      };
      const arr = JSON.parse(localStorage.getItem('bd-feedback') || '[]');
      arr.unshift(entry);
      localStorage.setItem('bd-feedback', JSON.stringify(arr));

      // reset & close
      photo.value = '';
      modal.querySelector('#discount-store').value = '';
      close();
      showToast('Saved locally');
    });

    return { open };
  }

  const modalApi = buildModal();
  openBtn.addEventListener('click', () => modalApi.open());
})();
