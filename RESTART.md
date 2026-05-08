# yatt — 再起動・引き継ぎメモ

このセッションで行った変更と、次回起動の手順をまとめます。

## 1. 起動方法

```bash
cd /home/yass/yatt3
./start.sh
```

`start.sh` が以下を自動でやります:
- MongoDB の起動確認 (`/home/yass/mongodb/bin/mongod`)、起動していなければ `--fork` で起動
- ポート 3000 が使用中なら既存 `node app.js` を `pkill`
- `node app.js` でアプリ起動

ブラウザ: http://localhost:3000 — 停止は `Ctrl+C`

直接起動したい場合 (Mongo 起動済み前提):
```bash
node app.js   # または npm start
```

## 2. アカウント

- 管理用テストアカウント: **user=`root` / pass=`root`** (DB: `login-testing` の `accounts` コレクション)
- 再作成スクリプト: `node misc/create-root.js`

## 3. このセッションで直したこと

### 3.1 起動・ログインまわり
- **Pug 3 互換化**: 旧 Jade の `"#{message}"` クォート補間を `| #{message}` / `= var` に。属性内の `attr='...#{x}...'` も Pug 3 では補間されないため、全 `.pug` を Python スクリプトで JS 連結 (`attr='...'+x`) に一括変換した。
- **OverwriteModelError**: `account-manager.js` と `records.js` の各メソッド内で繰り返し行っていた `db.model('Accounts'/'Access', schema)` をモジュール先頭の 1 回だけに変更。
- **`img((border=...)` の二重カッコ**: `lecture.pug / lnew.pug / lesson.pug` の 12 箇所を修正。
- **clayout/citem/contents.pug のインデント不整合 / 行末セミコロン** を修正。

### 3.2 機能追加
- **`/edit` の "None" 即遷移化**: 以前はモーダルを挟んでいたのを、ボタン押下で直接 POST `/edit?lecCode=New` に。
- **`lecture.pug` の "New" 分岐**: textarea+モーダル経由をやめ、`<input>`+Create ボタンで直接 POST `/lecture?update=create` に。
- **`/clayout` の項目名インライン編集**: 各 class 項目を `<input class="class-item" id="classI_J">` で表示。`Save names` ボタンで `mclass_I_J` を全フォームに注入し、`router.js` の POST `/clayout` で `newCls.group[i].classes[j].name` を更新。
- **`/lecture` から `/clayout` への直接リンク**: タイトル下に "Edit groups & classes" ボタンを追加。
- **`/citem` GET の自動作成**: Contents が無ければ `REC.newContents` で雛形を作って即編集画面に遷移。
- **`/lecture` GET ルートを追加**: `/edit` の Lectures リストの行から直接ジャンプできるように。
- **Lectures リスト行をクリック可能に**: lecCode/Title をリンク化、各行に `Layout` ボタン追加。
- **新規授業の class 名をユニーク化**: `records.js` の `newClasses` のデフォルト `[None, None, None]` を `[lecCode-1-1, lecCode-2-1, lecCode-3-1]` に変更。

### 3.3 デザイン刷新 (kodama-lab.com 参照)
- `app/public/css/theme.css` を新規作成。Hosei ブルー(#003F8C) + オレンジ(#F08300) のスクールカラー、Inter / Klee One フォント、ぼかしオーブ背景 + グリッドオーバーレイ、glass topbar、accent ボーダーカード等。
- `layout.pug` / `layout2.pug` に Google Fonts、`theme.css`、`.yatt-grid`、`nav.yatt-topbar` を追加。

### 3.4 安全側修正
- `findLecture` / POST `/lecture` で **Contents コレクションが空のときに 404 になる** バグを撤去。空でも cnts を組み立ててレンダする。
- `lecture.pug` で `cnts[ii]` が undefined になっても落ちないようフォールバックを追加。

## 4. 既知の制約・次回やると良いこと

1. **古い MATH002/003/004 の class 名が "None" のまま** で全部同じ `/citem?p=None` を共有してしまう → `/clayout` で個別にリネーム推奨。
2. **項目を一括 N 個作る機能なし** (例: 14 回分作るには citem 複製ボタンを 11 回押す)。テンプレ生成ボタンを足すと便利。
3. **citem.pug の Pages モード(`sign=2`)** は 7×6 グリッドの削除ボタンしかない。clayout のようにインライン編集 UI を入れると一貫する。
4. **ログイン画面にも navbar が出る** (機能上は問題ないが見た目が気になるなら login 専用 layout に分離)。
5. **モーダル内の textarea→hidden input の値転写** は古い jQuery 1.8.1 の `.attr('value', x)` で動いている。jQuery アップグレード時は `.val(x)` に置き換えること。
6. **Mongoose deprecation 警告**: `Model.update` / `Model.remove` が deprecation。Mongoose 7 へ上げると壊れるので、`updateOne` / `deleteOne` への置き換えが必要。
7. `app/server/views/` には `*.jade`、`*.jade~`、`#edit.jade#` など使われていない/壊れたファイルが残っている。view engine は `pug` (config.js:12) なので参照されないが掃除推奨。

## 5. 重要なファイル位置

| 役割 | パス |
|---|---|
| エントリポイント | `app.js` |
| ルーティング | `app/server/router.js` |
| 設定 | `app/config.js` |
| 認証ロジック | `app/server/modules/account-manager.js` (DB: `login-testing`) |
| 講義データ | `app/server/modules/records.js` (DB: `yatt`) |
| Pug ビュー | `app/server/views/*.pug` |
| 共通レイアウト | `app/server/views/layout.pug` / `layout2.pug` |
| メールルーティング | `app/server/modules/email-dispatcher.js` |
| カスタム CSS | `app/public/css/theme.css` (新規) / `app/public/css/style.css` |
| クライアント JS | `app/public/js/views/*.js` (login.js, clayout.js が要) |
| 起動スクリプト | `start.sh` |
| ルート再作成 | `misc/create-root.js` |

## 6. データベース

- 認証: `mongodb://127.0.0.1/login-testing` の `accounts`
- 授業データ: `mongodb://127.0.0.1/yatt` の `lectures` / `classes` / `contents` / `access`

## 7. デバッグ Tips

- Pug コンパイルチェック:
  ```bash
  node -e "const pug=require('pug'); pug.compileFile('app/server/views/lecture.pug')"
  ```
- 全 Pug を一括チェック:
  ```bash
  node -e "
  const pug=require('pug'),fs=require('fs');
  fs.readdirSync('app/server/views').filter(f=>f.endsWith('.pug'))
    .forEach(f=>{try{pug.compileFile('app/server/views/'+f);console.log(f,'OK')}
    catch(e){console.log(f,e.message.split('\n')[0])}});
  "
  ```
- DB スナップショット:
  ```bash
  node -e "
  const m=require('mongoose');
  const c=m.createConnection('mongodb://127.0.0.1/yatt');
  const C=c.model('Classes', new m.Schema({},{strict:false}));
  C.find({}).then(d=>{console.log(d.length,'docs');d.forEach(x=>console.log(x.lecCode,x.title));c.close();});
  "
  ```

## 8. 次セッション開始時の初手 (おすすめ)

1. `git status` で前回の変更を確認 (このリポジトリの作業ツリーは未コミット差分が多数)
2. `./start.sh` を実行し http://localhost:3000 にアクセス、`root/root` でログイン
3. `/edit` → 既存セルを押すか None で新規作成 → `/clayout` で項目名整理 → 講義項目クリックで citem 編集、と一通り動作確認
4. 何か挙動がおかしければ最初に **Pug 全件コンパイル** + サーバログを確認
