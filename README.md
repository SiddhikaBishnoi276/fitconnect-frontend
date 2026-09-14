# FitConnect Frontend

React Native mobile app for FitConnect — SIH 2026.

## 📚 Documentation

| File | Purpose |
|---|---|
| [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) | Repo map, folder explanations, naming conventions, how to add screens/slices |
| [`ANDROID_SETUP.md`](./ANDROID_SETUP.md) | Full Android environment setup (JDK, SDK, emulator, USB/wireless debug) |
| [`BUILD_GUIDE.md`](./BUILD_GUIDE.md) | Daily dev workflow, debug APK, release APK, keystore setup |

## ⚡ Quick Start

```bash
# 1. First time? Read ANDROID_SETUP.md completely
# 2. Install dependencies
npm install

# 3. Copy and fill environment file
cp .env.example .env

# 4. Run on device
npm run android
```

## 🏗 Tech Stack

- **React Native** 0.87 (CLI, bare workflow)
- **TypeScript** (strict mode)
- **Redux Toolkit** + Redux Persist
- **React Navigation** v6 (Stack + Bottom Tabs)
- **Axios** (API client with JWT interceptors)
- **MMKV** (fast local storage)

## 📁 Project Structure

See [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) for the complete guide.

```
src/
├── api/          # Axios client + endpoints + interceptors
├── assets/       # Fonts, images, icons
├── components/   # Reusable UI components
├── constants/    # Routes, config values
├── hooks/        # Custom React hooks
├── navigation/   # Stack + Tab navigators
├── screens/      # All app screens
├── store/        # Redux slices + store config
├── theme/        # Colors, typography, spacing
├── types/        # TypeScript interfaces
└── utils/        # Helpers (storage, validators, formatters)
```
