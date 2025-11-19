// ------------------------------
// 1. 在庫データ（JSON的な構造）
// ------------------------------
const items = [
  { id: "D001", name: "オレンジジュース", price: 150, stock: 20, minStock: 5 },
  { id: "D002", name: "コーラ",           price: 150, stock: 12, minStock: 5 },
  { id: "D003", name: "お茶",             price: 120, stock: 30, minStock: 10 }
];

// HTML で <tbody id="item-list"> と書いた部分を JavaScript から取得する
const tbody = document.getElementById("item-list");

// ------------------------------
// 2. 表示用の関数 render()
// ------------------------------
function render() {
  // 一度、中身を空にしてから作り直す
  tbody.innerHTML = "";

  // items の中身を 1件ずつ取り出して tr（行）を作る
  items.forEach(item => {
    const tr = document.createElement("tr");

    // 在庫が少ないときはクラスを追加して背景色を変える
    if (item.stock < item.minStock) {
      tr.classList.add("low-stock");
    }

    // 行の中身（セル）をテンプレート文字列でまとめて書く
    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.price}</td>
      <td>${item.stock}</td>
      <td>
        <button onclick="changeStock('${item.id}', 1)">＋</button>
        <button onclick="changeStock('${item.id}', -1)">−</button>
      </td>
    `;

    // 作った tr を tbody の中に追加する
    tbody.appendChild(tr);
  });
}

// ------------------------------
// 3. 在庫を変更する関数 changeStock()
// ------------------------------
function changeStock(id, diff) {
  // id が一致する商品を探す
  const item = items.find(i => i.id === id);
  if (!item) {
    return; // 見つからなかったら何もしない
  }

  // diff 分だけ在庫数を増減させる
  item.stock += diff;
  // 在庫がマイナスにならないように 0 で止める
  if (item.stock < 0) {
    item.stock = 0;
  }

  // 変更を画面に反映する
  render();
}
// ページを開いたときに、1回だけ表示する
render();
