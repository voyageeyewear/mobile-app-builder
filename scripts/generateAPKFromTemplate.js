#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

console.log('📱 APK Generation from Template Data');
console.log('='.repeat(50));

async function generateAPKFromTemplate(shop, templateId = null) {
  try {
    console.log(`🔍 Fetching templates for shop: ${shop}`);
    
    // Get the mobile app for this shop
    const mobileApp = await prisma.mobileApp.findUnique({
      where: { shop },
      include: {
        pages: {
          include: {
            components: {
              include: {
                component: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
    
    if (!mobileApp) {
      throw new Error(`No mobile app found for shop: ${shop}`);
    }
    
    if (mobileApp.pages.length === 0) {
      throw new Error(`No templates found for shop: ${shop}. Please create and save a template first.`);
    }
    
    // Select template to use
    let selectedTemplate;
    if (templateId) {
      selectedTemplate = mobileApp.pages.find(page => page.id === templateId);
      if (!selectedTemplate) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
    } else {
      // Use the most recently updated template
      selectedTemplate = mobileApp.pages[0];
    }
    
    console.log(`✅ Using template: "${selectedTemplate.name}"`);
    console.log(`📊 Template has ${selectedTemplate.components.length} components`);
    
    // Create a clean Expo project with SDK 49 for better compatibility
    const projectName = `${shop.replace(/[^a-zA-Z0-9]/g, '')}_APK_v2`;
    const projectDir = path.join(process.cwd(), projectName);
    
    // Remove existing project if it exists
    if (await fs.pathExists(projectDir)) {
      console.log('🗑️  Removing existing project...');
      await fs.remove(projectDir);
    }
    
    console.log('📦 Creating new Expo project with SDK 49...');
    execSync(`npx create-expo-app@latest ${projectName} --template blank`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Update to SDK 49 for better build compatibility
    console.log('🔧 Updating to SDK 49 for better Android compatibility...');
    process.chdir(projectDir);
    
    // Update package.json to use SDK 49
    const packageJsonPath = path.join(projectDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = projectName.toLowerCase();
    packageJson.displayName = `${shop} Mobile App`;
    
    // Update dependencies to SDK 49 versions
    packageJson.dependencies = {
      "expo": "~49.0.15",
      "expo-status-bar": "~1.6.0",
      "react": "18.2.0",
      "react-native": "0.72.6"
    };
    
    packageJson.devDependencies = {
      "@babel/core": "^7.20.0"
    };
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    
    // Create app.json for SDK 49
    const appJsonPath = path.join(projectDir, 'app.json');
    const appJson = {
      "expo": {
        "name": `${shop} Mobile App`,
        "slug": projectName.toLowerCase(),
        "version": "1.0.0",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "userInterfaceStyle": "light",
        "splash": {
          "image": "./assets/splash.png",
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        },
        "assetBundlePatterns": [
          "**/*"
        ],
        "ios": {
          "supportsTablet": true
        },
        "android": {
          "adaptiveIcon": {
            "foregroundImage": "./assets/adaptive-icon.png",
            "backgroundColor": "#FFFFFF"
          },
          "package": `com.${shop.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.app`
        },
        "web": {
          "favicon": "./assets/favicon.png"
        }
      }
    };
    
    await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
    
    console.log('📥 Installing SDK 49 dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Create components directory
    const componentsDir = path.join(projectDir, 'src', 'components');
    await fs.ensureDir(componentsDir);
    
    console.log('🧩 Adding components to project...');
    
    // Copy master components
    const masterComponentsDir = path.join(process.cwd(), '..', 'scripts', 'masterTemplate', 'components');
    if (await fs.pathExists(masterComponentsDir)) {
      await fs.copy(masterComponentsDir, componentsDir);
      console.log('✅ Master components copied');
    }
    
    // Generate the App.js with real template data
    await generateAppFromTemplate(projectDir, selectedTemplate, mobileApp);
    
    console.log('🎨 App.js generated with template data');
    
    console.log('📱 Project ready for APK building...');
    
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('');
    console.log('1. Install EAS CLI (if not already installed):');
    console.log('   npm install -g eas-cli');
    console.log('');
    console.log('2. Login to EAS:');
    console.log('   eas login');
    console.log('');
    console.log('3. Configure the build:');
    console.log('   eas build:configure');
    console.log('');
    console.log('4. Build the APK:');
    console.log('   eas build --platform android --profile preview');
    console.log('');
    console.log('📱 Your template data has been converted to a compatible mobile app!');
    console.log(`📂 Project location: ${projectDir}`);
    console.log('');
    console.log('💡 SDK 49 provides better Android build compatibility');
    console.log('');
    
    return projectDir;
    
  } catch (error) {
    console.error('❌ Error generating APK:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function generateAppFromTemplate(projectDir, template, mobileApp) {
  // Component library mapping
  const componentLibrary = {
    'hero-slider': 'HeroSlider',
    'header': 'MobileHeader',
    'product-grid': 'ProductGrid',
    'banner': 'Banner',
    'carousel': 'Carousel',
    'text-block': 'TextBlock',
    'image': 'Image',
    'button': 'Button',
    'countdown': 'Countdown',
    'product-detail-page': 'ProductDetailPage'
  };
  
  // Build imports
  const imports = new Set(['React', 'StatusBar', 'StyleSheet', 'Text', 'View', 'ScrollView']);
  const componentImports = new Set();
  
  // Build components JSX
  let componentsJSX = '';
  
  for (const pageComponent of template.components) {
    const componentType = pageComponent.component.type;
    const componentName = componentLibrary[pageComponent.component.name?.toLowerCase()] || 
                         componentLibrary[componentType?.toLowerCase()] ||
                         'View';
    
    if (componentName !== 'View') {
      componentImports.add(componentName);
    }
    
    const props = pageComponent.props || {};
    const propsString = Object.keys(props).length > 0 ? 
      ` props={${JSON.stringify(props)}}` : '';
    
    componentsJSX += `        <${componentName}${propsString} />\n`;
  }
  
  // If no components, add a welcome message
  if (!componentsJSX.trim()) {
    componentsJSX = '        <Text style={styles.welcomeText}>Welcome to your mobile app!</Text>\n';
  }
  
  // Build import statements
  const importStatements = [
    `import { StatusBar } from 'expo-status-bar';`,
    `import { StyleSheet, Text, View, ScrollView } from 'react-native';`
  ];
  
  componentImports.forEach(comp => {
    importStatements.push(`import ${comp} from './src/components/${comp}';`);
  });
  
  const appJs = `${importStatements.join('\n')}

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>${mobileApp.name}</Text>
        <Text style={styles.subtitle}>Generated from "${template.name}" template</Text>
        
${componentsJSX}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>📱 Your Mobile App</Text>
          <Text style={styles.infoText}>• Generated from your app builder design</Text>
          <Text style={styles.infoText}>• Contains ${template.components.length} component${template.components.length !== 1 ? 's' : ''}</Text>
          <Text style={styles.infoText}>• Native Android performance</Text>
          <Text style={styles.infoText}>• Compatible SDK 49 build</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a202c',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#4a5568',
    fontStyle: 'italic',
  },
  welcomeText: {
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
    color: '#4a5568',
  },
  infoContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4299e1',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2d3748',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4a5568',
    lineHeight: 24,
  },
});`;

  const appJsPath = path.join(projectDir, 'App.js');
  await fs.writeFile(appJsPath, appJs);
}

// Parse command line arguments
const shop = process.argv[2];
const templateId = process.argv[3];

if (!shop) {
  console.error('❌ Please provide shop domain: node generateAPKFromTemplate.js <shop-domain> [template-id]');
  console.error('   Example: node generateAPKFromTemplate.js tryongoeye.myshopify.com');
  process.exit(1);
}

// Run the script
generateAPKFromTemplate(shop, templateId)
  .then((projectDir) => {
    console.log('🎉 APK generation setup complete!');
    console.log(`📂 Project ready at: ${projectDir}`);
  })
  .catch((error) => {
    console.error('💥 APK generation failed:', error);
    process.exit(1);
  });