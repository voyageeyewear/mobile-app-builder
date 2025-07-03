import { updatePorts, getNodePorts } from './updatePorts.js';
import fs from 'fs';
import path from 'path';

class AutoPortUpdater {
  constructor() {
    this.lastKnownPorts = new Set();
    this.watchInterval = 5000; // Check every 5 seconds
    this.isWatching = false;
    this.intervalId = null;
  }

  start() {
    if (this.isWatching) {
      console.log('⚠️ Auto port updater is already running');
      return;
    }

    console.log('🚀 Starting auto port updater...');
    console.log(`⏱️ Checking for port changes every ${this.watchInterval / 1000} seconds`);
    
    this.isWatching = true;
    
    // Initial check
    this.checkForPortChanges();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkForPortChanges();
    }, this.watchInterval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.stop();
      process.exit(0);
    });
  }

  stop() {
    if (!this.isWatching) {
      return;
    }

    console.log('\n🛑 Stopping auto port updater...');
    this.isWatching = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  checkForPortChanges() {
    try {
      const currentPorts = new Set(getNodePorts());
      
      // Check if ports have changed
      const portsChanged = 
        currentPorts.size !== this.lastKnownPorts.size ||
        ![...currentPorts].every(port => this.lastKnownPorts.has(port));

      if (portsChanged) {
        const added = [...currentPorts].filter(port => !this.lastKnownPorts.has(port));
        const removed = [...this.lastKnownPorts].filter(port => !currentPorts.has(port));
        
        console.log('\n🔄 Port changes detected!');
        if (added.length > 0) {
          console.log(`➕ New ports: ${added.join(', ')}`);
        }
        if (removed.length > 0) {
          console.log(`➖ Stopped ports: ${removed.join(', ')}`);
        }
        
        // Update ports if we have any servers running
        if (currentPorts.size > 0) {
          console.log('🔧 Updating mobile app configurations...');
          updatePorts();
        } else {
          console.log('⚠️ No servers running');
        }
        
        this.lastKnownPorts = currentPorts;
      }
    } catch (error) {
      // Silently continue on errors to avoid spam
      if (this.isWatching) {
        console.log('⚠️ Error checking ports:', error.message);
      }
    }
  }

  // Manual trigger
  updateNow() {
    console.log('🔧 Manually triggering port update...');
    updatePorts();
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  const updater = new AutoPortUpdater();

  switch (command) {
    case 'watch':
    case 'start':
      updater.start();
      break;
    
    case 'once':
    case 'update':
      updater.updateNow();
      break;
    
    case 'help':
    case '--help':
    case '-h':
      console.log(`
📱 Auto Port Updater for Mobile Apps

Usage:
  node scripts/autoPortUpdater.js [command]

Commands:
  watch, start    Start watching for port changes (default)
  once, update    Update ports once and exit
  help            Show this help message

Examples:
  node scripts/autoPortUpdater.js watch    # Watch for changes
  node scripts/autoPortUpdater.js once     # Update once
      `);
      break;
    
    default:
      // Default to watching
      updater.start();
      break;
  }
}

export default AutoPortUpdater; 