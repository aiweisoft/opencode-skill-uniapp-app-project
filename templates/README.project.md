# {{APP_NAME}}

由 opencode 的 skill `uniapp-app-project` 生成的 uni-app 工程（Vue{{VUE}}）。

## 目录说明

| 文件 / 目录 | 作用 |
| --- | --- |
| `manifest.json` | 应用配置：名称、appid、版本号、图标、权限、三方 SDK |
| `pages.json` | 页面路由与窗口样式（`pages` 数组第一项是启动页） |
| `App.vue` | 应用入口组件，只能写应用生命周期和全局样式，不能写 `<template>` |
| `main.js` | 创建 Vue 实例；Vue3 导出 `createApp()`，Vue2 直接 `new Vue` |
| `uni.scss` | 全局 scss 变量 |
| `index.html` | H5 / 编译入口模板（App 端也需要存在，保留即可） |
| `pages/` | 页面，每个页面一个目录，路径必须与 `pages.json` 一致 |
| `static/` | 静态资源，引用时用绝对路径 `/static/xxx.png` |
| `unpackage/` | HBuilderX 编译与打包产物，自动生成，不要手改 |

## 在 HBuilderX 里跑起来 / 打包成 App

1. HBuilderX -> 文件 -> 打开目录，选择本工程根目录。
2. 双击 `manifest.json`，在「基础配置」里点 AppID 一栏的 **重新获取**，
   拿一个 DCloud AppID。云打包必须有 appid，没有它只能浏览器预览。
3. 调试：运行 -> 运行到浏览器，或 运行到手机或模拟器。
4. 打包：发行 -> 原生App-云打包，选 Android / iOS。
   证书可先用「公共测试证书」跑通流程，正式上架要用自有证书。
5. 图标和启动图在 `manifest.json` 的「App图标配置」「App启动界面配置」里生成。
6. 出正式包前记得改 `manifest.json` 的 `versionName` 和 `versionCode`。

## 新增页面

建 `pages/<名字>/<名字>.vue`，并在 `pages.json` 的 `pages` 数组里登记，两步都要做。
