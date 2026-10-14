/* SQLiteの準備と保存を担当する共通部品です。Lesson 02では app.js の
   formatRating と SQL実験室を編集します。このファイルは変更不要です。 */
'use strict';

window.CollectionDB = (() => {
  // sql/schema.sql と同じテーブル定義です。
  const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  note TEXT NOT NULL DEFAULT '',
  cover TEXT NOT NULL DEFAULT 'book'
);`;
  const COVERS = ['game', 'music', 'book', 'camera', 'nature', 'space'];
  const COLUMNS = ['id', 'title', 'category', 'rating', 'note', 'cover'];
  let SQL;

  function validateItem(item) {
    const title = String(item.title ?? '').trim();
    const category = String(item.category ?? '').trim();
    const rating = Number(item.rating);
    const note = String(item.note ?? '').trim();
    const cover = String(item.cover ?? 'book');
    if (!title || title.length > 80) throw new Error('タイトルは1〜80文字で入力してください。');
    if (!category || category.length > 30) throw new Error('分類は1〜30文字で入力してください。');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('おすすめ度は1〜5の整数です。');
    if (note.length > 500) throw new Error('メモは500文字までです。');
    if (!COVERS.includes(cover)) throw new Error('カバーの種類が正しくありません。');
    return { title, category, rating, note, cover };
  }

  function createDatabase(items) {
    if (!Array.isArray(items)) throw new Error('collection-data.js のデータを確認してください。');
    const db = new SQL.Database();
    try {
      db.run(SCHEMA_SQL);
      const insert = db.prepare('INSERT INTO items (title, category, rating, note, cover) VALUES (?, ?, ?, ?, ?)');
      try { items.forEach(item => { const value = validateItem(item); insert.run(Object.values(value)); }); }
      finally { insert.free(); }
      return db;
    } catch (error) { db.close(); throw error; }
  }

  function query(db, sql, parameters = []) {
    const statement = db.prepare(sql);
    const rows = [];
    try {
      statement.bind(parameters);
      while (statement.step()) rows.push(statement.getAsObject());
    } finally { statement.free(); }
    return rows;
  }

  function validatedImport(bytes) {
    let source;
    let clean;
    try {
      source = new SQL.Database(new Uint8Array(bytes));
      const columns = query(source, 'PRAGMA table_info(items)').map(row => row.name);
      if (!COLUMNS.every(column => columns.includes(column))) throw new Error('itemsテーブルの列が一致しません。');
      const rows = query(source, 'SELECT id, title, category, rating, note, cover FROM items ORDER BY id');
      if (rows.length > 5000) throw new Error('この教材では5,000件まで読み込めます。');
      clean = createDatabase([]);
      const ids = new Set();
      for (const row of rows) {
        const item = validateItem(row);
        const id = Number(row.id);
        if (!Number.isSafeInteger(id) || id < 1 || ids.has(id)) throw new Error('IDの形式が正しくありません。');
        ids.add(id);
        clean.run('INSERT INTO items (id, title, category, rating, note, cover) VALUES (?, ?, ?, ?, ?, ?)', [id, ...Object.values(item)]);
      }
      return clean;
    } catch (error) {
      if (clean) clean.close();
      throw new Error('このアプリのSQLiteファイルを選んでください。 ' + error.message);
    } finally { if (source) source.close(); }
  }

  // フォルダごとに別のキーにし、s01とs02のデータを混ぜません。
  const storageKey = 'collection-v1:' + location.origin + location.pathname.replace(/[^/]*$/, '');
  function browserStorage(mode, value) {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('ブラウザ保存が使えません。')); return; }
      const open = indexedDB.open('my-collection-class-v1', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('collections');
      open.onerror = () => reject(open.error || new Error('ブラウザ保存を開けません。'));
      open.onblocked = () => reject(new Error('別タブが保存領域を利用しています。'));
      open.onsuccess = () => {
        const connection = open.result;
        const tx = connection.transaction('collections', mode === 'read' ? 'readonly' : 'readwrite');
        const store = tx.objectStore('collections');
        const request = mode === 'read' ? store.get(storageKey) : store.put(value, storageKey);
        let result;
        request.onsuccess = () => { result = request.result; };
        tx.oncomplete = () => { connection.close(); resolve(result); };
        tx.onerror = () => { connection.close(); reject(tx.error || new Error('ブラウザ保存に失敗しました。')); };
        tx.onabort = () => { connection.close(); reject(tx.error || new Error('保存処理が中止されました。')); };
      };
    });
  }

  class Store {
    constructor(db) { this.db = db; }
    all() { return query(this.db, 'SELECT * FROM items ORDER BY id ASC'); }
    search(text, category, sort) {
      let sql = 'SELECT * FROM items WHERE (title LIKE ? OR note LIKE ?)';
      const values = ['%' + text + '%', '%' + text + '%'];
      if (category) { sql += ' AND category = ?'; values.push(category); }
      const orders = { newest: 'id DESC', rating: 'rating DESC, id DESC', title: 'title ASC, id ASC' };
      sql += ' ORDER BY ' + (orders[sort] || orders.newest);
      return query(this.db, sql, values);
    }
    categories() { return query(this.db, 'SELECT DISTINCT category FROM items ORDER BY category').map(row => row.category); }
    get(id) { return query(this.db, 'SELECT * FROM items WHERE id = ?', [id])[0]; }
    add(raw) {
      const item = validateItem(raw);
      this.db.run('INSERT INTO items (title, category, rating, note, cover) VALUES (?, ?, ?, ?, ?)', Object.values(item));
    }
    update(id, raw) {
      const item = validateItem(raw);
      this.db.run('UPDATE items SET title = ?, category = ?, rating = ?, note = ?, cover = ? WHERE id = ?', [...Object.values(item), id]);
    }
    remove(id) { this.db.run('DELETE FROM items WHERE id = ?', [id]); }
    export() { return this.db.export(); }
    async persist() { await browserStorage('write', this.export()); }
    replace(next) { const previous = this.db; this.db = next; previous.close(); }
  }

  async function open(seed) {
    SQL = await initSqlJs();
    let db, restored = false, warning = '';
    try {
      const bytes = await browserStorage('read');
      if (bytes) { db = validatedImport(bytes); restored = true; }
    } catch (error) { warning = '保存データを復元できなかったため、配布データで開始しました。SQLiteファイルがあれば読み込んでください。'; }
    if (!db) db = createDatabase(seed);
    return { store: new Store(db), restored, warning };
  }

  return { open, createDatabase, validatedImport, validateItem, SCHEMA_SQL, clone: db => new SQL.Database(db.export()) };
})();
