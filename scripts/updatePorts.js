import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to get listening ports for node processes
function getNodePorts() {
  try {
    const output = execSync('lsof -i -P | grep node | grep LISTEN', { encoding: 'utf-8' });
    const lines = output.split('\n').filter(line => line.trim());
    
    const ports = lines.map(line => {
      const match = line.match(/:(\d+)\s+\(LISTEN\)/);
      return match ? parseInt(match[1]) : null;
    }).filter(port => port !== null);
    
    return [...new Set(ports)].sort((a, b) => a - b); // Remove duplicates and sort
  } catch (error) {
    console.log('⚠️ Could not detect ports, servers might not be running yet');
    return [];
  }
}

// Function to detect main app port (usually the highest port or one that serves GraphQL)
function detectMainAppPort(ports) {
  // Filter out common ports that are not the main app
  const filtered = ports.filter(port => 
    port !== 3001 && // Mobile preview
    port !== 3000 && // Common dev port
    port > 50000     // Shopify tunnel ports are usually high
  );
  
  // Return the highest port (likely the main app)
  return filtered.length > 0 ? Math.max(...filtered) : null;
}

// Function to find all mobile app directories
function findMobileAppDirs() {
  const generatedAppsDir = path.join(__dirname, '..', 'generated-apps');
  
  if (!fs.existsSync(generatedAppsDir)) {
    console.log('📁 No generated-apps directory found');
    return [];
  }
  
  const dirs = fs.readdirSync(generatedAppsDir)
    .filter(dir => {
      const fullPath = path.join(generatedAppsDir, dir);
      return fs.statSync(fullPath).isDirectory() && 
             fs.existsSync(path.join(fullPath, 'App.js'));
    })
    .map(dir => path.join(generatedAppsDir, dir));
  
  return dirs;
}

// Function to update App.js with new port
function updateAppJS(appDir, newPort) {
  const appJsPath = path.join(appDir, 'App.js');
  
  if (!fs.existsSync(appJsPath)) {
    console.log(`❌ App.js not found in ${appDir}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(appJsPath, 'utf-8');
    
    // Find the LIVE_CONFIG_URL line
    const urlRegex = /const LIVE_CONFIG_URL = 'http:\/\/localhost:(\d+)\/api\/live-config\/([^']+)';/;
    const match = content.match(urlRegex);
    
    if (match) {
      const oldPort = match[1];
      const shop = match[2];
      
      if (oldPort !== newPort.toString()) {
        const newUrl = `const LIVE_CONFIG_URL = 'http://localhost:${newPort}/api/live-config/${shop}';`;
        content = content.replace(urlRegex, newUrl);
        
        fs.writeFileSync(appJsPath, content, 'utf-8');
        console.log(`✅ Updated ${path.basename(appDir)}: ${oldPort} → ${newPort}`);
        return true;
      } else {
        console.log(`✓ ${path.basename(appDir)}: Port ${newPort} already correct`);
        return false;
      }
    } else {
      console.log(`⚠️ Could not find LIVE_CONFIG_URL in ${path.basename(appDir)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${appDir}:`, error.message);
    return false;
  }
}

// Function to update generateMobileApp.js template
function updateGenerateTemplate(newPort) {
  const templatePath = path.join(__dirname, 'generateMobileApp.js');
  
  if (!fs.existsSync(templatePath)) {
    console.log('❌ generateMobileApp.js not found');
    return false;
  }
  
  try {
    let content = fs.readFileSync(templatePath, 'utf-8');
    
    // Find the template URL line
    const urlRegex = /const LIVE_CONFIG_URL = 'http:\/\/localhost:(\d+)\/api\/live-config\/\$\{config\.shop\}';/;
    const match = content.match(urlRegex);
    
    if (match) {
      const oldPort = match[1];
      
      if (oldPort !== newPort.toString()) {
        const newUrl = `const LIVE_CONFIG_URL = 'http://localhost:${newPort}/api/live-config/\${config.shop}';`;
        content = content.replace(urlRegex, newUrl);
        
        fs.writeFileSync(templatePath, content, 'utf-8');
        console.log(`✅ Updated template: ${oldPort} → ${newPort}`);
        return true;
      } else {
        console.log(`✓ Template: Port ${newPort} already correct`);
        return false;
      }
    } else {
      console.log('⚠️ Could not find LIVE_CONFIG_URL in template');
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating template:', error.message);
    return false;
  }
}

// Main function
function updatePorts() {
  console.log('🔍 Detecting server ports...');
  
  const ports = getNodePorts();
  console.log('📡 Found node processes on ports:', ports);
  
  if (ports.length === 0) {
    console.log('❌ No node servers detected. Make sure the main app server is running.');
    process.exit(1);
  }
  
  const mainAppPort = detectMainAppPort(ports);
  
  if (!mainAppPort) {
    console.log('❌ Could not detect main app port. Available ports:', ports);
    process.exit(1);
  }
  
  console.log(`🎯 Detected main app port: ${mainAppPort}`);
  
  // Update all mobile app directories
  const mobileAppDirs = findMobileAppDirs();
  console.log(`📱 Found ${mobileAppDirs.length} mobile app(s)`);
  
  let updatedCount = 0;
  
  mobileAppDirs.forEach(dir => {
    if (updateAppJS(dir, mainAppPort)) {
      updatedCount++;
    }
  });
  
  // Update the template for future apps
  if (updateGenerateTemplate(mainAppPort)) {
    updatedCount++;
  }
  
  if (updatedCount > 0) {
    console.log(`🎉 Successfully updated ${updatedCount} file(s) with port ${mainAppPort}`);
  } else {
    console.log('✅ All ports are already up to date');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePorts();
}

export { updatePorts, getNodePorts, detectMainAppPort }; 