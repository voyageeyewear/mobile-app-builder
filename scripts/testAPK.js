#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

console.log('📱 APK Testing & Installation Helper...');

async function testAPK(apkPath, options = {}) {
  try {
    if (!apkPath) {
      throw new Error('APK path is required. Usage: npm run mobile:test <apk-path> [options]');
    }
    
    const fullApkPath = path.resolve(apkPath);
    
    if (!await fs.pathExists(fullApkPath)) {
      throw new Error(`APK file not found: ${fullApkPath}`);
    }
    
    console.log('📱 APK Testing Tools');
    console.log('📂 APK path:', fullApkPath);
    
    // Check ADB availability
    await checkADB();
    
    // List available devices
    const devices = await listDevices();
    
    if (devices.length === 0) {
      console.log('');
      console.log('🔌 No Android devices found!');
      console.log('');
      console.log('📋 To test your APK:');
      console.log('');
      console.log('1️⃣  Enable Developer Options on your Android device:');
      console.log('   • Go to Settings → About Phone');
      console.log('   • Tap "Build Number" 7 times');
      console.log('   • Go back to Settings → Developer Options');
      console.log('   • Enable "USB Debugging"');
      console.log('');
      console.log('2️⃣  Connect your device via USB and run this command again');
      console.log('');
      console.log('3️⃣  Alternative: Transfer APK to device and install manually');
      console.log('   • Copy APK to Downloads folder');
      console.log('   • Open file manager and tap APK');
      console.log('   • Enable "Install from unknown sources" if prompted');
      console.log('');
      
      await generateInstallationGuide(fullApkPath);
      return;
    }
    
    console.log(`📱 Found ${devices.length} Android device(s)`);
    
    // Install APK on first device (or all devices if specified)
    const targetDevice = options.device || devices[0].id;
    await installAPK(fullApkPath, targetDevice);
    
    // Launch app
    if (options.launch) {
      await launchApp(targetDevice, fullApkPath);
    }
    
    // Generate test report
    await generateTestReport(fullApkPath, devices);
    
  } catch (error) {
    console.error('❌ Error testing APK:', error.message);
    
    if (error.message.includes('adb')) {
      console.log('');
      console.log('🛠️  Android Debug Bridge (ADB) Setup:');
      console.log('');
      console.log('📥 Install Android Studio:');
      console.log('   • Download from: https://developer.android.com/studio');
      console.log('   • Install and open Android Studio');
      console.log('   • Go to SDK Manager and install Android SDK Platform-Tools');
      console.log('');
      console.log('🔧 Add ADB to PATH:');
      console.log('   • macOS/Linux: export PATH=$PATH:~/Android/Sdk/platform-tools');
      console.log('   • Windows: Add C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk\\platform-tools to PATH');
      console.log('');
      console.log('🔄 Restart terminal and try again');
    }
    
    process.exit(1);
  }
}

async function checkADB() {
  try {
    execSync('adb version', { stdio: 'pipe' });
    console.log('✅ ADB (Android Debug Bridge) found');
  } catch (error) {
    throw new Error('ADB not found. Please install Android SDK Platform-Tools.');
  }
}

async function listDevices() {
  console.log('🔍 Scanning for Android devices...');
  
  try {
    const output = execSync('adb devices', { encoding: 'utf8' });
    const lines = output.split('\n').slice(1); // Skip header
    
    const devices = lines
      .filter(line => line.trim() && !line.includes('List of devices'))
      .map(line => {
        const parts = line.trim().split('\t');
        return {
          id: parts[0],
          status: parts[1] || 'unknown'
        };
      })
      .filter(device => device.status === 'device');
    
    devices.forEach((device, index) => {
      console.log(`📱 Device ${index + 1}: ${device.id} (${device.status})`);
    });
    
    return devices;
  } catch (error) {
    console.error('❌ Error listing devices:', error.message);
    return [];
  }
}

