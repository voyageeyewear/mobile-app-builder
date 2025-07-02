#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🚀 Generating mobile app from builder configuration...');

async function generateMobileApp(shopOrAppId) {
  try {
    // Get mobile app configuration from database
    console.log('📋 Fetching app configuration...');
    
    let mobileApp;
    if (shopOrAppId.includes('.')) {
      // It's a shop domain
      mobileApp = await prisma.mobileApp.findUnique({
        where: { shop: shopOrAppId },
        include: {
          activeTheme: true,
          pages: {
            include: {
              components: {
                include: {
                  component: true
                },
                orderBy: { order: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });
    } else {
      // It's an app ID
      mobileApp = await prisma.mobileApp.findUnique({
        where: { id: shopOrAppId },
        include: {
          activeTheme: true,
          pages: {
            include: {
              components: {
                include: {
                  component: true
                },
                orderBy: { order: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });
    }
    
    if (!mobileApp) {
      throw new Error(`Mobile app not found for: ${shopOrAppId}`);
    }
    
    console.log(`📱 Found app: ${mobileApp.name}`);
    console.log(`🎨 Theme: ${mobileApp.activeTheme?.name || 'Default'}`);
    console.log(`📄 Pages: ${mobileApp.pages.length}`);
    
    // Create generated app directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const appDir = path.join(process.cwd(), 'generated-apps', `${mobileApp.shop}-${timestamp}`);
    const templateDir = path.join(process.cwd(), 'mobile-template', 'template');
    
    if (!await fs.pathExists(templateDir)) {
      throw new Error('React Native template not found. Run: npm run mobile:init');
    }
    
    console.log('📁 Creating app directory...');
    await fs.ensureDir(appDir);
    
    // Copy React Native template
    console.log('📱 Copying React Native template...');
    await fs.copy(templateDir, appDir);
    
    // Generate app configuration
    const appConfig = {
      name: mobileApp.name,
      bundleId: mobileApp.bundleId,
      packageName: mobileApp.packageName || mobileApp.bundleId.replace(/\./g, '_').toLowerCase(),
      shop: mobileApp.shop,
      theme: mobileApp.activeTheme || {
        primaryColor: '#007AFF',
        secondaryColor: '#5856D6',
        backgroundColor: '#FFFFFF',
        textColor: '#000000'
      },
      pages: mobileApp.pages.map(page => ({
        id: page.id,
        name: page.name,
        slug: page.slug,
        type: page.type,
        isHomePage: page.isHomePage,
        components: page.components.map(pc => ({
          id: pc.id,
          type: pc.component.type,
          props: pc.props,
          styles: pc.styles,
          order: pc.order
        }))
      }))
    };
    
    // Write app configuration
    await fs.writeJson(path.join(appDir, 'app-config.json'), appConfig, { spaces: 2 });
    
    // Generate component files
    console.log('🧩 Generating components...');
    await generateComponents(appDir, appConfig);
    
    // Generate navigation
    console.log('🧭 Generating navigation...');
    await generateNavigation(appDir, appConfig);
    
    // Generate theme
    console.log('🎨 Applying theme...');
    await generateTheme(appDir, appConfig.theme);
    
    // Update app metadata
    console.log('📝 Updating app metadata...');
    await updateAppMetadata(appDir, appConfig);
    
    // Generate main App.js
    console.log('📱 Generating main App component...');
    await generateMainApp(appDir, appConfig);
    
    // Setup React Native Web
    console.log('🌐 Setting up React Native Web...');
    await setupReactNativeWeb(appDir, appConfig);
    
    console.log('✅ Mobile app generated successfully!');
    console.log('📂 App location:', appDir);
    console.log('🚀 Next steps:');
    console.log('   1. cd', path.relative(process.cwd(), appDir));
    console.log('   2. npm run web          (for web testing)');
    console.log('   3. npm run mobile:build (for APK generation)');
    
    return appDir;
    
  } catch (error) {
    console.error('❌ Error generating mobile app:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function setupReactNativeWeb(appDir, config) {
  // Add React Native Web dependencies to package.json
  const packageJsonPath = path.join(appDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  
  // Add web dependencies
  packageJson.dependencies = {
    ...packageJson.dependencies,
    'react-native-web': '^0.19.9',
    'react-dom': '^18.2.0'
  };
  
  // Add web dev dependencies
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    'webpack': '^5.89.0',
    'webpack-cli': '^5.1.4',
    'webpack-dev-server': '^4.15.1',
    'html-webpack-plugin': '^5.5.4',
    'babel-loader': '^9.1.3',
    '@babel/preset-react': '^7.23.3'
  };
  
  // Add web scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'web': 'webpack serve --mode development',
    'web:build': 'webpack --mode production',
    'web:start': 'webpack serve --mode development --port 3001'
  };
  
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  
  // Create webpack.config.js
  const webpackConfig = `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './index.web.js',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-fast-image': 'react-native-web/dist/exports/Image',
    },
    extensions: ['.web.js', '.js', '.jsx', '.json'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './web/index.html',
    }),
  ],
  devServer: {
    port: 3001,
    hot: true,
    host: '0.0.0.0',
    allowedHosts: 'all',
  },
};`;
  
  await fs.writeFile(path.join(appDir, 'webpack.config.js'), webpackConfig);
  
  // Create web directory and index.html
  const webDir = path.join(appDir, 'web');
  await fs.ensureDir(webDir);
  
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .mobile-frame {
            width: 375px;
            height: 812px;
            background: #000;
            border-radius: 40px;
            padding: 8px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            position: relative;
        }
        
        .mobile-frame::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 35%;
            height: 6px;
            background: #333;
            border-radius: 3px;
        }
        
        .mobile-screen {
            width: 100%;
            height: 100%;
            background: #fff;
            border-radius: 32px;
            overflow: hidden;
            position: relative;
        }
        
        #root {
            width: 100%;
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            /* Hide scrollbar for Chrome, Safari and Opera */
            -webkit-scrollbar {
                display: none;
            }
            /* Hide scrollbar for IE, Edge and Firefox */
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        
        /* Additional rule to ensure scrollbar is hidden in all scenarios */
        #root::-webkit-scrollbar {
            display: none;
        }
        
        .header-info {
            position: absolute;
            bottom: -60px;
            left: 0;
            right: 0;
            text-align: center;
            color: white;
            font-size: 14px;
        }
        
        .header-info a {
            color: #fff;
            text-decoration: none;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            margin: 0 8px;
            transition: background 0.3s;
        }
        
        .header-info a:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <div class="mobile-frame">
        <div class="mobile-screen">
            <div id="root"></div>
        </div>
        <div class="header-info">
            <div style="margin-bottom: 10px;">📱 ${config.name} - Mobile Preview</div>
            <a href="http://localhost:3001" target="_blank">Desktop View</a>
            <a href="http://192.168.0.104:3001" target="_blank">Mobile View</a>
        </div>
    </div>
</body>
</html>`;
  
  await fs.writeFile(path.join(webDir, 'index.html'), htmlTemplate);
  
  // Create index.web.js
  const webIndexContent = `import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);
AppRegistry.runApplication('main', {
  rootTag: document.getElementById('root'),
});`;
  
  await fs.writeFile(path.join(appDir, 'index.web.js'), webIndexContent);
  
  // Update .gitignore to include web build files
  const gitignorePath = path.join(appDir, '.gitignore');
  let gitignoreContent = '';
  if (await fs.pathExists(gitignorePath)) {
    gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
  }
  
  if (!gitignoreContent.includes('# Web build')) {
    gitignoreContent += `

# Web build
dist/
*.log
`;
    await fs.writeFile(gitignorePath, gitignoreContent);
  }
}

async function generateComponents(appDir, config) {
  const componentsDir = path.join(appDir, 'src', 'components');
  await fs.ensureDir(componentsDir);
  
  // Generate component mapping
  const componentMap = {
    MOBILE_HEADER: 'MobileHeader',
    BANNER: 'Banner', 
    CAROUSEL: 'Carousel',
    COUNTDOWN: 'Countdown',
    PRODUCT_GRID: 'ProductGrid',
    TEXT_BLOCK: 'TextBlock',
    IMAGE: 'Image',
    BUTTON: 'Button'
  };
  
  // Create each component file
  for (const [type, componentName] of Object.entries(componentMap)) {
    await generateComponentFile(componentsDir, type, componentName, config.theme);
  }
  
  // Create components index
  const indexContent = Object.values(componentMap)
    .map(name => `export { default as ${name} } from './${name}';`)
    .join('\n');
  
  await fs.writeFile(path.join(componentsDir, 'index.js'), indexContent);
}

async function generateComponentFile(componentsDir, type, componentName, theme) {
  const templates = {
    MOBILE_HEADER: `
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ${componentName} = ({ props }) => {
  return (
    <View style={[styles.header, { backgroundColor: props.backgroundColor || '${theme.primaryColor}' }]}>
      <View style={styles.logoContainer}>
        <Text style={[styles.logoText, { color: props.logoColor || '#FFFFFF' }]}>
          {props.logoText || 'App'}
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        {props.showCartIcon && (
          <TouchableOpacity style={styles.iconButton}>
            <Text style={[styles.icon, { color: props.iconColor || '#FFFFFF' }]}>🛒</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
  },
  icon: {
    fontSize: 20,
  },
});

export default ${componentName};
`,
    BANNER: `
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';

const ${componentName} = ({ props }) => {
  return (
    <ImageBackground 
      source={{ uri: props.imageUrl }}
      style={[styles.banner, { height: parseInt(props.height) || 200 }]}
    >
      {props.overlay && <View style={styles.overlay} />}
      <View style={styles.content}>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.subtitle}>{props.subtitle}</Text>
        {props.buttonText && (
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>{props.buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  banner: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '${theme.primaryColor}',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ${componentName};
`,
    PRODUCT_GRID: `
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';

const ${componentName} = ({ props, products = [] }) => {
  // Use real products from API, fallback to mock if none available
  const displayProducts = products.length > 0 ? products.map(product => ({
    id: product.id,
    title: product.title,
    price: \`$\${product.price}\`,
    image: product.image
  })) : [
    { id: '1', title: 'Green Snowboard', price: '$29.99', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center' },
    { id: '2', title: 'Red Snowboard', price: '$39.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center' },
    { id: '3', title: 'iPhone 12', price: '$799.99', image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop&crop=center' },
  ];
  
  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.productItem}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productTitle}>{item.title}</Text>
      {props.showPrice && <Text style={styles.productPrice}>{item.price}</Text>}
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      {props.title && <Text style={styles.title}>{props.title}</Text>}
      <FlatList
        data={displayProducts}
        renderItem={renderProduct}
        numColumns={props.columns || 2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '${theme.textColor}',
  },
  grid: {
    paddingBottom: 16,
  },
  productItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '${theme.primaryColor}',
  },
});

export default ${componentName};
`,
    CAROUSEL: `
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';

const ${componentName} = ({ props }) => {
  const mockProducts = [
    { id: '1', title: 'Green Snowboard', price: '$29.99', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center' },
    { id: '2', title: 'Red Snowboard', price: '$39.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center' },
    { id: '3', title: 'iPhone 12', price: '$799.99', image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop&crop=center' },
  ];
  
  return (
    <View style={styles.container}>
      {props.title && <Text style={styles.title}>{props.title}</Text>}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
      >
        {mockProducts.map((item, index) => (
          <TouchableOpacity key={item.id} style={[styles.carouselItem, index === 0 && styles.firstItem]}>
            <Image source={{ uri: item.image }} style={styles.carouselImage} />
            <Text style={styles.carouselTitle}>{item.title}</Text>
            <Text style={styles.carouselPrice}>{item.price}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginHorizontal: 16,
    color: '${theme.textColor}',
  },
  carouselContainer: {
    paddingRight: 16,
  },
  carouselItem: {
    width: 160,
    marginLeft: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstItem: {
    marginLeft: 16,
  },
  carouselImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  carouselTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  carouselPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '${theme.primaryColor}',
  },
});

export default ${componentName};
`,
    TEXT_BLOCK: `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ${componentName} = ({ props }) => {
  return (
    <View style={[styles.container, { padding: props.padding || 16 }]}>
      {props.title && (
        <Text style={[styles.title, { 
          color: props.titleColor || '${theme.textColor}',
          fontSize: props.titleSize || 20 
        }]}>
          {props.title}
        </Text>
      )}
      {props.content && (
        <Text style={[styles.content, { 
          color: props.textColor || '${theme.textColor}',
          fontSize: props.textSize || 16,
          textAlign: props.textAlign || 'left'
        }]}>
          {props.content}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    lineHeight: 24,
  },
});

export default ${componentName};
`,
    IMAGE: `
import React from 'react';
import { View, Image as RNImage, StyleSheet } from 'react-native';

const ${componentName} = ({ props }) => {
  if (!props.imageUrl) return null;
  
  return (
    <View style={[styles.container, { 
      marginHorizontal: props.margin || 0,
      marginVertical: props.marginVertical || 8,
      alignItems: props.align || 'center'
    }]}>
      <RNImage 
        source={{ uri: props.imageUrl }}
        style={[styles.image, {
          width: props.width || '100%',
          height: props.height || 200,
          borderRadius: props.borderRadius || 0
        }]}
        resizeMode={props.resizeMode || 'cover'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // alignItems moved to inline styling
  },
  image: {
    backgroundColor: '#F3F4F6',
  },
});

export default ${componentName};
`,
    BUTTON: `
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const ${componentName} = ({ props }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, {
        backgroundColor: props.backgroundColor || '${theme.primaryColor}',
        paddingHorizontal: props.paddingHorizontal || 24,
        paddingVertical: props.paddingVertical || 12,
        borderRadius: props.borderRadius || 8,
        marginHorizontal: props.marginHorizontal || 16,
        marginVertical: props.marginVertical || 8,
        alignSelf: props.align || 'stretch'
      }]}
      onPress={() => console.log('Button pressed:', props.text)}
    >
      <Text style={[styles.buttonText, {
        color: props.textColor || '#FFFFFF',
        fontSize: props.fontSize || 16,
        fontWeight: props.fontWeight || 'bold'
      }]}>
        {props.text || 'Button'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
  },
});

export default ${componentName};
`,
    COUNTDOWN: `
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ${componentName} = ({ props }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const targetDate = new Date(props.endDate || Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [props.endDate]);
  
  return (
    <View style={styles.container}>
      {props.title && <Text style={styles.title}>{props.title}</Text>}
      <View style={styles.timerContainer}>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{timeLeft.days}</Text>
          {props.showLabels && <Text style={styles.timeLabel}>Days</Text>}
        </View>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{timeLeft.hours}</Text>
          {props.showLabels && <Text style={styles.timeLabel}>Hours</Text>}
        </View>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{timeLeft.minutes}</Text>
          {props.showLabels && <Text style={styles.timeLabel}>Minutes</Text>}
        </View>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{timeLeft.seconds}</Text>
          {props.showLabels && <Text style={styles.timeLabel}>Seconds</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '${theme.textColor}',
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  timeUnit: {
    alignItems: 'center',
    backgroundColor: '${theme.primaryColor}',
    borderRadius: 8,
    padding: 12,
    minWidth: 60,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timeLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
  },
});

export default ${componentName};
`
  };
  
  const componentContent = templates[type] || `
import React from 'react';
import { View, Text } from 'react-native';

const ${componentName} = ({ props }) => {
  return (
    <View>
      <Text>${componentName} Component</Text>
    </View>
  );
};

export default ${componentName};
`;
  
  await fs.writeFile(path.join(componentsDir, `${componentName}.js`), componentContent);
}

// Helper function to create valid JavaScript identifiers
function sanitizeIdentifier(name) {
  if (!name) return 'DefaultScreen';
  
  // Remove special characters and replace with underscores
  let sanitized = name
    .replace(/[^a-zA-Z0-9_]/g, '_')  // Replace special chars with underscores
    .replace(/_{2,}/g, '_')          // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '');       // Remove leading/trailing underscores
  
  // Ensure it starts with a letter
  if (/^[0-9]/.test(sanitized)) {
    sanitized = 'Screen_' + sanitized;
  }
  
  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'DefaultScreen';
  }
  
  // Capitalize first letter for component naming convention
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
}

async function generateNavigation(appDir, config) {
  const navigationDir = path.join(appDir, 'src', 'navigation');
  await fs.ensureDir(navigationDir);
  
  const navigationContent = `
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens
${config.pages.map(page => `import ${sanitizeIdentifier(page.name)}Screen from '../screens/${sanitizeIdentifier(page.name)}Screen';`).join('\n')}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="${config.pages.find(p => p.isHomePage)?.name || config.pages[0]?.name || 'Home'}">
        ${config.pages.map(page => `
        <Stack.Screen 
          name="${page.name}" 
          component={${sanitizeIdentifier(page.name)}Screen}
          options={{ title: '${page.name}' }}
        />`).join('')}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
`;
  
  await fs.writeFile(path.join(navigationDir, 'AppNavigator.js'), navigationContent);
  
  // Generate screens
  const screensDir = path.join(appDir, 'src', 'screens');
  await fs.ensureDir(screensDir);
  
  for (const page of config.pages) {
    await generateScreenFile(screensDir, page, config.theme);
  }
}

async function generateScreenFile(screensDir, page, theme) {
  const componentImports = page.components.map(comp => {
    const componentMap = {
      MOBILE_HEADER: 'MobileHeader',
      BANNER: 'Banner',
      CAROUSEL: 'Carousel', 
      COUNTDOWN: 'Countdown',
      PRODUCT_GRID: 'ProductGrid',
      TEXT_BLOCK: 'TextBlock',
      IMAGE: 'Image',
      BUTTON: 'Button'
    };
    return componentMap[comp.type];
  }).filter(Boolean);
  
  const uniqueImports = [...new Set(componentImports)];
  const screenName = sanitizeIdentifier(page.name);
  
  const screenContent = `
import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { ${uniqueImports.join(', ')} } from '../components';

const ${screenName}Screen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        ${page.components.map(comp => {
          const componentName = {
            MOBILE_HEADER: 'MobileHeader',
            BANNER: 'Banner',
            CAROUSEL: 'Carousel',
            COUNTDOWN: 'Countdown', 
            PRODUCT_GRID: 'ProductGrid',
            TEXT_BLOCK: 'TextBlock',
            IMAGE: 'Image',
            BUTTON: 'Button'
          }[comp.type];
          
          return componentName ? `<${componentName} props={${JSON.stringify(comp.props)}} />` : '';
        }).filter(Boolean).join('\n        ')}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '${theme.backgroundColor}',
  },
  scrollView: {
    flex: 1,
  },
});

export default ${screenName}Screen;
`;
  
  await fs.writeFile(path.join(screensDir, `${screenName}Screen.js`), screenContent);
}

async function generateTheme(appDir, theme) {
  const themeDir = path.join(appDir, 'src', 'theme');
  await fs.ensureDir(themeDir);
  
  const themeContent = `
export const theme = {
  colors: {
    primary: '${theme.primaryColor}',
    secondary: '${theme.secondaryColor}',
    background: '${theme.backgroundColor}',
    text: '${theme.textColor}',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#666666',
  },
  fonts: {
    family: '${theme.fontFamily || 'Inter'}',
    sizes: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export default theme;
`;
  
  await fs.writeFile(path.join(themeDir, 'index.js'), themeContent);
}

async function updateAppMetadata(appDir, config) {
  // Update package.json
  const packageJsonPath = path.join(appDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  
  packageJson.name = config.name.toLowerCase().replace(/\s+/g, '-');
  packageJson.displayName = config.name;
  
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  
  // Update app.json
  const appJsonPath = path.join(appDir, 'app.json');
  if (await fs.pathExists(appJsonPath)) {
    const appJson = await fs.readJson(appJsonPath);
    appJson.name = config.name.toLowerCase().replace(/\s+/g, '-');
    appJson.displayName = config.name;
    
    await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
  }
}

async function generateMainApp(appDir, config) {
  const appContent = `import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Import all available components
import MobileHeader from './src/components/MobileHeader';
import Banner from './src/components/Banner';
import Carousel from './src/components/Carousel';
import Countdown from './src/components/Countdown';
import ProductGrid from './src/components/ProductGrid';
import TextBlock from './src/components/TextBlock';
import Image from './src/components/Image';
import Button from './src/components/Button';

const LIVE_CONFIG_URL = 'http://localhost:63158/api/live-config/${config.shop}';

const App = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      const response = await fetch(LIVE_CONFIG_URL);
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}\`);
      }
      const data = await response.json();
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

  const renderComponent = (component, index) => {
    // Map component IDs to React components
    const componentMap = {
      'mobile-header': MobileHeader,
      'banner': Banner,
      'carousel': Carousel,
      'countdown': Countdown,
      'product-grid': ProductGrid,
      'featured-collection': ProductGrid, // Alias for product grid
      'text-block': TextBlock,
      'image': Image,
      'button': Button
    };

    const ComponentClass = componentMap[component.componentId];
    
    if (!ComponentClass) {
      return (
        <View key={index} style={styles.unknownComponent}>
          <Text style={styles.errorText}>
            Unknown component: {component.componentId}
          </Text>
        </View>
      );
    }

    return (
      <ComponentClass 
        key={index}
        props={component.props || {}}
      />
    );
  };

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

  if (!config || !config.pages || config.pages.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.indicator}>📱 No template found</Text>
        </View>
      </View>
    );
  }

  const currentPage = config.pages[0]; // Use the first page for now
  const components = currentPage.components || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.indicator}>🟢 LIVE PREVIEW</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        {components.map((component, index) => renderComponent(component, index))}
        {components.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No components added yet</Text>
            <Text style={styles.emptySubtext}>Add components in the builder to see them here</Text>
          </View>
        )}
        
        {/* Add some bottom padding for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  unknownComponent: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

export default App;
`;
  
  await fs.writeFile(path.join(appDir, 'App.js'), appContent);
}

// Get shop/app ID from command line argument
const shopOrAppId = process.argv[2];
if (!shopOrAppId) {
  console.error('❌ Please provide shop domain or app ID: npm run mobile:generate <shop.myshopify.com>');
  process.exit(1);
}

generateMobileApp(shopOrAppId); 