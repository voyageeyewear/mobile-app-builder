#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

console.log('📱 Building APK from generated mobile app...');

async function buildAPK(appPath, buildType = 'debug') {
  try {
    if (!appPath) {
      throw new Error('App path is required. Usage: npm run mobile:build <app-path> [debug|release]');
    }
    
    const fullAppPath = path.resolve(appPath);
    
    if (!await fs.pathExists(fullAppPath)) {
      throw new Error(`App directory not found: ${fullAppPath}`);
    }
    
    if (!await fs.pathExists(path.join(fullAppPath, 'android'))) {
      throw new Error('Android directory not found. Make sure this is a React Native project.');
    }
    
    console.log(`📱 Building ${buildType} APK for: ${path.basename(fullAppPath)}`);
    console.log('📂 App path:', fullAppPath);
    
    // Check system requirements
    await checkSystemRequirements();
    
    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install --legacy-peer-deps', { cwd: fullAppPath, stdio: 'inherit' });
    
    // Setup Android environment
    await setupAndroidEnvironment(fullAppPath);
    
    // Build APK
    console.log(`🔨 Building ${buildType} APK...`);
    if (buildType === 'release') {
      await buildReleaseAPK(fullAppPath);
    } else {
      await buildDebugAPK(fullAppPath);
    }
    
    // Find and copy APK
    const apkPath = await findAndCopyAPK(fullAppPath, buildType);
    
    console.log('✅ APK built successfully!');
    console.log('📱 APK location:', apkPath);
    
    // Generate QR code for easy testing
    await generateQRCode(apkPath);
    
    return apkPath;
    
  } catch (error) {
    console.error('❌ Error building APK:', error.message);
    process.exit(1);
  }
}

async function checkSystemRequirements() {
  console.log('🔍 Checking system requirements...');
  
  // Check Java
  try {
    const javaVersion = execSync('java -version', { stdio: 'pipe' }).toString();
    console.log('✅ Java found');
  } catch (error) {
    throw new Error('Java not found. Please install Java 11 or higher.');
  }
  
  // Check Android SDK
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!androidHome) {
    console.warn('⚠️  ANDROID_HOME not set. Will attempt to use bundled Android SDK.');
  } else {
    console.log('✅ Android SDK found:', androidHome);
  }
  
  // Check Gradle
  try {
    execSync('gradle --version', { stdio: 'pipe' });
    console.log('✅ Gradle found');
  } catch (error) {
    console.log('ℹ️  Gradle not found globally, will use Gradle wrapper');
  }
}

async function setupAndroidEnvironment(appPath) {
  console.log('⚙️  Setting up Android environment...');
  
  // Generate signing key for release builds
  const keystorePath = path.join(appPath, 'android', 'app', 'release.keystore');
  if (!await fs.pathExists(keystorePath)) {
    console.log('🔑 Generating signing keystore...');
    
    const keystoreConfig = {
      alias: 'app-release-key',
      keystore: 'release.keystore',
      storePassword: 'android',
      keyPassword: 'android',
      validity: '10000',
      keysize: '2048',
      keyalg: 'RSA',
      dname: 'CN=App Builder, OU=Mobile Apps, O=Your Company, L=City, S=State, C=US'
    };
    
    const keytoolCmd = `keytool -genkeypair -v -keystore ${keystoreConfig.keystore} ` +
      `-alias ${keystoreConfig.alias} -keyalg ${keystoreConfig.keyalg} ` +
      `-keysize ${keystoreConfig.keysize} -validity ${keystoreConfig.validity} ` +
      `-storepass ${keystoreConfig.storePassword} -keypass ${keystoreConfig.keyPassword} ` +
      `-dname "${keystoreConfig.dname}"`;
    
    execSync(keytoolCmd, { cwd: path.join(appPath, 'android', 'app'), stdio: 'inherit' });
  }
  
  // Create gradle.properties for signing
  const gradlePropsPath = path.join(appPath, 'android', 'gradle.properties');
  const gradleProps = `
# Signing configs
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=app-release-key
MYAPP_RELEASE_STORE_PASSWORD=android
MYAPP_RELEASE_KEY_PASSWORD=android

# Enable new architecture
newArchEnabled=false

# Use this property to specify which architecture you want to build.
# You can also override it from the CLI using
# ./gradlew <task> -PreactNativeArchitectures=x86_64
reactNativeArchitectures=armeabi-v7a,arm64-v8a

# Use this property to enable support to the new architecture.
# This will allow you to use TurboModules and the Fabric render in
# your application. You should enable this flag either if you want
# to write custom TurboModules/Fabric components OR use libraries that
# are providing them.
newArchEnabled=false

android.useAndroidX=true
android.enableJetifier=true
`.trim();
  
  await fs.writeFile(gradlePropsPath, gradleProps);
  
  // Update build.gradle for signing
  const buildGradlePath = path.join(appPath, 'android', 'app', 'build.gradle');
  if (await fs.pathExists(buildGradlePath)) {
    let buildGradle = await fs.readFile(buildGradlePath, 'utf8');
    
    // Add signing config if not present
    if (!buildGradle.includes('signingConfigs')) {
      const signingConfig = `
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }`;
      
      buildGradle = buildGradle.replace(
        'android {',
        `android {\n${signingConfig}`
      );
      
      // Update buildTypes
      buildGradle = buildGradle.replace(
        /buildTypes\s*{[\s\S]*?}/,
        `buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }`
      );
      
      await fs.writeFile(buildGradlePath, buildGradle);
    }
  }
}

