const STORAGE_KEY = "shopping-list-items";

/** @type {{id: string, label: string, done: boolean}[]} */
let items = load();

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const formEl = document.getElementById("add-form");
const inputEl = document.getElementById("item-input");
const clearBtn = document.getElementById("clear-btn");

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function render() {
  listEl.innerHTML = "";
  emptyEl.style.display = items.length ? "none" : "block";

  for (const item of items) {
    const li = document.createElement("li");
    li.className = item.done ? "done" : "";
    li.dataset.id = item.id;

    const check = document.createElement("button");
    check.className = "check";
    check.type = "button";
    check.setAttribute("aria-label", "Toggle done");

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = item.label;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.textContent = "✕";
    remove.setAttribute("aria-label", "Remove item");

    li.append(check, label, remove);
    listEl.appendChild(li);
  }
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const label = inputEl.value.trim();
  if (!label) return;
  items.push({ id: crypto.randomUUID(), label, done: false });
  inputEl.value = "";
  save();
  render();
});

listEl.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains("check")) {
    const item = items.find((i) => i.id === id);
    if (item) item.done = !item.done;
    save();
    render();
  } else if (e.target.classList.contains("remove")) {
    items = items.filter((i) => i.id !== id);
    save();
    render();
  }
});

clearBtn.addEventListener("click", () => {
  items = items.filter((i) => !i.done);
  save();
  render();
});

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
