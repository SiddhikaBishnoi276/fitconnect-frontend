# FitConnect — Android Development Setup Guide

> **Purpose:** Complete step-by-step guide to set up your machine for Android React Native development from scratch.  
> Follow this guide in order. Do not skip steps.

---

## System Requirements

| Tool | Minimum Version | Recommended |
|---|---|---|
| Node.js | 18.x | 20.x LTS |
| JDK | 17 | 17 (LTS) |
| Android Studio | Hedgehog | Latest stable |
| Android SDK | API 34 | API 35 |
| Gradle | 8.x | Auto-managed |

---

## ⚠️ What to Share with New Developers (Not in Git)

Since we follow security best practices, certain files and credentials are **NOT** stored in the Git repository. When a new developer joins and pulls the repo, you MUST share the following with them privately (e.g., via Slack, Teams, or a secure password manager):

1. **The `.env` file**
   - Git only has `.env.example`. You need to share the actual `.env` file which contains the real `API_BASE_URL` and any other secrets.
2. **The Keystore Passwords**
   - The `fitconnect.keystore` file itself *will* be committed to Git so everyone can build release APKs, but the passwords are not.
   - You must share these exact values with new developers:
     - `FITCONNECT_KEYSTORE_PASSWORD="fitconnect26"`
     - `FITCONNECT_KEY_ALIAS="fitconnect"`
     - `FITCONNECT_KEY_PASSWORD="fitconnect26"`
   - Developers need to set these as environment variables on their machines (as explained in Step 10).

---

## Step 1 — Install Node.js

**Option A: nvm (Recommended — switch Node versions easily)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Restart terminal, then:
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

**Option B: Direct install**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Step 2 — Install JDK 17

React Native requires Java 17. Do NOT use JDK 8 or 11 — they will cause Gradle errors.

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk

# macOS (via Homebrew)
brew install openjdk@17
echo 'export PATH="/usr/local/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc

# Verify
java -version
# Expected: openjdk 17.x.x
javac -version
# Expected: javac 17.x.x
```

**Set JAVA_HOME:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export PATH=$JAVA_HOME/bin:$PATH

# Reload
source ~/.bashrc
```

---

## Step 3 — Install Android Studio

1. Download from: https://developer.android.com/studio
2. Install Android Studio (follow the installer)
3. On first launch, run the **Setup Wizard** and install:
   - Android SDK
   - Android SDK Platform Tools
   - Android Emulator
   - Android Virtual Device (AVD)

**After installation, verify:**
```bash
# Should show the path to Android Studio's bundled SDK
echo $ANDROID_HOME
```

---

## Step 4 — Set Android SDK Environment Variables

Add these to your `~/.bashrc` (Linux) or `~/.zshrc` (macOS):

```bash
# ─── Android SDK ─────────────────────────────────────────────
export ANDROID_HOME=$HOME/Android/Sdk
# macOS path is different:
# export ANDROID_HOME=$HOME/Library/Android/sdk

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Reload:
```bash
source ~/.bashrc
```

Verify:
```bash
adb --version       # Should show: Android Debug Bridge version 1.x.x
emulator -version   # Should show emulator version
```

---

## Step 5 — Install Android SDK Components

Open Android Studio → **SDK Manager** → Install:

- **SDK Platforms tab:**
  - ✅ Android 15 (API 35)
  - ✅ Android 14 (API 34) — required for builds

- **SDK Tools tab:**
  - ✅ Android SDK Build-Tools 35.x
  - ✅ Android Emulator
  - ✅ Android SDK Platform-Tools
  - ✅ Android SDK Command-line Tools (latest)
  - ✅ Google Play Services

---

## Step 6 — Create a Virtual Device (Emulator)

1. Open Android Studio → **Device Manager** (right sidebar or Tools menu)
2. Click **"Create Device"**
3. Select hardware: **Pixel 7** (recommended)
4. Select system image: **API 34 (Android 14)** — download if needed
5. Click **Finish**
6. Click ▶ to start the emulator

**Or use command line:**
```bash
# List available AVDs
emulator -list-avds

# Start an AVD
emulator -avd Pixel_7_API_34
```

---

## Step 7 — Enable USB Debugging (Physical Device)

### On Your Android Phone:

1. Go to **Settings → About Phone**
2. Tap **"Build Number"** 7 times fast until you see "You are now a developer!"
3. Go to **Settings → Developer Options**
4. Enable **USB Debugging**
5. Enable **"Stay Awake"** (optional but helpful)

### Connect via USB:

```bash
# Connect phone with USB cable
# Accept the "Allow USB Debugging?" prompt on your phone

