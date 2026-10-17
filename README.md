# opencode-skill-uniapp-app-project

一个 [opencode](https://opencode.ai) **skill**：一键生成完整、最小可运行、**可直接用 HBuilderX 打开并发行云打包成原生 App** 的 uni-app 工程（Vue3 / Vue2）。

## 它解决什么问题

用 HBuilderX 新建 uni-app 工程是一条路，但如果你想用 AI / 脚本批量起工程，手写这套文件很容易踩坑：

- `manifest.json`、`pages.json` 必须是 **UTF-8 无 BOM**，带 BOM 直接报 JSON 解析错误；
- Vue3 工程必须同时在 `manifest.json` 写 `"vueVersion": "3"` **和** 让 `main.js` 导出 `createApp()`，两边不匹配就白屏；
- 少了 `index.html`、`uni.scss`、`static/`，或者 `pages.json` 里没登记首页，编译就失败；
- 把 CLI 工程的 `package.json` + `vite.config.js` + `src/` 结构混进 HBuilderX 工程，会改变 HBuilderX 的编译方式。

这个 skill 把这些约束固化成了模板 + 自检流程。

## 安装

**全局**（所有项目可用，推荐）— Windows PowerShell：

```powershell
git clone https://github.com/aiweisoft/opencode-skill-uniapp-app-project.git "$env:USERPROFILE\.config\opencode\skills\uniapp-app-project"
```

macOS / Linux：

```sh
git clone https://github.com/aiweisoft/opencode-skill-uniapp-app-project.git ~/.config/opencode/skills/uniapp-app-project
```

**只给单个项目用**：克隆到 `<项目目录>/.opencode/skills/uniapp-app-project`。

> 目录名必须是 `uniapp-app-project`：opencode 的 skill ID 由路径决定，frontmatter 里的 `name` 只是显示名。装好后 opencode 会自动发现它，无需改配置。

## 用法

在 opencode 里直接描述需求即可（描述写进了 skill 的触发条件）：

> 帮我新建一个叫 weather 的 uni-app 工程

也可以显式点名：`@uniapp-app-project`。

想手动跑脚本：

```powershell
& "$env:USERPROFILE\.config\opencode\skills\uniapp-app-project\scripts\create-uniapp.ps1" `
    -Name myapp `
    -Target "D:\code\myapp" `
    -Vue 3 `
    -AppName "我的应用" `
    -AppId __UNI__XXXXXXX
```

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `-Name` | 必填 | 项目名，同时作为目录名和默认 App 名称 |
| `-Target` | `./<Name>` | 目标目录，支持相对/绝对路径 |
| `-Vue` | `3` | `3` 或 `2` |
| `-AppId` | 空 | DCloud AppID（`__UNI__XXXXXXX`），留空则稍后在 HBuilderX 里「重新获取」 |
| `-AppName` | 同 `-Name` | App 显示名称，可中文 |
| `-Force` | 关 | 目标目录非空时也写入 |

非 Windows 环境或想往已有工程里补文件时，直接把 `templates/vue3/`（或 `templates/vue2/`）的内容复制过去，再填 `manifest.json` 里的 `name` / `appid` 即可。

## 生成结果

```
myapp/
├── App.vue              # 应用入口：只写应用生命周期 + 全局样式，没有 <template>
├── main.js              # Vue3: createSSRApp + export createApp()；Vue2: new Vue({...App})
├── manifest.json        # 应用配置：名称/appid/版本/图标/权限/三方 SDK（HBuilderX 靠它识别工程）
├── pages.json           # 页面路由 + 全局窗口样式（pages[0] 是启动页）
├── uni.scss             # 全局 scss 变量
├── index.html           # 编译入口模板
├── pages/index/index.vue
├── static/logo.png
├── .gitignore
└── README.md            # 中文说明，写清 HBuilderX 的调试与打包步骤
```

生成后校验过：文件齐全、`pages.json` 的启动页路径与 `pages/index/index.vue` 对得上、两个 json 均为 UTF-8 无 BOM、`static/logo.png` 是有效 PNG、`vueVersion` 与 `main.js` 写法一致。

## 拿到工程之后（HBuilderX）

1. HBuilderX → 文件 → 打开目录 → 选工程根目录。
2. 双击 `manifest.json` → 基础配置 → AppID 一栏点 **重新获取**，拿到 DCloud AppID。
   **云打包必须有 appid**，没有它只能在浏览器里预览。
3. 调试：运行 → 运行到浏览器 / 运行到手机或模拟器。
4. 打包：发行 → 原生App-云打包，选 Android / iOS；证书可先用「公共测试证书」跑通流程。
5. 正式出包前改 `versionName` / `versionCode`，并在 manifest.json 里配好图标、启动图、App 模块。

细节见 `references/hbuilderx-app-build.md`。

## 仓库结构

```
.
├── SKILL.md                          # skill 主文件：参数收集 → 生成 → 自检 → 交付说明
├── scripts/
│   └── create-uniapp.ps1             # 脚手架（纯 ASCII，规避 PS 5.1 把脚本当 ANSI 解码的问题）
├── templates/
│   ├── README.project.md             # 生成到目标工程里的中文 README 模板
│   ├── vue3/                         # Vue3 完整模板
│   └── vue2/                         # Vue2 完整模板
└── references/
    ├── project-structure.md          # 目录结构、Vue2/Vue3 判定、编码约束
    ├── manifest-app.md               # 与打包 App 相关的 manifest 字段
    ├── hbuilderx-app-build.md        # HBuilderX 运行 / 证书 / 云打包 / 常见问题
    └── sources.md                    # 官方文档出处
```

## 资料来源

模板与说明整理自 uni-app 官方文档：快速上手、`manifest.json`、`pages.json`、`App.vue`、`main.js`、条件编译等，
完整链接见 [references/sources.md](references/sources.md)。官方模板仓库：[dcloudio/uni-preset-vue](https://github.com/dcloudio/uni-preset-vue)。

## 维护提示

- HBuilderX 升级后，`manifest.json` 可能出现新节点（如 `app-harmony`、`webView`）。
  用它新建一个空工程对比差异，再决定是否同步模板。
- 官方文档改动较大时，重新抓取来源页面并更新 `references/`。
