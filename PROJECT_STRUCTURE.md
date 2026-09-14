# FitConnect — Project Structure Guide

> **Who is this for?** Every developer joining the frontend team.  
> Read this before writing any code. Understanding the structure takes 10 minutes and saves hours of confusion later.

---

## What Is This Project?

**FitConnect** is a React Native mobile application built for SIH 2026.  
Tech stack: React Native 0.87 (CLI) · TypeScript · Redux Toolkit · React Navigation v6 · Axios

---

## Repository Root

```
fitconnect-frontend/
├── android/                    # 📱 Native Android project (Gradle)
├── ios/                        # 🍎 Native iOS project (Xcode) — future
├── src/                        # ✅ ALL your code lives here
├── __tests__/                  # Unit tests
│
├── App.tsx                     # Root component (providers + navigation)
├── index.js                    # RN entry point — do not modify
├── package.json                # Dependencies + npm scripts
├── tsconfig.json               # TypeScript config + path aliases
├── babel.config.js             # Babel + module-resolver (path aliases)
├── metro.config.js             # Metro bundler config (SVG support)
├── .eslintrc.js                # ESLint rules
├── .prettierrc                 # Prettier formatting rules
├── .editorconfig               # Editor whitespace settings
├── .env                        # ⛔ GITIGNORED — local secrets
├── .env.example                # ✅ Template — commit this
├── .gitignore
│
├── PROJECT_STRUCTURE.md        # 📄 This file — repo map
├── BUILD_GUIDE.md              # 📄 How to build debug + release
└── ANDROID_SETUP.md            # 📄 Android tools setup from scratch
```

---

## `src/` — Source Directory (Your Code)

```
src/
├── api/                        # Axios HTTP client + all API calls
│   ├── client.ts               # ⭐ Axios instance — import this everywhere
│   ├── endpoints.ts            # ⭐ All API URL constants
│   └── interceptors/
│       ├── authInterceptor.ts  # JWT token attach + auto-refresh on 401
│       └── errorInterceptor.ts # Normalize all errors → ApiException
│
├── assets/                     # Static files (not code)
│   ├── fonts/                  # .ttf font files (Inter family)
│   ├── icons/                  # SVG icons
│   └── images/                 # PNG/JPG images
│
├── components/                 # Reusable UI building blocks
│   ├── common/                 # Atoms: Button, Input, Avatar, Badge, Loader
│   ├── cards/                  # FeedCard, TrainerCard, SessionCard
│   ├── modals/                 # BottomSheet, ConfirmModal, AlertModal
│   └── index.ts                # Barrel export — import from here
│
├── constants/                  # App-wide constants
│   ├── config.ts               # ⭐ AppConfig — reads .env values
│   ├── routes.ts               # ⭐ Screen name constants — use Routes.X.Y
│   └── index.ts
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts              # Auth state + actions
│   ├── useDebounce.ts          # Debounce value updates
│   └── index.ts
│
├── navigation/                 # All navigation config
│   ├── RootNavigator.tsx       # ⭐ Auth gate — shows Auth or Main
│   ├── AuthNavigator.tsx       # Onboarding → Login → Register
│   ├── MainNavigator.tsx       # Bottom tab bar
│   ├── navigationRef.ts        # Imperative navigation (for interceptors)
│   └── index.ts
│
├── screens/                    # Screen components
│   ├── auth/                   # Unauthenticated screens
│   │   ├── OnboardingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   └── home/                   # Authenticated screens
│       └── HomeScreen.tsx
│
├── store/                      # Redux state management
│   ├── index.ts                # ⭐ Store config + persistor
│   ├── rootReducer.ts          # Combines all slices
│   ├── hooks.ts                # useAppDispatch / useAppSelector
│   └── slices/
│       ├── authSlice.ts        # login, logout, tokens, user
│       ├── userSlice.ts        # profile data
│       └── uiSlice.ts          # global loading, toasts
│
├── theme/                      # ⭐ Design system — single source of truth
│   ├── colors.ts               # Brand palette (NEVER use hex in components)
│   ├── typography.ts           # Font sizes, weights, text presets
│   ├── spacing.ts              # 4pt grid spacing scale
│   ├── shadows.ts              # Cross-platform shadow presets
│   ├── borderRadius.ts         # Border radius tokens
│   └── index.ts                # Single import: { Colors, Spacing, ... }
│
├── types/                      # TypeScript type definitions
│   ├── navigation.ts           # Screen param lists (type-safe navigation)
│   ├── api.ts                  # API response shapes, ApiError
│   ├── user.ts                 # User, Trainer entities
│   └── index.ts
│
└── utils/                      # Pure helper functions (no React)
    ├── storage.ts              # MMKV wrapper (fast key-value store)
    ├── validators.ts           # Form validation functions
    ├── formatters.ts           # Date, number, string formatters
    └── index.ts
```