# Verify connection
adb devices
# Output should show your device:
# List of devices attached
# R5CW31XXXXX   device
```

### Install app on phone:
```bash
npm run android
# The app will automatically install and launch on your connected phone
```

---

## Step 8 — Wireless Debugging (ADB over WiFi) — Android 11+

No need for a USB cable after initial setup!

### Setup (one-time):
```bash
# 1. Connect phone via USB first
adb devices   # Confirm it shows up

# 2. Enable wireless on same WiFi
adb tcpip 5555

# 3. Get your phone's IP address
# Go to Settings → About Phone → Status → IP Address
# Example: 192.168.1.42

# 4. Connect wirelessly
adb connect 192.168.1.42:5555

# 5. Unplug USB cable — phone stays connected over WiFi
adb devices
# Shows: 192.168.1.42:5555   device

# 6. Run app wirelessly
npm run android
```

### Android 11+ — Built-in Wireless Debugging:
1. Settings → Developer Options → **Wireless Debugging** → Enable
2. Tap **"Pair device with QR code"** or **"Pair device with pairing code"**
3. In Android Studio → Device Manager → pair via QR code or:
   ```bash
   adb pair 192.168.1.42:PORT
   # Enter the pairing code shown on your phone
   adb connect 192.168.1.42:5555
   ```

---

## Step 9 — Verify Everything Works

```bash
# 1. Check adb sees your device
adb devices
# Should show at least one device (emulator or phone)

# 2. Install npm dependencies
npm install

# 3. Copy .env file
cp .env.example .env
# Edit .env and set your backend URL

# 4. Start Metro bundler
npm start

# 5. In a second terminal — run the app
npm run android
# App should install and launch on your device in ~2-3 minutes (first time)
# Subsequent runs are much faster (~30 seconds)
```

---

## Step 10 — Set Up for Release Builds

This is needed to generate signed APK/AAB for distribution.
> ⚠️ The keystore has already been generated and is tracked in Git. You do NOT need to generate it again.

```bash
# Set environment variables (add to ~/.bashrc or ~/.zshrc)
export FITCONNECT_KEYSTORE_PASSWORD="fitconnect26"
export FITCONNECT_KEY_ALIAS="fitconnect"
export FITCONNECT_KEY_PASSWORD="fitconnect26"
source ~/.bashrc

# Test release build
npm run build:android:release
```

See `BUILD_GUIDE.md` for complete release build instructions.

---

## Common Installation Problems

| Problem | Solution |
|---|---|
| `JAVA_HOME not set` | Add `export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))` to `~/.bashrc` |
| `SDK location not found` | Create `android/local.properties` with `sdk.dir=/home/lakshman-joshi/Android/Sdk` |
| `Command not found: adb` | Add `$ANDROID_HOME/platform-tools` to `$PATH` |
| `Emulator won't start (KVM error)` | Enable virtualization in BIOS, or run: `sudo apt install qemu-kvm` |
| `Device not showing in adb devices` | Try different USB cable. Check USB mode is "File Transfer" not "Charging only" |
| `Build failed: minSdk version` | Check `android/build.gradle` → `minSdkVersion` ≥ 24 |
| `Could not resolve gradle` | Check internet connection. Try: `cd android && ./gradlew dependencies` |
| `Task :app:bundleReleaseJsAndAssets FAILED` | Check Node and Metro are running: `npm start` |

---

## Quick Reference Commands

```bash
# Device management
adb devices                     # List connected devices
adb logcat                      # View device logs (useful for crash debugging)
adb logcat *:E                  # Only error logs
adb install app.apk             # Install APK manually
adb uninstall com.fitconnect    # Uninstall app

# Metro bundler
npm start                       # Start bundler
npm run start:reset             # Start with cache cleared

# App builds
npm run android                 # Debug run (emulator or USB)
npm run build:android:debug     # Debug APK
npm run build:android:release   # Release APK (needs keystore + env vars)
npm run build:android:bundle    # Release AAB for Play Store

# Gradle
cd android && ./gradlew tasks          # List all Gradle tasks
cd android && ./gradlew clean          # Clean build cache
cd android && ./gradlew dependencies   # List dependencies

# Debugging
adb logcat ReactNative:V ReactNativeJS:V *:S   # Filter React Native logs
```
