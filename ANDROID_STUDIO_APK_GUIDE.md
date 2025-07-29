# Build E-LEAKxDOWN APK with Android Studio

## Step-by-Step Guide

### Step 1: Download Required Files
1. **Download the entire `android/` folder** from your project
2. **Save it to your computer** (e.g., Desktop/E-LEAKxDOWN-android/)

### Step 2: Install Android Studio
1. **Download Android Studio** from https://developer.android.com/studio
2. **Install with default settings**
3. **Open Android Studio** and complete initial setup

### Step 3: Open Your Project
1. **Launch Android Studio**
2. **Click "Open an existing Android Studio project"**
3. **Navigate to and select your `android/` folder**
4. **Click "OK"**

### Step 4: Let Android Studio Set Up
1. **Wait for Gradle sync** (this may take 5-10 minutes first time)
2. **Install any prompted SDK components** when asked
3. **Accept licenses** if prompted
4. **Wait for indexing to complete**

### Step 5: Build Your APK
1. **In the top menu, click "Build"**
2. **Select "Build Bundle(s) / APK(s)" → "Build APK(s)"**
3. **Wait for build to complete** (you'll see progress at bottom)
4. **Look for "BUILD SUCCESSFUL" message**

### Step 6: Find Your APK
1. **Click the "locate" link** in the build success notification, OR
2. **Navigate manually to:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Step 7: Install on Android Device
1. **Copy APK to your Android phone** (via USB, email, or cloud storage)
2. **On your phone, go to Settings → Security**
3. **Enable "Install from Unknown Sources"** or "Allow from this source"
4. **Open the APK file** on your phone
5. **Tap "Install"**
6. **Launch E-LEAKxDOWN** from your app drawer

## Troubleshooting Common Issues

### Issue: Gradle Sync Failed
**Solution:**
1. Click "File" → "Sync Project with Gradle Files"
2. If still failing, click "Tools" → "SDK Manager"
3. Install Android SDK Platform-Tools and latest Android SDK

### Issue: Missing SDK Components
**Solution:**
1. Open "Tools" → "SDK Manager"
2. Install the following:
   - Android SDK Platform (latest version)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Tools

### Issue: Build Failed
**Solution:**
1. Check the "Build" tab at bottom for error details
2. Most common fix: "Build" → "Clean Project" then "Build" → "Rebuild Project"

### Issue: APK Won't Install on Phone
**Solution:**
1. Enable Developer Options: Go to Settings → About Phone → tap "Build Number" 7 times
2. Go to Settings → Developer Options → enable "USB Debugging"
3. Allow installation from unknown sources

## Your APK Details
- **File Name:** app-debug.apk
- **App Name:** E-LEAKxDOWN
- **Package:** com.eleakxdown.app
- **Size:** ~15-25 MB (estimated)
- **Features:** Full YouTube downloader with cyberpunk theme

## Quick Build Commands (Alternative)
If you prefer command line and have Android SDK installed:
```bash
cd android
./gradlew assembleDebug
```
APK will be in: `app/build/outputs/apk/debug/app-debug.apk`

## Important Notes
- **First build** may take 10-15 minutes due to downloading dependencies
- **Subsequent builds** will be much faster (2-3 minutes)
- **Debug APK** is ready for testing; for Play Store, you'd need a signed release APK
- **Internet connection required** for the app to work (connects to your server)

Your E-LEAKxDOWN mobile app will have all the features of the web version with mobile-optimized controls and cyberpunk design!