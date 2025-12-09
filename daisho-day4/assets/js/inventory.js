// ▼ 在庫データ（デフォルト値：localStorageに何もないとき用）
 let items = [
  { id: "D001", name: "オレンジジュース", price: 150, stock: 20, minStock: 5 },
  { id: "D002", name: "コーラ",           price: 150, stock: 12, minStock: 5 },
  { id: "D003", name: "お茶",             price: 120, stock: 30, minStock: 10 }
];

// ▼ localStorage に保存する際のキー名（引き出しのラベル）
const STORAGE_KEY = "inventory-items";

// --- localStorage から在庫データを読み込む ---
function loadFromStorage() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return; // まだ保存されていないときは何もしない

  try {
    const saved = JSON.parse(json); // JSON文字列 → 配列に戻す
    if (Array.isArray(saved)) {
      items = saved;
    }
  } catch (e) {
    console.error("在庫データの読み込みに失敗しました", e);
  }
}

// --- localStorage に在庫データを保存 ---
function saveToStorage() {
  const json = JSON.stringify(items); // 配列 → JSON文字列
  localStorage.setItem(STORAGE_KEY, json);
  console.log("在庫データを保存しました");
}

function render() {
  const tbody = document.getElementById("item-list");
  if (!tbody) return;

  tbody.innerHTML = "";

  items.forEach(item => {
    const tr = document.createElement("tr");

    // 在庫が minStock より少なければ警告クラスを付与
    if (item.stock < item.minStock) {
      tr.classList.add("low-stock");
    }

    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.price}</td>
      <td>${item.stock}</td>
      <td>
        <button type="button" onclick="changeStock('${item.id}', 1)">＋</button>
        <button type="button" onclick="changeStock('${item.id}', -1)">−</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function changeStock(id, diff) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  item.stock += diff;
  if (item.stock < 0) item.stock = 0;

  saveToStorage();
  render();
}

// --- 在庫一覧をテキスト（CSV風）に整形 ---
function buildInventoryText() {
  const lines = [];
  // 見出し
  lines.push("ID,商品名,価格,在庫数,警告");

  items.forEach(item => {
    const warning = item.stock < item.minStock ? "在庫少" : "";
    lines.push(
      `${item.id},${item.name},${item.price},${item.stock},${warning}`
    );
  });

  return lines.join("\n");
}

function sendInventoryMailViaStaticForms() {
  const form = document.getElementById("inventory-mail-form");
  const textarea = document.getElementById("inventory-message");

  if (!form || !textarea) {
    alert("メールフォームの設定が正しくありません。index.html を確認してください。");
    return;
  }

  // 在庫一覧テキストを作成してフォームにセット
  const bodyText = buildInventoryText();
  textarea.value = bodyText;

  if (confirm("現在の在庫一覧をメールで送信します。よろしいですか？")) {
    form.submit();
  }
}

// --- ページ読み込み時の初期化 ---
window.addEventListener("DOMContentLoaded", () => {
  // 1. localStorage から在庫を読み込み
  loadFromStorage();

  // 2. 画面に反映
  render();

  // 3. ボタンにイベントをつなぐ
  const saveBtn = document.getElementById("save-btn");
  const mailBtn = document.getElementById("mail-btn");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveToStorage();
      alert("在庫データを保存しました。");
    });
  }

  if (mailBtn) {
    mailBtn.addEventListener("click", sendInventoryMailViaStaticForms);
  }
});
