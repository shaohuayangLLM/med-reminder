# 用药提醒 — 项目进度

## 2026-03-01：项目初始化 & 双端完成

### Web 应用（已完成，已部署）

从零搭建到部署，一天内完成全部功能：

1. **项目脚手架** — Vite + React 19 + TypeScript + Tailwind CSS v4 + Vitest
2. **核心数据模型** — `Cartridge` 类型，支持分段剂量变更和手动修正基线
3. **剂量计算器** — 基于时间线的分段计算，含单元测试
4. **三级警报** — None / Warning（≤7天）/ Urgent（≤2天）
5. **状态持久化** — localStorage + schema 版本迁移（v1→v2）
6. **UI 组件** — RingProgress（SVG）、StatusDisplay、Modal、ActionButtons、History、DataManager
7. **交互功能** — 开新药、修正剩余次数、调整每日次数（支持自定义生效日期）、历史记录删除、数据导入导出
8. **视觉设计** — ChatGPT iOS 风格，极简黑白配色
9. **PWA 支持** — manifest + service worker + 图标
10. **浏览器通知** — Warning 级别 toast，Urgent 级别 modal
11. **部署** — `base: '/med/'`，部署到 https://ainside.cn/med/

### 微信小程序（已完成，待审核）

基于 Web 版核心逻辑移植：

1. **Taro 4.1.11 项目搭建** — React + TypeScript + Sass
2. **核心逻辑复用** — types.ts、dose-calculator.ts、alert-level.ts 零修改复制
3. **存储层适配** — localStorage → Taro.getStorageSync/setStorageSync
4. **UI 全部重写** — HTML → View/Text，SVG → Canvas 2D API，inline styles
5. **平台特性适配** — Picker 日期选择、剪贴板数据传输、Taro.showModal 确认
6. **小程序图标** — 纯 Node.js 生成 144x144 PNG（无外部依赖）
7. **代码推送** — GitHub 仓库 shaohuayangLLM/med-reminder

### 当前状态

- Web 应用：**已上线** https://ainside.cn/med/
- 微信小程序：**ICP 备案审核中**，审核通过后可提交微信审核发布
- AppID：`wx86569f7e0c3599af`

### 待办

- [ ] ICP 备案通过后，在微信开发者工具中上传并提交审核
- [ ] 考虑接入微信订阅消息推送（需后端支持）
