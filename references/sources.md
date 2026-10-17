# 资料来源

本 skill 的模板与说明整理自 uni-app 官方文档（2026-10 抓取）：

| 内容 | 链接 |
| --- | --- |
| 快速上手（HBuilderX 创建/运行/发布） | <https://uniapp.dcloud.net.cn/quickstart-hx.html> |
| manifest.json 应用配置 | <https://uniapp.dcloud.net.cn/collocation/manifest.html> |
| App 完整 manifest.json | <https://uniapp.dcloud.net.cn/collocation/manifest-app.html> |
| pages.json 页面路由 | <https://uniapp.dcloud.net.cn/collocation/pages.html> |
| App.vue | <https://uniapp.dcloud.net.cn/collocation/App.html> |
| main.js / main.uts | <https://uniapp.dcloud.net.cn/collocation/main.html> |
| uni.scss | <https://uniapp.dcloud.net.cn/collocation/uni-scss.html> |
| 条件编译（含 `vueVersion` 说明） | <https://uniapp.dcloud.net.cn/tutorial/platform.html> |
| 教程总览 | <https://uniapp.dcloud.net.cn/tutorial/> |
| HBuilderX 文档 | <https://hx.dcloud.net.cn/> |
| HBuilderX 命令行打包 | <https://hx.dcloud.net.cn/cli/pack> |
| 离线打包 | <https://nativesupport.dcloud.net.cn/AppDocs/README> |
| 官方模板仓库（vue2 / vue3 的 vite 模板） | <https://github.com/dcloudio/uni-preset-vue> |
| hello uni-app 官方示例 | <https://github.com/dcloudio/hello-uniapp> |

## 维护提示

- 模板里的 `manifest.json` 字段随 HBuilderX 版本演进（如 `app-harmony`、`webView` 等新节点）。
  升级 HBuilderX 后，可用它新建一个空工程对比差异，再决定是否更新本 skill 的模板。
- 官方文档会变动，改动较大时重新抓取上面几张页面并同步 `references/`。
