-- Lesson 02：配布資料 p3〜p4 に対応するSQL例
-- 実行先：アプリの「SQL実験室」（本体とは別の練習DB）
-- 配布資料の各設問と対応。必要な文だけをコピーして1文ずつ実行できます。
-- このファイルを一括実行しても、練習用に追加した行は最後に削除されます。

-- 配布資料 p3 / A1：タイトル・分類・おすすめ度を表示
SELECT title, category, rating FROM items;

-- 配布資料 p3 / A2：おすすめ度4以上
SELECT title, rating FROM items WHERE rating >= 4;

-- 配布資料 p3 / A3：おすすめ度の高い順、同じ値ならタイトル順
SELECT title, rating FROM items
WHERE rating >= 4
ORDER BY rating DESC, title ASC;

-- 配布資料 p3 / 発展：ゲームのうち、おすすめ度4以上
SELECT title, rating FROM items
WHERE category = 'ゲーム' AND rating >= 4
ORDER BY rating DESC, title ASC;

-- 配布資料 p4 / B1：練習作品を1件だけ追加
INSERT INTO items (title, category, rating, note, cover)
VALUES ('SQL練習作品', '練習', 3, 'あとで消す', 'book');

-- 配布資料 p4 / B2：追加した行のIDを確認
SELECT id, title, rating FROM items WHERE title = 'SQL練習作品';

-- 配布資料では、確認した実際のID（例：7）をWHEREに入力します。
-- 以下は一括実行の誤更新を防ぐため、直前に追加したIDを
-- last_insert_rowid()で参照します。これは一括実行用の補助で、必須学習ではありません。
-- 以下を続けて実行する間には、別のINSERTを行わないでください。

-- 配布資料 p4 / B3：その行だけを5へ変更
-- 授業での書き方：UPDATE items SET rating = 5 WHERE id = 7;
UPDATE items SET rating = 5 WHERE id = last_insert_rowid();

-- おすすめ度が5になったか確認
SELECT id, title, rating FROM items WHERE id = last_insert_rowid();

-- 配布資料 p4 / B4：その行だけを削除
-- 授業での書き方：DELETE FROM items WHERE id = 7;
DELETE FROM items WHERE id = last_insert_rowid();

-- 0行になっていれば削除完了
SELECT id, title, rating FROM items WHERE id = last_insert_rowid();
