#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🚀 Chat App Setup Helper\n');

// Check MongoDB
console.log('📋 Checking environment...\n');

const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ backend/.env exists');
} else {
  console.log('⚠️  backend/.env not found');
}

// Check package.json files
const backendPkg = path.join(__dirname, 'backend', 'package.json');
const frontendPkg = path.join(__dirname, 'package.json');

if (fs.existsSync(backendPkg)) {
  console.log('✅ Backend package.json exists');
} else {
  console.log('❌ Backend package.json missing!');
}

if (fs.existsSync(frontendPkg)) {
  console.log('✅ Frontend package.json exists');
} else {
  console.log('❌ Frontend package.json missing!');
}

// Check node_modules
const backendModules = path.join(__dirname, 'backend', 'node_modules');
const frontendModules = path.join(__dirname, 'node_modules');

if (fs.existsSync(backendModules)) {
  console.log('✅ Backend node_modules installed');
} else {
  console.log('⚠️  Backend node_modules missing - run: cd backend && npm install');
}

if (fs.existsSync(frontendModules)) {
  console.log('✅ Frontend node_modules installed');
} else {
  console.log('⚠️  Frontend node_modules missing - run: npm install');
}

console.log('\n' + '='.repeat(50));
console.log('📖 TO START THE APP:\n');
console.log('Terminal 1 (Backend):');
console.log('  cd backend');
console.log('  npm start\n');

console.log('Terminal 2 (Frontend):');
console.log('  npm run dev\n');

console.log('Then open: http://localhost:5173/');
console.log('='.repeat(50) + '\n');
