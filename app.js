// BestDeal Mobile v1 — динамический список + localStorage + клавиша Done

const STORAGE_KEY = 'bd-items';
const listEl = document.getElementById('product-list');
const kbDoneBtn = document.getElementById('kb-done');

// ---------- helpers ----------
function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStore(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function snapshotFromDOM() {
  const items = [];
  listEl.querySelectorAll('li').forEach(li => {
    const text = li.querySelector('input[type="text"]').value.trim();
    const checked = li.querySelector('input[type="checkbox"]').checked;
    if (text.length > 0 || listEl.children.length === 1) {
      items.push({ text, checked });
    }
  });
  return items;
}

function saveFromDOM() {
  writeStore(snapshotFromDOM());
}

function createLi({ text = '', checked = false } = {}, autofocus = false) {
  const li = document.createElement('li');
  li.className = 'product-item';

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'product-check';
  cb.checked = !!checked;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'product-input';
  input.placeholder = 'Enter product...';
  input.value = text || '';

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete-btn';
  del.setAttribute('aria-label', 'Delete');
  del.textContent = '🗑';

  li.append(cb, input, del);
  listEl.appendChild(li);

  // Events
  cb.addEventListener('change', saveFromDOM);

  input.addEventListener('input', saveFromDOM);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Добавляем новую строку, если текущая непустая
      if (input.value.trim().length > 0) {
        createLi({ text: '' }, true);
        saveFromDOM();
      }
    }
  });

  input.addEventListener('focus', () => {
    showKbDone();
  });

  input.addEventListener('blur', () => {
    // небольшая задержка, чтобы успеть нажать кнопку
    setTimeout(hideKbDoneIfNoFocus, 100);
  });

  del.addEventListener('click', () => {
    const willRemove = listEl.children.length > 1;
    li.remove();
    if (!willRemove) {
      // всегда оставляем хотя бы одну строку
      createLi({ text: '' }, true);
    }
    saveFromDOM();
  });

  if (autofocus) {
    input.focus();
    // курсор в конец
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
}

// ---------- keyboard Done ----------
function showKbDone() {
  if (!kbDoneBtn) return;
  kbDoneBtn.hidden = false;
}

function hideKbDoneIfNoFocus() {
  if (!kbDoneBtn) return;
  const active = document.activeElement;
  if (!active || active.tagName !== 'INPUT' || active.type !== 'text') {
    kbDoneBtn.hidden = true;
  }
}

if (kbDoneBtn) {
  kbDoneBtn.addEventListener('click', () => {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    kbDoneBtn.hidden = true;
  });
}

// ---------- init ----------
(function init() {
  const stored = readStore();
  if (stored.length === 0) {
    createLi({ text: '' }, true);
  } else {
    stored.forEach((item, idx) => createLi(item, idx === stored.length - 1));
  }
})();
