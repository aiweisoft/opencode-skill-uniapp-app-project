# 在 HBuilderX 里运行并打包成 App

来源：<https://uniapp.dcloud.net.cn/quickstart-hx.html>、<https://uniapp.dcloud.net.cn/collocation/manifest.html>、
<https://hx.dcloud.net.cn/cli/pack>

## 0. 前提

- 安装 HBuilderX（<https://www.dcloud.io/hbuilderx.html>），App 开发建议用 **App 开发版**。
- 真机调试：手机开启 USB 调试并在弹窗里允许本机调试。

## 1. 打开工程

HBuilderX -> 文件 -> 打开目录 -> 选中工程根目录（含 `manifest.json` 的那一层）。
打开后左侧应显示 `pages/`、`static/`、`App.vue`、`manifest.json`、`pages.json`。

## 2. 先拿到 DCloud AppID（云打包的必要条件）

双击 `manifest.json`，在**基础配置**里点 AppID 一栏的 **重新获取**（需登录 DCloud 账号）。
拿到形如 `__UNI__A1B2C3D` 的 appid 后，HBuilderX 会写回 `manifest.json`。

- 这是 **DCloud 的 appid**，用于云打包、uniPush、uni统计等，和微信小程序 appid、iOS Bundle ID 不是一回事。
- 没有 appid 时：仍然可以 `运行到浏览器` 预览，但 `发行 -> 原生App-云打包` 会失败。
- 也可以用 `opencode` 生成时直接传入已有 appid（脚本的 `-AppId __UNI__XXXXXXX`）。

## 3. 调试运行

- 浏览器：运行 -> 运行到浏览器 -> 选一个浏览器。
- 真机：运行 -> 运行到手机或模拟器 -> 选择设备。
- iOS 真机需要“自定义基座”（运行 -> 运行到手机或模拟器 -> 制作自定义调试基座）。
- 小程序：运行 -> 运行到小程序模拟器（需先在“运行设置”里配置对应开发者工具路径，
  微信开发者工具还要在 设置 -> 安全 里打开服务端口）。

## 4. 打包成原生 App

发行 -> **原生App-云打包**，在弹窗里：

1. 选择平台：Android / iOS（可同时勾选）。
2. Android 证书：先用 **公共测试证书** 验证流程；正式上架要用自有证书
   （`keytool` 生成 keystore 并填写别名/密码）。
3. iOS：需 Apple 开发者证书 + 描述文件（`.p12` + `.mobileprovision`），
   或使用 HBuilderX 的证书管理托管。
4. 勾选“安心打包”可不上传源码和证书，通过差量包方式打包。
5. 点“打包”，产物在控制台给出的下载链接 / `unpackage/` 下。

打包前必须检查：

- `manifest.json` 的 `versionName`（如 `1.0.0`）与 `versionCode`（整数，每次发包 +1）。
- App 图标：manifest.json -> **App图标配置**，上传一张 1024x1024 png，一键生成各尺寸。
- 启动图：manifest.json -> **App启动界面配置**。不配也可以（会用图标代替），
  但 iOS 若不配大屏启动图可能被判为“未适配”而出现黑边。
- 用到的原生能力要在 manifest.json 的 **App模块配置** 里勾选
  （Maps/OAuth/Payment/Push/Share/VideoPlayer 等），否则相关 API 调不通。
- 三方 SDK（微信登录、支付、地图等）在 **App SDK配置** 里填 key，**仅云打包生效**。

## 5. 离线打包（可选）

发行 -> 原生App-本地打包 -> 生成本地打包App资源，再用 Android Studio / Xcode +
原生工程模板打包：<https://nativesupport.dcloud.net.cn/AppDocs/README>

## 6. 其他平台（了解即可）

- H5：发行 -> 网站-PC Web或手机H5，产物在 `unpackage/dist/build/h5`。
  子路径部署要在 manifest.json -> H5配置 里设置“运行的基础路径”。
- 微信小程序：发行 -> 小程序-微信，产物在 `unpackage/dist/build/mp-weixin`，
  用微信开发者工具导入并上传。

## 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 打开目录后 HBuilderX 不识别为 uni-app 工程 | 根目录没有 `manifest.json`，或文件不在根层 |
| 打包提示“没有 appid” | 见第 2 步，重新获取 AppID |
| 启动白屏 | `manifest.json` 的 `vueVersion` 与 `main.js` 写法不匹配；或首页路径不在 `pages.json` 第一项 |
| `manifest.json` / `pages.json` 报语法错误 | 文件带 BOM，或注释/尾逗号让 JSON 非法 |
| 手机连不上 | 换 USB 口/线，重新授权调试，或参考 <https://uniapp.dcloud.net.cn/tutorial/run/run-app-faq.html> |
| 某个原生 API 在 App 里无效 | 对应模块没在 manifest.json 里勾选 |