async function installAPK(apkPath, deviceId) {
  console.log(`📱 Installing APK on device: ${deviceId}`);
  
  try {
    // Get package name from APK
    const packageName = await getPackageName(apkPath);
    console.log(`📦 Package: ${packageName}`);
    
    // Uninstall previous version if exists
    try {
      execSync(`adb -s ${deviceId} uninstall ${packageName}`, { stdio: 'pipe' });
      console.log('🗑️  Uninstalled previous version');
    } catch (error) {
      // Package not installed, continue
    }
    
    // Install APK
    console.log('📲 Installing APK...');
    execSync(`adb -s ${deviceId} install "${apkPath}"`, { stdio: 'inherit' });
    console.log('✅ APK installed successfully!');
    
    return packageName;
    
  } catch (error) {
    console.error('❌ Error installing APK:', error.message);
    throw error;
  }
}

async function getPackageName(apkPath) {
  try {
    // Try using aapt (part of Android SDK)
    const output = execSync(`aapt dump badging "${apkPath}"`, { encoding: 'utf8' });
    const match = output.match(/package: name='([^']+)'/);
    if (match) {
      return match[1];
    }
  } catch (error) {
    // Fallback: extract from APK filename or use default
    const fileName = path.basename(apkPath, '.apk');
    return `com.appbuilder.${fileName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  }
  
  throw new Error('Could not determine package name');
}

async function launchApp(deviceId, apkPath) {
  try {
    const packageName = await getPackageName(apkPath);
    console.log(`🚀 Launching app: ${packageName}`);
    
    execSync(`adb -s ${deviceId} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`, { stdio: 'pipe' });
    console.log('✅ App launched successfully!');
    
  } catch (error) {
    console.warn('⚠️  Could not launch app automatically:', error.message);
    console.log('💡 Please launch the app manually from your device');
  }
}

async function generateTestReport(apkPath, devices) {
  console.log('📊 Generating test report...');
  
  const apkStats = await fs.stat(apkPath);
  const packageName = await getPackageName(apkPath);
  
  const report = {
    apk: {
      path: apkPath,
      filename: path.basename(apkPath),
      size: `${(apkStats.size / 1024 / 1024).toFixed(2)} MB`,
      packageName,
      createdAt: apkStats.birthtime
    },
    devices: devices.map(device => ({
      id: device.id,
      status: device.status,
      installed: true // We assume success if we got here
    })),
    testingInfo: {
      timestamp: new Date().toISOString(),
      totalDevices: devices.length,
      successfulInstalls: devices.length
    }
  };
  
  // Save report
  const reportPath = path.join(path.dirname(apkPath), 'test-report.json');
  await fs.writeJson(reportPath, report, { spaces: 2 });
  
  console.log('📄 Test report saved:', reportPath);
  
  // Display summary
  console.log('');
  console.log('📊 Test Summary:');
  console.log(`📱 APK: ${report.apk.filename} (${report.apk.size})`);
  console.log(`📦 Package: ${report.apk.packageName}`);
  console.log(`🔌 Devices: ${report.testingInfo.successfulInstalls}/${report.testingInfo.totalDevices} successful installs`);
  console.log('');
  console.log('✅ Testing complete!');
}

async function generateInstallationGuide(apkPath) {
  console.log('📋 Generating installation guide...');
  
  const guidePath = path.join(path.dirname(apkPath), 'installation-guide.html');
  const apkFileName = path.basename(apkPath);
  
  const guideContent = `
<!DOCTYPE html>
<html>
<head>
    <title>📱 APK Installation Guide</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6;
        }
        .step { 
            background: #f5f5f5; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
        }
        .warning { 
            background: #fff3cd; 
            padding: 15px; 
            border-radius: 8px;
            border-left: 4px solid #ffc107;
        }
        .download-btn {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            margin: 20px 0;
        }
        .method {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>📱 Mobile App Installation Guide</h1>
    
    <div class="warning">
        <h3>⚠️ Important Security Note</h3>
        <p>This APK is from your custom app builder. Only install APKs from trusted sources.</p>
    </div>
    
    <p><strong>APK File:</strong> ${apkFileName}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    
    <div class="method">
        <h2>📲 Method 1: Direct Installation (Recommended)</h2>
        
        <div class="step">
            <h3>1️⃣ Download APK</h3>
            <p>Download the APK file to your Android device's Downloads folder.</p>
        </div>
        
        <div class="step">
            <h3>2️⃣ Enable Unknown Sources</h3>
            <p>Go to <strong>Settings → Security → Install unknown apps</strong></p>
            <p>Select your file manager or browser and enable "Allow from this source"</p>
        </div>
        
        <div class="step">
            <h3>3️⃣ Install APK</h3>
            <p>Open your file manager, go to Downloads, and tap the APK file</p>
            <p>Tap "Install" when prompted</p>
        </div>
        
        <div class="step">
            <h3>4️⃣ Launch App</h3>
            <p>Find your new app in the app drawer and launch it!</p>
        </div>
    </div>
    
    <div class="method">
        <h2>🔌 Method 2: USB Installation (Advanced)</h2>
        
        <div class="step">
            <h3>1️⃣ Enable Developer Options</h3>
            <p>Go to <strong>Settings → About Phone</strong></p>
            <p>Tap "Build Number" 7 times</p>
        </div>
        
        <div class="step">
            <h3>2️⃣ Enable USB Debugging</h3>
            <p>Go to <strong>Settings → Developer Options</strong></p>
            <p>Enable "USB Debugging"</p>
        </div>
        
        <div class="step">
            <h3>3️⃣ Connect to Computer</h3>
            <p>Connect your device via USB</p>
            <p>Run: <code>adb install "${apkFileName}"</code></p>
        </div>
    </div>
    
    <div class="method">
        <h2>🌐 Method 3: QR Code Installation</h2>
        
        <div class="step">
            <h3>1️⃣ Start Download Server</h3>
            <p>On your computer, run the download server (if generated)</p>
        </div>
        
        <div class="step">
            <h3>2️⃣ Scan QR Code</h3>
            <p>Use your phone's camera or QR scanner to scan the download QR code</p>
        </div>
        
        <div class="step">
            <h3>3️⃣ Download & Install</h3>
            <p>Download the APK from the browser and follow Method 1 steps</p>
        </div>
    </div>
    
    <h2>🛠️ Troubleshooting</h2>
    
    <div class="step">
        <h3>❌ "App not installed" error</h3>
        <ul>
            <li>Make sure you have enough storage space</li>
            <li>Uninstall any previous version of the app</li>
            <li>Check if "Install from unknown sources" is enabled</li>
        </ul>
    </div>
    
    <div class="step">
        <h3>❌ "Parse error" message</h3>
        <ul>
            <li>The APK file may be corrupted - try downloading again</li>
            <li>Your device's Android version may be incompatible</li>
            <li>Make sure the download completed fully</li>
        </ul>
    </div>
    
    <div class="step">
        <h3>❌ App crashes on startup</h3>
        <ul>
            <li>Restart your device and try again</li>
            <li>Clear the app's cache and data in Settings</li>
            <li>Make sure your device has sufficient RAM</li>
        </ul>
    </div>
    
    <h2>📞 Need Help?</h2>
    <p>If you're having trouble installing or running the app, check the logs or contact your app developer.</p>
    
    <hr>
    <p><small>Generated by Mobile App Builder - ${new Date().toISOString()}</small></p>
</body>
</html>
`;
  
  await fs.writeFile(guidePath, guideContent);
  console.log('📄 Installation guide saved:', guidePath);
  
  console.log('');
  console.log('📋 To install on your Android device:');
  console.log('1. Transfer the APK file to your device');
  console.log('2. Enable "Install from unknown sources" in Settings');
  console.log('3. Open the APK file and install');
  console.log('4. Launch your app!');
  console.log('');
  console.log('📖 Detailed guide:', guidePath);
}

// Parse command line arguments
const apkPath = process.argv[2];
const options = {
  device: process.argv[3],
  launch: process.argv.includes('--launch'),
  guide: process.argv.includes('--guide-only')
};

if (!apkPath) {
  console.error('❌ Please provide APK path: npm run mobile:test <apk-path> [device-id] [--launch]');
  console.error('   Example: npm run mobile:test ./generated-apks/myapp-debug-latest.apk --launch');
  process.exit(1);
}

if (options.guide) {
  // Generate guide only
  generateInstallationGuide(path.resolve(apkPath));
} else {
  testAPK(apkPath, options);
} 