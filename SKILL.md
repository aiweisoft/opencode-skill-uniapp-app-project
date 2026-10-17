---
name: uni-app 工程脚手架
description: 在本地生成一个完整、最小可运行、可直接用 HBuilderX 打开并发行云打包成原生 App 的 uni-app 工程（Vue3 或 Vue2），包含 manifest.json、pages.json、App.vue、main.js、uni.scss、index.html、pages/ 首页与 static/ 资源。当用户要求新建/初始化/搭建 uni-app 工程、创建 HBuilderX 项目、生成能打包成 App 的 uni-app 目录结构，或询问 uni-app 工程应该包含哪些文件和配置时使用。
---

# uni-app 工程脚手架（HBuilderX 可打包）

生成的是 **HBuilderX 工程**（工程根目录即源码目录，不需要 npm 安装），
用户可以立刻在 HBuilderX 里改代码，然后 `发行 -> 原生App-云打包` 出 Apk/Ipa。

## 何时用

- 用户要“新建一个 uni-app 项目 / 工程”“搭个 uni-app 脚手架”。
- 用户想用 HBuilderX 开发并打包成 App，需要一份能直接被 HBuilderX 识别的目录结构。
- 用户已有空目录，想补齐 `manifest.json`、`pages.json` 等必需文件。

如果用户要的是 **CLI / npm 工程**（`package.json` + `vite.config.js` + `src/`）或
**uni-app x（`main.uts` / `.uvue`）**，不要用本 skill 的模板，先说明差异并确认。

## 工作流

### 1. 收集参数

尽量一次问清，其余用默认值：

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| 项目名 | 必填 | 同时作为目录名和默认 App 名称；建议小写、无空格 |
| 目标目录 | `./<项目名>` | 用户指定路径时用绝对路径 |
| Vue 版本 | `3` | HBuilderX 4.x 新建工程的默认值。只有用户明确要 Vue2 才传 `2` |
| App 名称 | 同项目名 | 桌面显示名，可以中文 |
| AppID | 空 | 用户已有 DCloud AppID（`__UNI__XXXXXXX`）时传入；否则留空并在第 4 步提醒 |

### 2. 生成工程

Windows 上用 PowerShell 跑脚手架：

```powershell
& "<skill目录>/scripts/create-uniapp.ps1" -Name myapp -Target "D:\code\myapp" -Vue 3
```

- `<skill目录>` 就是本 SKILL.md 所在目录，脚本会自动定位同级的 `templates/`。
- 常用参数：`-AppName "我的应用"`、`-AppId __UNI__XXXXXXX`、`-Vue 2`、`-Force`。
- 目标目录非空时会报错，需要 `-Force` 才继续（同名文件会被覆盖）。

脚本做不到时（非 Windows、或用户要往已有工程里补文件），**手动复制**：
把 `templates/vue3/`（或 `templates/vue2/`）里的内容原样复制到目标目录，
再把 `manifest.json` 里第一处 `"name" : ""` 和 `"appid" : ""` 填上。
复制或改写 `manifest.json`、`pages.json` 时必须保证 **UTF-8 无 BOM**。

### 3. 自检

生成后检查：

- 根目录有 `manifest.json`、`pages.json`、`App.vue`、`main.js`、`index.html`、`uni.scss`。
- `pages/index/index.vue` 存在，且 `pages.json` 的 `pages[0].path` 正好是 `pages/index/index`。
- `static/logo.png` 存在（首页引用了它）。
- Vue3 模板的 `manifest.json` 里有 `"vueVersion" : "3"`，`main.js` 用的是 `createSSRApp` + `export function createApp()`；
  若用户改成 Vue2，这两处必须同时改（去掉 `vueVersion`，`main.js` 换成 `new Vue({...App})`）。
- 两个 json 文件没有 BOM（开头直接是 `{`）。

### 4. 交回用户 + 说明 HBuilderX 步骤

告诉用户：工程路径、Vue 版本、以及下面这套动作（细节见 `references/hbuilderx-app-build.md`）：

1. HBuilderX -> 文件 -> 打开目录 -> 选工程根目录。
2. 双击 `manifest.json` -> 基础配置 -> 点 **重新获取** 拿 DCloud AppID（**云打包必需**）。
3. 调试：运行 -> 运行到浏览器 / 运行到手机或模拟器。
4. 打包：发行 -> 原生App-云打包，选 Android/iOS；证书可先用“公共测试证书”试通流程。
5. 出正式包前改 `versionName` / `versionCode`，并在 manifest.json 里配好图标、启动图、App 模块。

## 加页面 / 改配置的后续动作

- **新增页面**：建 `pages/<name>/<name>.vue`，并在 `pages.json` 的 `pages` 数组里登记；不要只加文件。
- **改 App 名称/版本/权限/图标**：都在 `manifest.json`。字段含义见 `references/manifest-app.md`。
- **多端差异**：用条件编译 `// #ifdef APP-PLUS` / `// #ifdef H5` / `// #ifdef MP-WEIXIN`，
  `VUE3` 宏依赖 `manifest.json` 的 `vueVersion`。
- **静态资源**：放 `static/`，引用用绝对路径 `/static/xxx.png`。

## 不要做

- 不要在 HBuilderX 工程里顺手加 `package.json` + `vite.config.js` + `src/`——
  那是 CLI 工程结构，会改变 HBuilderX 的编译方式。
- 不要写带 BOM 的 `manifest.json` / `pages.json`。
- 不要自己伪造 `appid`；必须是 DCloud 分配的 `__UNI__XXXXXXX`，否则云打包失败。
- 不要把 `unpackage/` 当源码改，它是编译产物。

## 参考文件

- `references/project-structure.md` —— 目录结构、每个文件的作用、Vue2/Vue3 判定、编码约束。
- `references/manifest-app.md` —— manifest.json 里与打包 App 相关的字段。
- `references/hbuilderx-app-build.md` —— 在 HBuilderX 里运行、配证书、云打包、常见问题。
- `references/sources.md` —— 以上内容的官方文档出处。
- `templates/vue3/`、`templates/vue2/` —— 可直接复制的完整工程模板。
