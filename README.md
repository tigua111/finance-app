# 日日理財 Android 第一版原型

這是一個可直接在手機尺寸瀏覽器執行的理財 App 原型，之後可包成 Android WebView / Capacitor App。

## 功能

- 第一次打開會要求輸入名字與目前存款
- 首頁可輸入今日金額
- 可切換「花費」或「收入」
- 新增後即時更新目前總資產
- 記帳頁會顯示所有收入與支出紀錄
- 資料會保存在瀏覽器本機 `localStorage`

## 開啟方式

直接打開 `index.html` 即可預覽。

若要做成 Android APK，建議下一步用 Capacitor 或 Android Studio WebView 包裝這個資料夾。
