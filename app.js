const STORAGE_CUSTOM = "what2eat_custom_v1";
const STORAGE_DISABLED = "what2eat_disabled_cats_v1";

const DEFAULT_POOLS = {
  中餐家常菜: ["番茄炒蛋盖饭", "青椒肉丝", "红烧肉", "酸菜鱼", "麻婆豆腐", "宫保鸡丁", "回锅肉"],
  面食粉类: ["牛肉面", "炸酱面", "螺蛳粉", "酸辣粉", "炒米粉", "馄饨", "饺子"],
  火锅烧烤: ["火锅", "烤肉", "串串", "自助小火锅", "寿喜烧"],
  快餐便当: ["麦当劳", "肯德基", "汉堡王", "日式便当", "盖浇饭外卖"],
  轻食健康: ["沙拉", "寿司", "三明治", "粥配小菜", "关东煮"],
  异国风味: ["泰餐", "日料", "韩料", "披萨", "越南粉", "咖喱"],
  随便吃吃: ["泡面升级款", "便利店组合", "楼下食堂", "上次那家还不错"],
};

function loadCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string" && s.trim()) : [];
  } catch {
    return [];
  }
}

function saveCustom(list) {
  localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(list));
}

function loadDisabledCats() {
  try {
    const raw = localStorage.getItem(STORAGE_DISABLED);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDisabledCats(set) {
  localStorage.setItem(STORAGE_DISABLED, JSON.stringify([...set]));
}

const categoryToggles = document.getElementById("category-toggles");
const customInput = document.getElementById("custom-input");
const addForm = document.getElementById("add-form");
const customList = document.getElementById("custom-list");
const decideBtn = document.getElementById("decide-btn");
const poolHint = document.getElementById("pool-hint");
const resultEl = document.getElementById("result");
const resetBtn = document.getElementById("reset-btn");

let customItems = loadCustom();
let disabledCats = loadDisabledCats();

function renderCategories() {
  categoryToggles.innerHTML = "";
  for (const [name, items] of Object.entries(DEFAULT_POOLS)) {
    const enabled = !disabledCats.has(name);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    btn.dataset.cat = name;
    btn.innerHTML = `${escapeHtml(name)} <span class="chip-count">(${items.length})</span>`;
    btn.addEventListener("click", () => {
      if (disabledCats.has(name)) disabledCats.delete(name);
      else disabledCats.add(name);
      saveDisabledCats(disabledCats);
      btn.setAttribute("aria-pressed", disabledCats.has(name) ? "false" : "true");
      updatePoolHint();
    });
    categoryToggles.appendChild(btn);
  }
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function renderCustomList() {
  customList.innerHTML = "";
  customItems.forEach((text, index) => {
    const li = document.createElement("li");
    li.className = "custom-item";
    li.innerHTML = `${escapeHtml(text)} <button type="button" aria-label="删除">×</button>`;
    li.querySelector("button").addEventListener("click", () => {
      customItems = customItems.filter((_, i) => i !== index);
      saveCustom(customItems);
      renderCustomList();
      updatePoolHint();
    });
    customList.appendChild(li);
  });
}

function buildPool() {
  const pool = [];
  for (const [name, items] of Object.entries(DEFAULT_POOLS)) {
    if (!disabledCats.has(name)) pool.push(...items);
  }
  pool.push(...customItems);
  return pool;
}

function updatePoolHint() {
  const pool = buildPool();
  const n = pool.length;
  if (n === 0) {
    poolHint.textContent = "当前没有候选：请至少勾选一个类别或添加「我的加菜」。";
    decideBtn.disabled = true;
  } else {
    poolHint.textContent = `共 ${n} 个候选，准备好了就点按钮。`;
    decideBtn.disabled = false;
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let shuffleTimer = null;

function showResult(text, shuffling) {
  resultEl.innerHTML = "";
  const inner = document.createElement("div");
  inner.className = "result-inner" + (shuffling ? " shuffling" : "");
  inner.textContent = text;
  resultEl.appendChild(inner);
}

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = customInput.value.trim();
  if (!v) return;
  if (customItems.includes(v)) {
    customInput.value = "";
    return;
  }
  customItems.push(v);
  saveCustom(customItems);
  customInput.value = "";
  renderCustomList();
  updatePoolHint();
});

decideBtn.addEventListener("click", () => {
  const pool = buildPool();
  if (pool.length === 0) return;

  if (shuffleTimer) clearInterval(shuffleTimer);
  decideBtn.disabled = true;

  let ticks = 0;
  const maxTicks = 18 + Math.floor(Math.random() * 8);
  shuffleTimer = setInterval(() => {
    showResult(pickRandom(pool), true);
    ticks++;
    if (ticks >= maxTicks) {
      clearInterval(shuffleTimer);
      shuffleTimer = null;
      const finalPick = pickRandom(pool);
      showResult(finalPick, false);
      decideBtn.disabled = pool.length === 0;
    }
  }, 55);
});

resetBtn.addEventListener("click", () => {
  disabledCats = new Set();
  saveDisabledCats(disabledCats);
  renderCategories();
  updatePoolHint();
});

renderCategories();
renderCustomList();
updatePoolHint();
showResult("——", false);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}