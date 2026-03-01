# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

用药提醒（Medication Reminder）— 追踪吸雾剂药剂剩余次数并在药剂快用完时提醒换药。两个独立构建目标共享核心逻辑：

- **Web 应用**（项目根目录）：React 19 + TypeScript + Tailwind CSS v4 + Vite，部署到 https://ainside.cn/med/
- **微信小程序**（`mini/` 子目录）：Taro 4.1.11 + React 18 + TypeScript + Sass，AppID `wx86569f7e0c3599af`

## Build & Dev Commands

### Web
```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build (output: dist/)
npm run lint         # ESLint
npm run preview      # Preview production build
npx vitest           # Run tests (Vitest + jsdom)
npx vitest run src/lib/__tests__/dose-calculator.test.ts  # Run single test file
```

### Mini Program
```bash
cd mini
npm run dev:weapp    # Taro watch build for WeChat (output: mini/dist/)
npm run build:weapp  # Production build
```
Build output `mini/dist/` is opened in WeChat DevTools.

## Architecture

### Shared Core Logic (100% reusable between web and mini)
- `src/types.ts` — `Cartridge`, `AppState`, `DosageChange`, `ManualAdjustment`; schema version = 2
- `src/lib/dose-calculator.ts` — Segmented dose calculation with timeline-based dosage changes and manual adjustment baselines
- `src/lib/alert-level.ts` — Three-level alert: None / Warning (≤7 days) / Urgent (≤2 days)

### Storage Layer
- Web: `localStorage` via `src/lib/storage.ts`
- Mini: `Taro.getStorageSync/setStorageSync` via `mini/src/lib/storage.ts`
- Both include schema migration from v1→v2

### UI Layer
- Web: HTML + SVG RingProgress + Tailwind CSS v4
- Mini: Taro components (`View`/`Text`/`Input`/`Picker`/`Canvas`) + inline styles + Sass

### Key Differences (web vs mini)
| Feature | Web | Mini |
|---------|-----|------|
| Ring progress | SVG | Canvas 2D API |
| Date picker | `<input type="date">` | `<Picker mode="date">` |
| Data export/import | File download/upload | Clipboard (`setClipboardData`/`getClipboardData`) |
| Notifications | Browser Notification API | `Taro.showToast()` / `Taro.showModal()` |

## TypeScript Constraints

- **`erasableSyntaxOnly: true`** — Cannot use `enum` or `namespace` with runtime semantics; use `const` objects + `type` unions instead
- **`verbatimModuleSyntax: true`** — Must use `import type` for type-only imports
- Web uses `noUnusedLocals` and `noUnusedParameters`

## Testing

Web app uses Vitest with jsdom environment. Tests live in `src/lib/__tests__/`. The mini program has no test setup — test manually in WeChat DevTools.

## Deployment

Web app deploys via `vite build` with `base: '/med/'`. The `dist/` folder is served at the `/med/` path.

## Key Data Model

A `Cartridge` tracks one medication cartridge: total doses, start date, a timeline of `dosageChanges` (date + new daily dose count), and `manualAdjustments` (date + corrected remaining count). The dose calculator walks the timeline segments to compute remaining doses for any given date.
