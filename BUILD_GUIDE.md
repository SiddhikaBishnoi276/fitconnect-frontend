# FitConnect — Build Guide

> Quick reference for all dev team members.  
> Before running anything, complete the **ANDROID_SETUP.md** guide.

---

## 1. First-Time Setup (New Dev Cloning the Repo)

```bash
# Step 1: Clone
git clone <repo-url>
cd fitconnect-frontend

# Step 2: Install dependencies
npm install

# Step 3: Copy and fill .env
cp .env.example .env
# Open .env and set API_BASE_URL to your backend URL
# For emulator:  API_BASE_URL=http://10.0.2.2:8000/v1
# For USB device: API_BASE_URL=http://192.168.x.x:8000/v1

# Step 4: Setup Keystore (see Section 4 below)

# Step 5: Run on device
npm run android
```

---

## 2. Daily Development — Local Run

### Start Metro Bundler (Terminal 1)
```bash
npm start
```

### Run on Android (Terminal 2)

**On USB-connected Android phone:**
```bash
npm run android
# or
npx react-native run-android
```

**On Android Emulator:**
```bash
# First start the emulator from Android Studio (Device Manager → ▶)
npm run android
```

**On a specific connected device (multiple devices plugged in):**
```bash
adb devices             # List connected devices
npm run android:device  # Pick device interactively
# or specify exact device:
npx react-native run-android --deviceId <DEVICE_ID>
```

**Reset Metro cache (when you see bundling errors):**
```bash
npm run start:reset
```

---

## 3. Build Debug APK

A debug APK can be installed on any Android device without Play Store.

```bash
# Build debug APK
npm run build:android:debug

# APK location after build:
# android/app/build/outputs/apk/debug/app-debug.apk

# Install directly to connected device:
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 4. Keystore Setup for Release Build

> ⚠️ The keystore has already been generated and is tracked in Git. You do NOT need to generate it again.

### Step A — Set Credentials as Environment Variables

To build release APKs, you must set these environment variables using the shared passwords:

#### Linux / macOS (add to `~/.bashrc` or `~/.zshrc`):
```bash
export FITCONNECT_KEYSTORE_PASSWORD="fitconnect26"
export FITCONNECT_KEY_ALIAS="fitconnect"
export FITCONNECT_KEY_PASSWORD="fitconnect26"
```
Then: `source ~/.bashrc`

#### Windows (PowerShell):
```powershell
$env:FITCONNECT_KEYSTORE_PASSWORD="fitconnect26"
$env:FITCONNECT_KEY_ALIAS="fitconnect"
$env:FITCONNECT_KEY_PASSWORD="fitconnect26"
```

> 💡 **Where is the keystore file?**  
> `android/app/fitconnect.keystore` — already configured in `android/app/build.gradle`

---

## 5. Release APK (for Testing / Sharing)

```bash
# Method 1: via npm script
npm run build:android:release

# Method 2: via Gradle directly
cd android && ./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
# (also split APKs per architecture — use app-universal-release.apk)

# Install on device:
adb install android/app/build/outputs/apk/release/app-universal-release.apk
```

---

## 6. Release AAB (for Google Play Store)

AAB (Android App Bundle) is required for Play Store submission.

```bash
# Build release AAB
npm run build:android:bundle

# AAB location:
# android/app/build/outputs/bundle/release/app-release.aab

# Upload android/app/build/outputs/bundle/release/app-release.aab
# to Google Play Console → Production / Internal Testing
```

---

## 7. Clean Build (When Things Break)

```bash
# Clean Android build cache
npm run clean:android

# Clear Metro cache
npm run clean:metro

# Full clean — nuke everything and reinstall
rm -rf node_modules
npm install
cd android && ./gradlew clean && cd ..
npm start --reset-cache
```

---

## 8. Useful npm Scripts Reference

| Command | What it does |
|---|---|
| `npm start` | Start Metro bundler |
| `npm run start:reset` | Start Metro with cache cleared |
| `npm run android` | Run app on Android (emulator or USB) |
| `npm run android:device` | Run on USB device explicitly |
| `npm run android:release` | Run release build on device |
| `npm run lint` | Check code for ESLint errors |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run format` | Format all files with Prettier |
| `npm run type-check` | Check TypeScript types (no emit) |
| `npm test` | Run Jest unit tests |
| `npm run build:android:debug` | Build debug APK |
| `npm run build:android:release` | Build release APK |
| `npm run build:android:bundle` | Build release AAB (Play Store) |
| `npm run clean:android` | Clean Gradle build cache |

---

## 9. Environment Variables Quick Reference

| Variable | Description | Example |
|---|---|---|
| `API_BASE_URL` | Backend API base URL | `http://10.0.2.2:8000/v1` |
| `APP_ENV` | Environment name | `development` |
| `APP_DEBUG` | Enable debug logging | `true` |

**Where to set:**
- Local dev → `.env` file (gitignored)
- Backend URL → ask backend team for the URL

**For emulator:**  
`API_BASE_URL=http://10.0.2.2:8000/v1`  
(`10.0.2.2` is the special IP that maps to your machine's localhost inside Android Emulator)

**For physical USB device:**  
`API_BASE_URL=http://192.168.x.x:8000/v1`  
(replace with your machine's local IP — run `ifconfig` or `ip addr` to find it)

---

## 10. Troubleshooting

| Problem | Solution |
|---|---|
| `SDK location not found` | Create `android/local.properties` with `sdk.dir=/path/to/Android/Sdk` |
| `Metro: ECONNREFUSED` | Metro not running — run `npm start` in a separate terminal |
| `Gradle build failed: OutOfMemory` | Increase heap in `android/gradle.properties`: `-Xmx4096m` |
| `Cannot connect to backend` | Check `.env` API_BASE_URL — use `10.0.2.2` for emulator |
| `App crashes on launch` | Run `adb logcat` to see native crash logs |
| `Package not found after npm install` | Delete `node_modules`, run `npm install` again |
| `Keystore error on release build` | Verify env vars `FITCONNECT_KEYSTORE_PASSWORD` are set |
| `Red screen: Unable to resolve module` | Path alias issue — check `tsconfig.json` and `babel.config.js` |
| `Could not find module @react-native-config` | Run `npm install` and rebuild android |