---

## Path Aliases

Instead of long relative paths like `../../../theme/colors`, use aliases:

| Alias | Points to |
|---|---|
| `@/*` | `src/*` |
| `@api/*` | `src/api/*` |
| `@components/*` | `src/components/*` |
| `@constants/*` | `src/constants/*` |
| `@hooks/*` | `src/hooks/*` |
| `@navigation/*` | `src/navigation/*` |
| `@screens/*` | `src/screens/*` |
| `@store/*` | `src/store/*` |
| `@theme/*` | `src/theme/*` |
| `@types/*` | `src/types/*` |
| `@utils/*` | `src/utils/*` |

**Example:**
```ts
// ✅ Clean
import { Colors, Spacing } from '@theme/index';
import { useAppSelector } from '@store/hooks';
import { Routes } from '@constants/routes';

// ❌ Ugly
import { Colors } from '../../../theme/colors';
```

---

## How to Add a New Screen

1. **Create the screen file:**
   ```
   src/screens/trainers/TrainersScreen.tsx
   ```

2. **Add to param list** (`src/types/navigation.ts`):
   ```ts
   export type MainTabParamList = {
     Home: undefined;
     Trainers: undefined;   // ← add here
   };
   ```

3. **Add to routes** (`src/constants/routes.ts`):
   ```ts
   Main: {
     TRAINERS: 'Trainers' as const,   // ← add here
   }
   ```

4. **Register in navigator** (`src/navigation/MainNavigator.tsx`):
   ```tsx
   <Tab.Screen name={Routes.Main.TRAINERS} component={TrainersScreen} />
   ```

---

## How to Add a New Redux Slice

1. **Create the slice:**
   ```
   src/store/slices/feedSlice.ts
   ```

2. **Register in root reducer** (`src/store/rootReducer.ts`):
   ```ts
   import feedReducer from './slices/feedSlice';
   
   export const rootReducer = combineReducers({
     auth: authReducer,
     feed: feedReducer,   // ← add here
   });
   ```

3. **Use in components:**
   ```ts
   const feed = useAppSelector(state => state.feed);
   ```

---

## How to Add a New API Service

1. **Add endpoint** (`src/api/endpoints.ts`):
   ```ts
   feed: {
     posts: '/feed',
     post: (id: string) => `/feed/${id}`,
   }
   ```

2. **Create service file** (`src/api/services/feedService.ts`):
   ```ts
   import apiClient from '@api/client';
   import { Endpoints } from '@api/endpoints';
   
   export const feedService = {
     getPosts: () => apiClient.get(Endpoints.feed.posts),
   };
   ```

---

## Code Style Rules

| Rule | Why |
|---|---|
| Use `useAppSelector` / `useAppDispatch` (never raw `useSelector`) | Type safety |
| Import from `@theme/index` (never raw hex colors) | Consistency |
| Use `Routes.X.Y` for navigation (never magic strings) | Typo prevention |
| `const` over `let`, never `var` | Immutability |
| Named exports from `index.ts` barrel files | Clean imports |
| No inline styles — use `StyleSheet.create` | Performance |
| All components are functional (no class components) | Modern React |
| Types in `src/types/` for shared interfaces | Single source of truth |

---

## Environment Variables

The backend URL and other config live in `.env` (gitignored).  
Copy `.env.example` to `.env` and fill in your values.

```bash
cp .env.example .env
# Edit .env and set API_BASE_URL to your backend URL
```

For Android emulator, `10.0.2.2` maps to `localhost` on your machine.  
For a physical USB device, use your machine's local IP (e.g., `192.168.1.5`).

---

## Key Files Reference

| File | Purpose |
|---|---|
| [`App.tsx`](./App.tsx) | Root providers (Redux, Navigation, SafeArea, Toast) |
| [`src/api/client.ts`](./src/api/client.ts) | Axios instance — import this for all API calls |
| [`src/api/endpoints.ts`](./src/api/endpoints.ts) | All API URL constants |
| [`src/constants/config.ts`](./src/constants/config.ts) | App config from .env |
| [`src/constants/routes.ts`](./src/constants/routes.ts) | Screen name constants |
| [`src/navigation/RootNavigator.tsx`](./src/navigation/RootNavigator.tsx) | Auth gate |
| [`src/store/index.ts`](./src/store/index.ts) | Redux store + persistor |
| [`src/store/hooks.ts`](./src/store/hooks.ts) | Typed Redux hooks |
| [`src/theme/index.ts`](./src/theme/index.ts) | Design tokens |
