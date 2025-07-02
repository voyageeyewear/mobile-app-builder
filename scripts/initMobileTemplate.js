#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Initializing React Native mobile template...');

const mobileDir = path.join(process.cwd(), 'mobile-template');
const templateDir = path.join(mobileDir, 'template');

async function initMobileTemplate() {
  try {
    // Create mobile-template directory
    await fs.ensureDir(mobileDir);
    
    console.log('📱 Creating React Native template...');
    
    // Check if React Native CLI is installed
    try {
      execSync('npx react-native --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing React Native CLI...');
      execSync('npm install -g @react-native-community/cli', { stdio: 'inherit' });
    }
    
    // Create React Native project if it doesn't exist
    if (!await fs.pathExists(templateDir)) {
      console.log('📱 Creating React Native project...');
      
      try {
        // Try to create with React Native CLI
        execSync(`npx @react-native-community/cli init template`, { 
          cwd: mobileDir,
          stdio: 'inherit' 
        });
        
        // Move to final location if created successfully
        const createdDir = path.join(mobileDir, 'template');
        if (await fs.pathExists(createdDir)) {
          await fs.move(createdDir, templateDir);
        }
      } catch (error) {
        console.log('ℹ️  CLI init failed, creating basic template structure...');
        await createBasicTemplate(templateDir);
      }
    }
    
    // Install additional dependencies for app generation
    console.log('📦 Installing mobile dependencies...');
    const additionalDeps = [
      'react-native-splash-screen',
      'react-native-push-notification',
      'react-native-orientation-locker',
      'react-native-safe-area-context',
      '@react-navigation/native',
      '@react-navigation/stack',
      '@react-navigation/bottom-tabs',
      'react-native-gesture-handler',
      'react-native-reanimated',
      'react-native-screens',
      'react-native-vector-icons',
      'react-native-fast-image',
      'react-native-webview',
      'react-native-device-info'
    ];
    
    execSync(`cd ${templateDir} && npm install ${additionalDeps.join(' ')}`, { stdio: 'inherit' });
    
    // Create custom components directory structure
    const componentsDir = path.join(templateDir, 'src', 'components');
    await fs.ensureDir(componentsDir);
    
    // Create navigation structure
    const navigationDir = path.join(templateDir, 'src', 'navigation');
    await fs.ensureDir(navigationDir);
    
    // Create services directory
    const servicesDir = path.join(templateDir, 'src', 'services');
    await fs.ensureDir(servicesDir);
    
    console.log('✅ React Native template initialized successfully!');
    console.log('📂 Template location:', templateDir);
    
  } catch (error) {
    console.error('❌ Error initializing mobile template:', error.message);
    process.exit(1);
  }
}

async function createBasicTemplate(templateDir) {
  console.log('📱 Creating basic React Native template structure...');
  
  await fs.ensureDir(templateDir);
  
  // Create package.json
  const packageJson = {
    name: "template",
    version: "0.0.1",
    private: true,
    scripts: {
      android: "react-native run-android",
      ios: "react-native run-ios",
      lint: "eslint .",
      start: "react-native start",
      test: "jest"
    },
    dependencies: {
      "react": "18.2.0",
      "react-native": "0.73.0"
    },
    devDependencies: {
      "@babel/core": "^7.20.0",
      "@babel/preset-env": "^7.20.0",
      "@babel/runtime": "^7.20.0",
      "@react-native/babel-preset": "0.73.0",
      "@react-native/eslint-config": "0.73.0",
      "@react-native/metro-config": "0.73.0",
      "@react-native/typescript-config": "0.73.0",
      "babel-jest": "^29.6.3",
      "eslint": "^8.19.0",
      "jest": "^29.6.3",
      "metro-react-native-babel-preset": "0.77.0",
      "prettier": "2.8.8",
      "react-test-renderer": "18.2.0"
    },
    engines: {
      node: ">=18"
    }
  };
  
  await fs.writeJson(path.join(templateDir, 'package.json'), packageJson, { spaces: 2 });
  
  // Create app.json
  const appJson = {
    name: "template",
    displayName: "template"
  };
  
  await fs.writeJson(path.join(templateDir, 'app.json'), appJson, { spaces: 2 });
  
  // Create basic App.js
  const appJs = `
import React from 'react';
import {SafeAreaView, ScrollView, Text, View} from 'react-native';

function App() {
  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={{padding: 20}}>
          <Text style={{fontSize: 24, fontWeight: 'bold'}}>
            Welcome to React Native!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
`;
  
  await fs.writeFile(path.join(templateDir, 'App.js'), appJs);
  
  // Create android directory structure
  const androidDir = path.join(templateDir, 'android');
  await fs.ensureDir(path.join(androidDir, 'app', 'src', 'main', 'java', 'com', 'template'));
  await fs.ensureDir(path.join(androidDir, 'app', 'src', 'main', 'res'));
  
  // Create basic android/build.gradle
  const rootBuildGradle = `
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "25.1.8937393"
        kotlinVersion = "1.8.0"
    }
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
    }
}
`;
  
  await fs.writeFile(path.join(androidDir, 'build.gradle'), rootBuildGradle);
  
  // Create android/app/build.gradle
  const appBuildGradle = `
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

android {
    ndkVersion rootProject.ext.ndkVersion
    compileSdkVersion rootProject.ext.compileSdkVersion
    
    namespace "com.template"
    defaultConfig {
        applicationId "com.template"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
}
`;
  
  await fs.writeFile(path.join(androidDir, 'app', 'build.gradle'), appBuildGradle);
  
  // Create AndroidManifest.xml
  const androidManifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:theme="@style/AppTheme">
      <activity
        android:name=".MainActivity"
        android:exported="true"
        android:launchMode="singleTask"
        android:theme="@style/LaunchTheme">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>
    </application>
</manifest>
`;
  
  await fs.writeFile(path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml'), androidManifest);
  
  console.log('✅ Basic React Native template created!');
}

initMobileTemplate(); 