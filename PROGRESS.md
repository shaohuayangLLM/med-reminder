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

## 2026-05-29：iOS 原生应用落地 & 真机安装

### iOS 应用（可运行，已装到真机）

在不改动现有 Web 应用和微信小程序代码的前提下，新增独立 iOS 原生工程：

1. **工程位置** — `ios/MedicationReminder/`
2. **技术栈** — SwiftUI 原生实现，复刻现有用药提醒核心体验
3. **核心能力** — 开新药、修正剩余次数、调整每日次数、剩余次数/天数展示、数据导入导出
4. **本地存储** — 使用 iOS 本地持久化保存当前药剂、历史调整与用量记录
5. **Xcode 环境** — 已安装并配置 Xcode / iPhoneOS SDK / iPhoneSimulator SDK
6. **模拟器验证** — iOS 26.5 模拟器可构建、安装、运行
7. **真机签名** — 使用个人开发者团队签名，Bundle ID 为 `cn.ainside.medicationreminder`
8. **真机安装** — 已安装并成功启动到 iPhone 12 mini

### 交互视觉更新

根据微信小程序当前视觉，将 iOS 版以下三个操作改为底部弹窗样式：

1. **开新药**
2. **修正次数**
3. **调整每日**

视觉规范：

- 灰色背景遮罩
- 白色圆角底部面板
- 顶部短拖拽条
- 灰色字段标签
- 浅灰描边输入框
- 黑色主按钮

相关文件：

- `ios/MedicationReminder/MedicationReminder/ContentView.swift`

### Web / 微信小程序同步优化（进行中）

在 Web 版和微信小程序版同步推进一组轻量体验改动：

1. **数据模型升级到 v3** — `AppState` 新增 `operationLogs`，用于保存最近 30 天操作记录
2. **操作记录** — 开新药、修正次数、调整每日次数会写入操作日志
3. **记录页签** — 将「操作记录」和「开药记录」合并为轻量页签，并保留数据导出入口
4. **调整每日次数** — 生效日期从任意日期选择简化为「今天生效 / 明天生效」
5. **反馈提示** — 调整每日次数后提示每日次数变化和预计可用天数变化
6. **小程序版本** — `mini/package.json` 版本号提升到 `1.1.0`
7. **小程序更新提示** — 接入 `Taro.getUpdateManager()`，新版本准备好后提示重启

相关文件：

- `src/types.ts`
- `src/lib/storage.ts`
- `src/hooks/useAppState.ts`
- `src/components/RecordTabs.tsx`
- `src/App.tsx`
- `mini/src/types.ts`
- `mini/src/lib/storage.ts`
- `mini/src/hooks/useAppState.ts`
- `mini/src/components/RecordTabs.tsx`
- `mini/src/pages/index/index.tsx`
- `mini/src/app.ts`

### 验证记录

- `xcodebuild` 模拟器构建通过
- iOS 模拟器中已打开并检查「开新药」底部弹窗视觉
- `xcodebuild` 真机构建通过
- `devicectl` 真机安装通过
- `devicectl` 真机启动通过

### 注意事项

- 目前使用个人免费开发者签名，真机安装通常 **7 天后需要重新签名安装**
- 若后续需要长期安装或分发，需要加入 Apple Developer Program（$99/年）
- 当前只统一了三个操作弹窗；数据导入导出弹窗暂未调整
- Web / 小程序的 v3 操作记录改动仍需要补一次 `npm run lint`、`npm run build`、`npx vitest` 和 `cd mini && npm run build:weapp`
- iOS 工程目录下目前包含 `build/` 产物和 `.DS_Store`，提交前需要确认是否纳入版本控制或补充忽略规则
- `src/components/OperationLogs.tsx` 和 `mini/src/components/OperationLogs.tsx` 已新增但当前主界面使用的是 `RecordTabs`，提交前可确认是否保留
- 下一步可考虑补齐 iOS 通知提醒、App 图标、启动页和更完整的真机回归测试
