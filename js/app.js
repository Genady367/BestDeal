const productInput = document.getElementById("productInput");
const addBtn = document.getElementById("addProduct");
const productList = document.getElementById("productList");
const goToFeedbackBtn = document.getElementById("goToFeedback");

const shoppingScreen = document.getElementById("shoppingScreen");
const feedbackScreen = document.getElementById("feedbackScreen");

document.addEventListener("DOMContentLoaded", loadList);

addBtn.addEventListener("click", () => {
  const name = productInput.value.trim();
  if (name) {
    addProduct(name);
    saveToStorage(name);
    productInput.value = "";
  }
});

function addProduct(name) {
  const li = document.createElement("li");
  li.innerHTML = `
    <span>${name}</span>
    <button class="delete">🗑</button>
  `;
  productList.appendChild(li);

  li.querySelector(".delete").addEventListener("click", () => {
    li.remove();
    removeFromStorage(name);
  });
}

function saveToStorage(name) {
  const items = getFromStorage();
  items.push(name);
  localStorage.setItem("bestdeal-list", JSON.stringify(items));
}

function loadList() {
  const items = getFromStorage();
  items.forEach(addProduct);
}

function getFromStorage() {
  return JSON.parse(localStorage.getItem("bestdeal-list")) || [];
}

function removeFromStorage(name) {
  let items = getFromStorage();
  items = items.filter(item => item !== name);
  localStorage.setItem("bestdeal-list", JSON.stringify(items));
}

goToFeedbackBtn.addEventListener("click", () => {
  shoppingScreen.style.display = "none";
  feedbackScreen.style.display = "block";
});