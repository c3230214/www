# マイ図鑑 — ソースの読み方

HTML・CSS・JavaScript・SQLiteをつなぐ、ブラウザだけで動く教材です。
すべてのサンプル作品・場所は架空です。カバーのSVGはこの教材用のオリジナル素材です。

## 開き方

1. `github-ready` フォルダ全体をPCに保存します。
2. Chrome / Edgeで `https://vscode.dev` を開き、「フォルダーを開く」で全体を開きます。
3. 自分の `students/sXX/` のファイルだけを編集し、Ctrl + Sで保存します。
4. エクスプローラーで自分の `index.html` をダブルクリックすると実行できます。
5. 編集後はブラウザの再読み込みで確認します。ターミナル・npm・Pythonは不要です。

`students/sXX/` だけを抜き出すと、共通の `assets/vendor/sql-asm.js` がなくなり動きません。
全体のフォルダ構成を保ってください。

## ファイルの役割

| ファイル | 役割 | 授業で変更するところ |
|---|---|---|
| index.html | 画面とフォーム | collection-title / collection-subtitle |
| css/style.css | 色・余白・カードの形 | :rootの --accent / --card-radius |
| js/app.js | 操作と表示をつなぐ | 冒頭の formatRating(rating) |
| js/db.js | SQLiteの準備・登録・検索・保存 | 共通部品として利用 |
| data/collection-data.js | 初めて開いたときの公開データ | アプリの書き出し機能で作成 |
| sql/schema.sql | itemsテーブルの定義 | db.jsの初期化SQLと同じ内容を確認 |
| sql/lesson02.sql | 基本SQLの実行例 | SQL実験室で読み込む・1つずつ実行する |
| sql/challenges.sql | 集計などの発展例 | SQL実験室で読み込む |
| assets/*.svg | 6種類のオリジナルカバー | 必須の編集なし |

## 授業で扱う変更

- HTMLでは、h1の文字と説明を自分のコレクションに合わせます。
- CSSでは、`:root` の `--accent: #5b4ee6;` と `--card-radius: 16px;` を変えます。
- JavaScriptでは、`return rating + ' / 5';` を
  `return '★'.repeat(rating) + '☆'.repeat(5 - rating);` に変更します。
- SQLでは、`SELECT title, category, rating FROM items WHERE rating >= 4;` などを実行します。

## データが動く流れ

フォーム → app.jsが入力を受け取る → db.jsがパラメータ付きSQLを実行
→ ブラウザ内のSQLiteに追加 → app.jsがSELECT結果をカードに描画。

SQL実験室は別のSQLiteコピーを操作します。INSERT・UPDATE・DELETEを練習しても
コレクション本体は変わりません。「練習DBを戻す」で本体の現在の状態からコピーし直せます。
複数のSQLをまとめて実行すると上から順に実行します。途中でエラーになった場合、
その前に成功した変更は練習DBに残ります。最初からやり直すときは練習DBを戻してください。

## 3種類の保存を区別する

1. **ソースファイル** — vscode.devでCtrl + S。HTML・CSS・JSなどの変更を保存します。
2. **SQLiteファイル** — アプリで「SQLiteを保存」。登録したデータのバックアップです。
   別のPCでは「SQLiteを読み込む」で復元できます。授業の終わりに必ず保存します。
3. **公開用データ** — 「公開用データを書き出す」で `collection-data.js` を保存し、
   自分の `data/collection-data.js` を同名で置き換えて提出します。

アプリは変更をIndexedDBにも保存しますが、ブラウザの設定・PCの初期化・file://の
保存仕様などで消える場合があります。バックアップファイルの代わりにはしません。
保存キーはURLのフォルダごとに別です。ローカルとGitHub Pages、別PC、別ブラウザは別データです。

## 公開と再読み込み

GitHub Pagesはファイルを配る役割です。SQLiteは見ている人のブラウザ内で動きます。
ブラウザで登録しても、GitHubのファイルや他の人のデータは自動更新されません。
公開用 `collection-data.js` を差し替えたら、初回のブラウザはその内容で始まります。
以前の保存データがあるブラウザでは、必要なSQLiteバックアップを取ってから
「配布データに戻す」を押すと、読み込まれた公開用データが反映されます。
更新直後に古いままの場合はページを再読み込みし、もう一度確認してください。

授業では公開してよい内容だけを登録します。GitHubへ個人情報・認証情報を置きません。
公開されたソースと公開用データは閲覧できます。実サービスのログインや非公開共有DBを
実装したアプリではありません。

## 実装上のポイント

- SQLiteはsql.js v1.13.0（asm.js版）。`.wasm`の取得が不要なのでfile://でも動きます。
- 全依存と素材を同梱。アプリ起動時に外部API・CDNへ通信しません。
- SQLの値にはプレースホルダーを使い、表示にはtextContentを使います。
- SQLite読み込みはitemsの列・型に相当する値・範囲を検証し、必要な行を新しいDBへ移します。
- 学習用の読み込み上限は10MB・5,000件。SQL実験室の結果表は先頭200件まで表示します。
- SQL実験室の入力は学習用です。大きな再帰クエリなど、負荷の高いSQLは実行しません。

配布元 `../../assets/vendor/LICENSE` にsql.jsのライセンスを同梱しています。
