# github_three：放靜態頁的 GitHub Pages

用來放 three.js 導覽、展示頁這類純靜態檔案，取代原本的 Netlify。不限哪個案子。

- repo：github.com/BensonAlphacore/github_three（**公開**；免費帳號的 Pages 只能開在公開 repo）
- 網址：https://bensonalphacore.github.io/github_three/
- 推到 `main` 就會自動上線，大約 1 分鐘。

## 結構

```
index.html      目錄頁，一頁一行連結
.nojekyll       讓 GitHub 不經 Jekyll 處理，檔案原樣放出去
house-2f/       一頁一個子資料夾：index.html＋它要用的檔案（glb、圖片…）
```

只放「做好的成品」。原始檔、產生成品的腳本留在各自的專案，例如 house-2f 的來源是 `~/Documents/sketchup/house/render/web/`，由 `render_night.py -- web 2F` 產出。

## 新增或更新一頁

1. 開子資料夾（英文小寫加連字號，例如 `house-1f/`），放 `index.html` 和它要用的檔案。
2. 在根目錄的 `index.html` 的 `<ul>` 裡加一行 `<li><a href="資料夾/">…</a></li>`。
3. commit、push 到 `main`。commit message 照使用者的規則：一行寫得完就一行，不加 AI 署名。
4. 確認上線：
   - `gh api repos/BensonAlphacore/github_three/pages --jq .status` 等到 `built`
   - 對每個檔案 `curl` 都要回 200
   - 用 chrome-devtool 開頁面截圖，確認內容真的有出來

## 寫頁面要注意

- 網站放在 `/github_three/` 底下，所有路徑都用**相對路徑**（`2F.glb`、`../`），不要用 `/` 開頭。
- `index.html` 要是完整的 HTML，`<meta charset="utf-8">` 一定要有，不然中文會變亂碼，程式裡比對中文名稱也會失敗。
- 外部函式庫要寫死版本號（例如 three@0.160.0 走 jsDelivr 的 importmap）。
- 檔案大小：單一檔案不能超過 100MB，整站不能超過 1GB，每月流量約 100GB。glb 的貼圖用 JPEG 壓。
- **repo 是公開的**：任何人都能看到原始檔和下載模型。不要放密碼、token、個資、客戶資料。

## 工具

- `gh` 在 `/opt/homebrew/bin/gh`，Bash 工具的 PATH 裡沒有，要寫絕對路徑或先 `export PATH=/opt/homebrew/bin:$PATH`。已經登入 BensonAlphacore。
- git 走 SSH（`git@github.com:BensonAlphacore/github_three.git`）。
- 如果 `gh` 登入失效，跑 `gh auth login --web` 拿一次性代碼，請使用者在**自己平常用的瀏覽器**授權。base Chrome 沒有登入 GitHub。
