# 📱 APK Generation & Testing Guide

Your mobile app builder now supports full APK generation! Transform your designs into real Android APK files.

## 🚀 Quick Start

### 1️⃣ Design Your App
- Use the drag-and-drop builder at `/app/builder`
- Add components and preview on mobile frames
- Click "📱 Generate APK" button

### 2️⃣ Initialize Template (First Time)
```bash
npm run mobile:init
```

### 3️⃣ Generate Mobile App
```bash
npm run mobile:generate tryongoeye.myshopify.com
```

### 4️⃣ Build APK
```bash
npm run mobile:build ./generated-apps/[app-folder] debug
```

### 5️⃣ Test on Device
```bash
npm run mobile:test ./generated-apks/[apk-file] --launch
```

## 🔧 Prerequisites

- **Node.js** (v18+)
- **Java JDK** (11+)
- **Android Studio** (for SDK)
- **Android device** with USB debugging

## 📱 Testing Options

### USB Installation
1. Connect Android device via USB
2. Enable Developer Options & USB Debugging
3. Run test script

### Manual Installation
1. Transfer APK to device Downloads
2. Enable "Install from unknown sources"
3. Tap APK file to install

### QR Code Download
1. Start download server
2. Scan QR code with device
3. Download and install

## 🛠️ Troubleshooting

### Setup Issues
- Install Android Studio for SDK
- Set ANDROID_HOME environment variable
- Add ADB to PATH

### Installation Issues
- Enable "Install from unknown sources"
- Check device storage space
- Uninstall previous versions

## ✅ Success!

Your APK is ready for testing on real Android devices! 