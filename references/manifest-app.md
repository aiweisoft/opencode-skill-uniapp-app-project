# manifest.json 中与「打包成 App」相关的字段

来源：<https://uniapp.dcloud.net.cn/collocation/manifest.html>

只有 App 端（`app-plus`）会用到下面这些；打包成 Apk/Ipa 时按需修改。

## 根节点

| 字段 | 说明 |
| --- | --- |
| `name` | 应用名称（桌面显示名） |
| `appid` | **DCloud AppID**，`__UNI__XXXXXXX`，新建工程时云端正则分配，不要手改成别的格式 |
| `description` | 应用描述 |
| `versionName` | 版本名称，如 `1.0.0`。云打包和生成 wgt 时使用；升级 App 版本必须先改这里 |
| `versionCode` | 版本号，整数，如 `100`，每次发版递增 |
| `vueVersion` | `"3"` 表示 Vue3 工程；**没有该字段就是 Vue2** |
| `transformPx` | 已废弃，新工程用 `false` |
| `debug` | `true` 时输出页面注册/路由/数据更新等调试日志 |
| `uniStatistics.enable` | 是否开启 uni 统计，默认 `true`；不需要就设为 `false` |
| `networkTimeout` | `request` / `connectSocket` / `uploadFile` / `downloadFile` 超时，默认 60000ms |

## `app-plus`

| 字段 | 说明 |
| --- | --- |
| `splashscreen` | 启动界面：`alwaysShowBeforeRender`、`waiting`、`autoclose` |
| `screenOrientation` | 横竖屏，取值 `portrait-primary` / `portrait-secondary` / `landscape-primary` / `landscape-secondary` |
| `modules` | 原生模块开关，控制包体积（Bluetooth、Maps、OAuth、Payment、Push、Share、VideoPlayer、SQLite、Speech、Contacts、Fingerprint、LivePusher、Messaging、Statistic、iBeacon） |
| `distribute.android.permissions` | Android 权限声明 |
| `distribute.ios` | iOS 相关配置 |
| `distribute.sdkConfigs` | 三方 SDK（`oauth` / `share` / `push` / `payment` / `statics` / `speech` / `maps`），**仅云打包生效** |
| `optimization.subPackages` | 开启 App 端分包优化（仅 vue2），需配合 `runmode: "liberate"` |
| `nvueCompiler` / `nvueStyleCompiler` | nvue 编译模式，默认 `weex`，模板里给成 `uni-app` |
| `webView.minUserAgentVersion` | 最低 webview 版本；Vue3 的 vue 页面要求 Android webview >= `64.0.3282.116` |

## 其它平台节点（不影响 App，但要会看）

- `h5`：`router.mode`（hash/history）、`router.base`（子路径部署）、`devServer.port`、`template`。
- `mp-weixin`：小程序 `appid`、`setting.urlCheck`。注意微信 appid 填在这里，
  **不要**填到 `app-plus` 下；`app-plus.distribute.sdkConfigs` 里的 `weixin` 是 App 端微信登录/分享的 SDK。
- `mp-alipay` / `mp-baidu` / `mp-toutiao` 等：各小程序平台配置。

## 修改建议

- 优先用 HBuilderX 打开 `manifest.json` 的**可视化界面**改，所见即所得，还能顺带生成图标。
- 用脚本/编辑器直接改 JSON 时：保持 UTF-8 无 BOM、不要加多余逗号。
- `appid` 一旦用于线上包，**不要改**；需要用 `versionName`/`versionCode` 控制版本。