async function buildDebugAPK(appPath) {
  console.log('🔨 Building debug APK...');
  
  const androidPath = path.join(appPath, 'android');
  
  // Use gradlew if available, otherwise use global gradle
  const gradleCommand = await fs.pathExists(path.join(androidPath, 'gradlew')) 
    ? './gradlew' 
    : 'gradle';
  
  // Build debug APK
  execSync(`${gradleCommand} assembleDebug`, {
    cwd: androidPath,
    stdio: 'inherit'
  });
}

async function buildReleaseAPK(appPath) {
  console.log('🔨 Building release APK...');
  
  const androidPath = path.join(appPath, 'android');
  
  // Use gradlew if available, otherwise use global gradle
  const gradleCommand = await fs.pathExists(path.join(androidPath, 'gradlew')) 
    ? './gradlew' 
    : 'gradle';
  
  // Build release APK
  execSync(`${gradleCommand} assembleRelease`, {
    cwd: androidPath,
    stdio: 'inherit'
  });
}

async function findAndCopyAPK(appPath, buildType) {
  console.log('📱 Locating APK file...');
  
  const apkDir = path.join(appPath, 'android', 'app', 'build', 'outputs', 'apk', buildType);
  
  if (!await fs.pathExists(apkDir)) {
    throw new Error(`APK directory not found: ${apkDir}`);
  }
  
  // Find APK file
  const files = await fs.readdir(apkDir);
  const apkFile = files.find(file => file.endsWith('.apk'));
  
  if (!apkFile) {
    throw new Error(`No APK file found in: ${apkDir}`);
  }
  
  const sourcePath = path.join(apkDir, apkFile);
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'generated-apks');
  await fs.ensureDir(outputDir);
  
  // Copy APK with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const appName = path.basename(appPath);
  const outputFileName = `${appName}-${buildType}-${timestamp}.apk`;
  const outputPath = path.join(outputDir, outputFileName);
  
  await fs.copy(sourcePath, outputPath);
  
  // Create latest symlink
  const latestPath = path.join(outputDir, `${appName}-${buildType}-latest.apk`);
  if (await fs.pathExists(latestPath)) {
    await fs.remove(latestPath);
  }
  await fs.copy(outputPath, latestPath);
  
  return outputPath;
}

async function generateQRCode(apkPath) {
  try {
    console.log('📱 Generating QR code for easy mobile download...');
    
    // Create a simple web server to serve the APK
    const serverScript = `
const express = require('express');
const path = require('path');
const app = express();
const port = 3001;

app.use('/apk', express.static('${path.dirname(apkPath)}'));

app.get('/', (req, res) => {
  res.send(\`
    <html>
      <head><title>Download APK</title></head>
      <body style="text-align: center; padding: 50px; font-family: Arial;">
        <h1>📱 Your Mobile App is Ready!</h1>
        <p>Scan the QR code below with your Android device to download and install the APK.</p>
        <div id="qrcode"></div>
        <br>
        <a href="/apk/${path.basename(apkPath)}" style="
          background: #4CAF50; 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 5px;
          font-size: 18px;
        ">📱 Download APK</a>
        <p><small>File: ${path.basename(apkPath)}</small></p>
        
        <h3>📋 Installation Instructions:</h3>
        <ol style="text-align: left; max-width: 500px; margin: 0 auto;">
          <li>Download the APK file</li>
          <li>Enable "Install from unknown sources" in your Android settings</li>
          <li>Open the downloaded APK file</li>
          <li>Follow the installation prompts</li>
          <li>Launch your new mobile app!</li>
        </ol>
        
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        <script>
          const downloadUrl = window.location.origin + '/apk/${path.basename(apkPath)}';
          QRCode.toCanvas(document.getElementById('qrcode'), downloadUrl, function (error) {
            if (error) console.error(error);
            console.log('QR code generated!');
          });
        </script>
      </body>
    </html>
  \`);
});

app.listen(port, () => {
  console.log(\`🌐 APK download server running at http://localhost:\${port}\`);
  console.log(\`📱 Direct download: http://localhost:\${port}/apk/${path.basename(apkPath)}\`);
  console.log(\`📱 Scan QR code at: http://localhost:\${port}\`);
});
`;
    
    const serverPath = path.join(path.dirname(apkPath), 'download-server.js');
    await fs.writeFile(serverPath, serverScript);
    
    console.log('🌐 APK download server created!');
    console.log('🚀 To start the download server, run:');
    console.log(`   cd ${path.dirname(apkPath)}`);
    console.log('   node download-server.js');
    
  } catch (error) {
    console.warn('⚠️  Could not generate QR code:', error.message);
  }
}

// Parse command line arguments
const appPath = process.argv[2];
const buildType = process.argv[3] || 'debug';

if (!appPath) {
  console.error('❌ Please provide app path: npm run mobile:build <app-path> [debug|release]');
  console.error('   Example: npm run mobile:build ./generated-apps/myshop-2024-01-01T12-00-00-000Z');
  process.exit(1);
}

if (!['debug', 'release'].includes(buildType)) {
  console.error('❌ Build type must be "debug" or "release"');
  process.exit(1);
}

buildAPK(appPath, buildType); 