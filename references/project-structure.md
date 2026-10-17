# uni-app 工程结构与规则

来源：<https://uniapp.dcloud.net.cn/quickstart-hx.html>、<https://uniapp.dcloud.net.cn/collocation/manifest.html>、
<https://uniapp.dcloud.net.cn/collocation/main.html>、<https://uniapp.dcloud.net.cn/collocation/App.html>、
<https://uniapp.dcloud.net.cn/tutorial/platform.html>

## 两种工程形态

| | HBuilderX 工程（本 skill 生成的就是这种） | CLI 工程 |
| --- | --- | --- |
| 创建方式 | HBuilderX 文件 -> 新建 -> 项目 | `npx degit dcloudio/uni-preset-vue#vite` |
| 源码位置 | **工程根目录就是源码** | 源码在 `src/`，根目录放 `package.json`、`vite.config.js` |
| 编译器 | HBuilderX 内置，跟随 IDE 升级 | 项目内 `node_modules`，需自己 `npm install` |
| 适合 | 用 HBuilderX 可视化开发 + 云打包成 App | 需要 npm 生态、CI 构建 |

两者可以互相导入，但**不要混用**：HBuilderX 工程里不要多出 `package.json` / `vite.config.js`
把编译器引到 npm 模式，除非你确实要转成 CLI 工程。

## 最小可运行文件集

```
工程根目录/
├── App.vue              # 应用入口组件：只写应用生命周期 + 全局样式，没有 <template>
├── main.js              # 创建并挂载 Vue 实例（Vue3/Vue2 写法不同）
├── manifest.json        # 应用配置（名称/appid/版本/图标/权限/SDK），HBuilderX 靠它识别工程
├── pages.json           # 页面路由 + 全局窗口样式 + tabBar + 分包
├── uni.scss             # 全局 scss 变量（可选，但模板和大量插件都引用它）
├── index.html           # 编译入口模板（H5 必需；App 端模板里也有，保留即可）
├── pages/
│   └── index/index.vue  # 首页
├── static/              # 静态资源，不参与编译
│   └── logo.png
└── unpackage/           # 编译/打包产物，自动生成，不要手改、不要提交
```

必需项：`manifest.json`、`pages.json`、`App.vue`、`main.js`、至少一个页面。
HBuilderX 判断“这是一个 uni-app 工程”，靠的就是根目录存在 `manifest.json`。

## Vue3 vs Vue2 怎么判定

`manifest.json` 根节点的 `"vueVersion"`：

- 有 `"vueVersion" : "3"` -> Vue3，`main.js` 必须导出 `createApp()`：

  ```js
  import App from './App'
  import { createSSRApp } from 'vue'

  export function createApp() {
      const app = createSSRApp(App)
      return { app }
  }
  ```

- 没有该字段 -> Vue2，`main.js` 用：

  ```js
  import Vue from 'vue'
  import App from './App'

  Vue.config.productionTip = false
  App.mpType = 'app'

  const app = new Vue({
      ...App
  })
  app.$mount()
  ```

条件编译里的 `VUE3` 宏也依赖这个字段，所以 **manifest.json 和 main.js 必须匹配**，
否则会出现“白屏 / 找不到 createApp / VUE3 宏不生效”。

## 编码与语法约束（踩过的坑）

- 所有文件必须是 **UTF-8 无 BOM**。带 BOM 会让 `manifest.json` / `pages.json` 解析失败。
- `manifest.json`、`pages.json` 是 **JSONC**：允许 `//` 注释和尾逗号之外的空行，
  但**数组/对象里不能有多余逗号**，条件编译必须保证编译前后都是合法 JSON。
- 页面路径不带扩展名、不带前导 `/`：`pages/index/index`。
- `static/` 内资源用绝对路径引用：`/static/logo.png`；`static` 目录不能放 `.scss` 等需要编译的文件。
- 尺寸单位优先用 `rpx`（750rpx = 屏幕宽度）。
- 新增页面必须两步：建 `pages/xxx/xxx.vue` **并且**在 `pages.json` 的 `pages` 数组里登记。

## 常用全局文件

- `pages.json`：`pages`（第一项是启动页）、`globalStyle`、`tabBar`、`subPackages`、`easycom`。
- `manifest.json`：见 `manifest-app.md`。
- `App.vue`：`onLaunch` / `onShow` / `onHide` / `onError` / `onPageNotFound` / `onUnhandledRejection`
  **只能在 App.vue 里监听**，页面里写无效；`globalData` 也定义在这里（页面里用 `getApp().globalData`）。
- 全局组件在 `main.js` 注册；轻量复用优先用 `easycom` 规则自动引入。

## 下一步

打包成 App 见 `hbuilderx-app-build.md`。
