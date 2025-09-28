#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHelp() {
  log('🚀 GrowthKit CLI', 'bold');
  log('=====================================', 'blue');
  log('Available commands:', 'reset');
  log('', 'reset');
  log('  setup    Interactive setup wizard for GrowthKit integration', 'blue');
  log('  help     Show this help message', 'blue');
  log('', 'reset');
  log('Usage:', 'bold');
  log('  npx @fenixblack/growthkit setup', 'green');
  log('  npx @fenixblack/growthkit help', 'green');
  log('', 'reset');
  log('Examples:', 'bold');
  log('  npx @fenixblack/growthkit setup  # Run interactive setup', 'blue');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'setup':
      // Run the setup script
      const setupScript = path.join(__dirname, 'setup.js');
      const child = spawn('node', [setupScript], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      child.on('exit', (code) => {
        process.exit(code);
      });
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    case undefined:
      log('❌ No command specified', 'red');
      log('', 'reset');
      showHelp();
      process.exit(1);
      break;
      
    default:
      log(`❌ Unknown command: ${command}`, 'red');
      log('', 'reset');
      showHelp();
      process.exit(1);
  }
}

main();
