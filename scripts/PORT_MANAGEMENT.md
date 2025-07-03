# Automatic Port Management for Mobile Apps

This system automatically detects server port changes and updates mobile app configurations accordingly.

## 🚀 Quick Start

### One-time Port Update
```bash
npm run ports:update
```

### Watch for Port Changes (Recommended)
```bash
npm run ports:watch
```

### Live Preview with Auto Port Updates
```bash
npm run live-preview:auto
```

## 📋 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Update Once** | `npm run ports:update` | Update mobile app ports once and exit |
| **Watch Mode** | `npm run ports:watch` | Continuously monitor and update ports |
| **Auto Live Preview** | `npm run live-preview:auto` | Start dev server, port watcher, and mobile preview |

## 🔧 Manual Usage

You can also run the scripts directly:

```bash
# Update ports once
node scripts/updatePorts.js

# Watch for changes
node scripts/autoPortUpdater.js watch

# Get help
node scripts/autoPortUpdater.js help
```

## 🎯 How It Works

### Port Detection
- Scans for Node.js processes listening on ports
- Filters out common ports (3000, 3001)  
- Identifies main app port (usually highest port > 50000)

### Auto Update Process
1. **Detects** when servers start/stop
2. **Identifies** the main Shopify app port
3. **Updates** all mobile app `App.js` files
4. **Updates** the mobile app generation template

### Files Updated
- `generated-apps/*/App.js` - Live mobile apps
- `scripts/generateMobileApp.js` - Template for new apps

## 📱 Mobile App Configuration

Each mobile app has a configuration line like:
```javascript
const LIVE_CONFIG_URL = 'http://localhost:62914/api/live-config/shop-name.myshopify.com';
```

The scripts automatically update the port number (`62914`) when your server restarts on a different port.

## 🔍 Troubleshooting

### No Ports Detected
```bash
❌ No node servers detected. Make sure the main app server is running.
```
**Solution:** Start your Shopify app server first with `npm run dev`

### Could Not Detect Main App Port
```bash
❌ Could not detect main app port. Available ports: [3001, 3000]
```
**Solution:** The main Shopify app isn't running. Available ports are just common dev servers.

### Port Already Correct
```bash
✓ app-name: Port 62914 already correct
```
**Info:** No update needed, configuration is already up to date.

## ⚡ Performance Tips

- **Watch Mode**: Checks every 5 seconds for port changes
- **Efficient**: Only updates files when ports actually change
- **Safe**: Gracefully handles server restart scenarios

## 🛠️ Development

The port management system consists of:

- `updatePorts.js` - Core port detection and update logic
- `autoPortUpdater.js` - Watching and monitoring wrapper
- Package.json scripts for easy access

## 🎉 Integration with Development Workflow

### Recommended Workflow
1. Start auto live preview: `npm run live-preview:auto`
2. Make changes to your Shopify app
3. Mobile preview automatically updates when servers restart
4. No manual port configuration needed!

### Traditional Workflow (Manual)
1. Start Shopify app: `npm run dev`
2. Note the port number from console
3. Update mobile apps: `npm run ports:update` 
4. Start mobile preview: `npm run web` 