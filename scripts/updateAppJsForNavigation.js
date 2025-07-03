#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Updating all mobile apps to use navigation...');

async function updateAppJsFiles() {
  const generatedAppsDir = path.join(__dirname, '..', 'generated-apps');
  
  if (!await fs.pathExists(generatedAppsDir)) {
    console.log('❌ Generated apps directory not found');
    return;
  }
  
  const appDirs = await fs.readdir(generatedAppsDir);
  let updatedCount = 0;
  
  for (const appDir of appDirs) {
    const appPath = path.join(generatedAppsDir, appDir);
    const appJsPath = path.join(appPath, 'App.js');
    
    if (await fs.pathExists(appJsPath)) {
      try {
        console.log(`📝 Updating ${appDir}...`);
        
        // Read the current App.js
        let content = await fs.readFile(appJsPath, 'utf8');
        
        // Check if it's already using navigation
        if (content.includes('AppNavigator')) {
          console.log(`✅ ${appDir} already using navigation`);
          continue;
        }
        
        // Extract the LIVE_CONFIG_URL
        const urlMatch = content.match(/const LIVE_CONFIG_URL = '([^']+)'/);
        const liveConfigUrl = urlMatch ? urlMatch[1] : 'http://localhost:63451/api/live-config/tryongoeye.myshopify.com';
        
        // Create the new App.js content
        const newContent = `import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppNavigator from './src/components/AppNavigator';

const LIVE_CONFIG_URL = '${liveConfigUrl}';

const App = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      const response = await fetch(\`\${LIVE_CONFIG_URL}?t=\${Date.now()}\`);
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}\`);
      }
      const data = await response.json();
      console.log('📱 Mobile App received config:', data);
      console.log('📱 hasApp:', data.hasApp);
      console.log('📱 Components count:', data.components?.length);
      console.log('📱 Products count:', data.products?.length);
      setConfig(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchConfig, 2000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.indicator}>🔄 Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.indicator}>❌ Error: {error}</Text>
        </View>
      </View>
    );
  }

  return <AppNavigator config={config} products={config?.products || []} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  indicator: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default App;
`;
        
        // Write the new content
        await fs.writeFile(appJsPath, newContent);
        updatedCount++;
        console.log(`✅ Updated ${appDir}`);
        
      } catch (error) {
        console.error(`❌ Failed to update ${appDir}:`, error.message);
      }
    }
  }
  
  console.log(`🎉 Updated ${updatedCount} mobile apps with navigation`);
}

updateAppJsFiles().catch(console.error); 