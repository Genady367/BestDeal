const listElement = document.getElementById('product-list');
const kbDoneBtn   = document.getElementById('kb-done');

// ---- persistence ----
function saveList() {
  const items = [];
  listElement.querySelectorAll('li').forEach(li => {
    const textInput = li.querySelector('input[type="text"]');
    const check     = li.querySelector('input[type="checkbox"]');

    // сохраняем только заполненные элементы
    if (textInput && textInput.value.trim()) {
      items.push({ text: textInput.value.trim(), checked: check.checked });
    }
  });
  localStorage.setItem('shoppingList', JSON.stringify(items));
}

function loadList() {
  const saved = JSON.parse(localStorage.getItem('shoppingList') || '[]');
  saved.forEach(item => addItem(item.text, item.checked));
  addItem(); // пустая строка для ввода всегда последняя
}

// ---- UI ----
function addItem(text = '', checked = false) {
  const li = document.createElement('li');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.addEventListener('change', saveList);

  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  input.placeholder = 'Enter product...';
  input.autocapitalize = 'words';
  input.inputMode = 'text';
  input.enterKeyHint = 'next';

  // Enter -> добавляем новую строку, сохраняем
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      // если это последний li — добавим новый пустой под ним
      if (li.nextSibling === null) addItem();
      saveList();
      // перевести фокус на новый пустой input
      const lastInput = listElement.querySelector('li:last-child input[type="text"]');
      if (lastInput) lastInput.focus();
    }
  });

  input.addEventListener('input', () => {
    // как только поле впервые заполнили — показываем кнопку удаления
    if (input.value.trim() && !li.querySelector('.delete-btn')) {
      li.appendChild(makeDeleteBtn(li));
    }
    saveList();
  });

  li.appendChild(checkbox);
  li.appendChild(input);

  // у уже заполненных элементов — сразу добавить delete
  if (text) li.appendChild(makeDeleteBtn(li));

  listElement.appendChild(li);
}

function makeDeleteBtn(li) {
  const delBtn = document.createElement('button');
  delBtn.className = 'delete-btn';
  delBtn.textContent = '🗑️';
  delBtn.title = 'Delete';
  delBtn.addEventListener('click', () => {
    li.remove();
    saveList();

    // если не осталось ни одного пустого поля — добавим его
    const hasEmpty = [...listElement.querySelectorAll('input[type="text"]')]
      .some(inp => !inp.value.trim());
    if (!hasEmpty) addItem();
  });
  return delBtn;
}

// ---- Кнопка Done для скрытия клавиатуры ----
document.addEventListener('focusin', (e) => {
  if (e.target.matches('input[type="text"]')) kbDoneBtn.hidden = false;
});

document.addEventListener('focusout', () => {
  setTimeout(() => {
    const focused = document.querySelector('input[type="text"]:focus');
    if (!focused) kbDoneBtn.hidden = true;
  }, 50);
});

kbDoneBtn.addEventListener('click', () => {
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur(); // закрыть клавиатуру
  }
  kbDoneBtn.hidden = true;
});

// ---- init ----
window.addEventListener('load', loadList);
