import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MASTER_COMPONENTS_DIR = path.join(__dirname, 'masterTemplate', 'components');
const GENERATED_APPS_DIR = path.join(__dirname, '..', 'generated-apps');

// Master component definitions - these are your working, tested components
const MASTER_COMPONENTS = {
  'MobileHeader.js': 'generated-apps/tryongoeye.myshopify.com-2025-07-02T12-31-12-811Z/src/components/MobileHeader.js',
  'ProductGrid.js': 'generated-apps/tryongoeye.myshopify.com-2025-07-03T08-52-43-330Z/src/components/ProductGrid.js',
  'HeroSlider.js': 'generated-apps/tryongoeye.myshopify.com-2025-07-03T09-13-49-779Z/src/components/HeroSlider.js'
};

// Create master template directory if it doesn't exist
function ensureMasterTemplateDir() {
  if (!fs.existsSync(MASTER_COMPONENTS_DIR)) {
    fs.mkdirSync(MASTER_COMPONENTS_DIR, { recursive: true });
    console.log('📁 Created master template directory');
  }
}

// Backup working components to master template
function backupMasterComponents() {
  console.log('💾 Backing up master components...');
  
  for (const [componentName, sourcePath] of Object.entries(MASTER_COMPONENTS)) {
    const fullSourcePath = path.join(__dirname, '..', sourcePath);
    const masterPath = path.join(MASTER_COMPONENTS_DIR, componentName);
    
    if (fs.existsSync(fullSourcePath)) {
      fs.copyFileSync(fullSourcePath, masterPath);
      console.log(`✅ Backed up ${componentName}`);
    } else {
      console.log(`⚠️  Source not found: ${sourcePath}`);
    }
  }
}

// Sync master components to all generated apps
function syncToAllApps() {
  console.log('🔄 Syncing master components to all mobile apps...');
  
  if (!fs.existsSync(GENERATED_APPS_DIR)) {
    console.log('❌ Generated apps directory not found');
    return;
  }
  
  const apps = fs.readdirSync(GENERATED_APPS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  let updatedCount = 0;
  
  for (const appName of apps) {
    const appComponentsDir = path.join(GENERATED_APPS_DIR, appName, 'src', 'components');
    
    if (fs.existsSync(appComponentsDir)) {
      for (const componentName of Object.keys(MASTER_COMPONENTS)) {
        const masterPath = path.join(MASTER_COMPONENTS_DIR, componentName);
        const targetPath = path.join(appComponentsDir, componentName);
        
        if (fs.existsSync(masterPath)) {
          fs.copyFileSync(masterPath, targetPath);
          updatedCount++;
        }
      }
    }
  }
  
  console.log(`✅ Updated ${updatedCount} components across ${apps.length} mobile apps`);
}

// Sync master components to a specific app
function syncToApp(appName) {
  console.log(`🎯 Syncing master components to ${appName}...`);
  
  const appComponentsDir = path.join(GENERATED_APPS_DIR, appName, 'src', 'components');
  
  if (!fs.existsSync(appComponentsDir)) {
    console.log(`❌ App components directory not found: ${appComponentsDir}`);
    return;
  }
  
  let updatedCount = 0;
  
  for (const componentName of Object.keys(MASTER_COMPONENTS)) {
    const masterPath = path.join(MASTER_COMPONENTS_DIR, componentName);
    const targetPath = path.join(appComponentsDir, componentName);
    
    if (fs.existsSync(masterPath)) {
      fs.copyFileSync(masterPath, targetPath);
      console.log(`✅ Updated ${componentName} in ${appName}`);
      updatedCount++;
    }
  }
  
  console.log(`🎉 Updated ${updatedCount} components in ${appName}`);
}

// Fix App.js to ensure it passes products to components
function fixAppJs(appName) {
  const appJsPath = path.join(GENERATED_APPS_DIR, appName, 'App.js');
  
  if (!fs.existsSync(appJsPath)) {
    console.log(`❌ App.js not found for ${appName}`);
    return;
  }
  
  let content = fs.readFileSync(appJsPath, 'utf8');
  
  // Check if products are already being passed
  if (content.includes('products={config.products')) {
    console.log(`✅ ${appName} App.js already has products prop`);
    return;
  }
  
  // Add products prop
  content = content.replace(
    /props={component\.props \|\| {}}$/gm,
    'props={component.props || {}}\n        products={config.products || []}'
  );
  
  // Fix data structure check
  content = content.replace(
    /!config\.pages \|\| config\.pages\.length === 0/,
    '!config.hasApp'
  );
  
  content = content.replace(
    /const currentPage = config\.pages\[0\];.*\n.*const components = currentPage\.components \|\| \[\];/,
    'const components = config.components || [];'
  );
  
  fs.writeFileSync(appJsPath, content);
  console.log(`✅ Fixed App.js for ${appName}`);
}

// Main function
function main() {
  const command = process.argv[2];
  const appName = process.argv[3];
  
  ensureMasterTemplateDir();
  
  switch (command) {
    case 'backup':
      backupMasterComponents();
      break;
      
    case 'sync-all':
      syncToAllApps();
      break;
      
    case 'sync-app':
      if (!appName) {
        console.log('❌ Please provide app name: npm run sync-components sync-app <app-name>');
        return;
      }
      syncToApp(appName);
      fixAppJs(appName);
      break;
      
    case 'fix-current':
      // Find currently running app and fix it
      const runningApp = 'tryongoeye.myshopify.com-2025-07-03T08-52-43-330Z';
      syncToApp(runningApp);
      fixAppJs(runningApp);
      break;
      
    default:
      console.log(`
🛠️  Master Component Sync Tool

Usage:
  npm run sync-components backup     - Backup working components to master template
  npm run sync-components sync-all  - Sync master components to all mobile apps  
  npm run sync-components sync-app <name> - Sync to specific app
  npm run sync-components fix-current - Fix currently running app

This prevents your header design from being lost when creating new components!
      `);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { syncToApp, syncToAllApps, backupMasterComponents }; 