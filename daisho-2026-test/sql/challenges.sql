-- 発展演習：下のSQLを1つずつ実行して、結果の意味を考えよう。
-- 分類や件数は、各自が登録した内容によって変わります。

-- A. メモに「架空」を含むデータを探す
SELECT title, note FROM items WHERE note LIKE '%架空%';

-- B. 分類ごとの件数を数える
SELECT category, COUNT(*) AS count FROM items GROUP BY category ORDER BY count DESC;

-- C. おすすめ度の平均を求める
SELECT ROUND(AVG(rating), 1) AS average_rating FROM items;

-- D. おすすめ度が高い上位3件を表示する
SELECT title, rating FROM items ORDER BY rating DESC, id ASC LIMIT 3;

-- E. 画面の編集ボタンが行う処理を、練習用DBで試す
-- SELECTでIDを確認してから、以下の例のID「1」を変更してください。
SELECT id, title, category, rating FROM items;
-- UPDATE items SET note = 'おすすめの理由を追記しました。' WHERE id = 1;
-- SELECT * FROM items WHERE id = 1;
