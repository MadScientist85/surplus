#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 
 * This script validates that required environment variables are set
 * and provides helpful feedback for missing or misconfigured variables.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Required environment variables for basic operation
const REQUIRED_VARS = [
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    description: 'Clerk publishable key for authentication',
    documentation: 'https://dashboard.clerk.com',
  },
  {
    name: 'CLERK_SECRET_KEY',
    description: 'Clerk secret key for server-side authentication',
    documentation: 'https://dashboard.clerk.com',
  },
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL connection string',
    documentation: 'Format: postgresql://user:password@host:port/database',
  },
];

// Optional but recommended variables
const RECOMMENDED_VARS = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    category: 'Database & Storage',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key',
    category: 'Database & Storage',
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key for AI features',
    category: 'AI Services',
  },
  {
    name: 'TWILIO_ACCOUNT_SID',
    description: 'Twilio account SID for SMS',
    category: 'Communication',
  },
  {
    name: 'TWILIO_AUTH_TOKEN',
    description: 'Twilio auth token',
    category: 'Communication',
  },
];

// Variable groups
const VARIABLE_GROUPS = {
  'Skip Tracing': [
    'SKIP_GENIE_API_KEY',
    'RESIMPLI_API_KEY',
    'MOJO_API_KEY',
    'SKIPFORCE_API_KEY',
    'TRACERFY_API_KEY',
    'ENDATO_API_KEY',
    'ACCURATE_APPEND_API_KEY',
    'TRESTLE_API_KEY',
    'ZEROBOUNCE_API_KEY',
  ],
  'Blockchain & NFT': [
    'BLOCKCHAIN_PRIVATE_KEY',
    'BOUNTY_CONTRACT_ADDRESS',
    'NFT_CONTRACT_ADDRESS',
    'PINATA_API_KEY',
    'PINATA_SECRET_KEY',
  ],
  'Payment Processing': [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
  ],
  'Project Management': [
    'TRELLO_API_KEY',
    'TRELLO_TOKEN',
    'TRELLO_BOARD_ID',
  ],
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (!fs.existsSync(envLocalPath)) {
    log('\n⚠️  WARNING: .env.local file not found!', 'yellow');
    
    if (fs.existsSync(envExamplePath)) {
      log('\n📋 To get started:', 'cyan');
      log('   cp .env.example .env.local', 'blue');
      log('   Then edit .env.local with your actual values\n', 'blue');
    }
    
    return false;
  }

  return true;
}

function validateRequired() {
  log('\n🔍 Checking Required Variables...', 'cyan');
  
  const missing = [];
  const present = [];

  REQUIRED_VARS.forEach(variable => {
    const value = process.env[variable.name];
    
    if (!value || value.includes('your_') || value.includes('_here')) {
      missing.push(variable);
      log(`  ❌ ${variable.name}`, 'red');
      log(`     ${variable.description}`, 'yellow');
      if (variable.documentation) {
        log(`     📖 ${variable.documentation}`, 'blue');
      }
    } else {
      present.push(variable);
      log(`  ✅ ${variable.name}`, 'green');
    }
  });

  return { missing, present };
}

function validateRecommended() {
  log('\n💡 Checking Recommended Variables...', 'cyan');
  
  const missing = [];
  const present = [];

  RECOMMENDED_VARS.forEach(variable => {
    const value = process.env[variable.name];
    
    if (!value || value.includes('your_') || value.includes('_here')) {
      missing.push(variable);
      log(`  ⚪ ${variable.name}`, 'yellow');
      log(`     ${variable.description} (${variable.category})`, 'yellow');
    } else {
      present.push(variable);
      log(`  ✅ ${variable.name}`, 'green');
    }
  });

  return { missing, present };
}

function validateGroups() {
  log('\n📦 Checking Optional Feature Groups...', 'cyan');
  
  Object.entries(VARIABLE_GROUPS).forEach(([groupName, variables]) => {
    const configured = variables.filter(v => {
      const value = process.env[v];
      return value && !value.includes('your_') && !value.includes('_here');
    });

    const percentage = (configured.length / variables.length) * 100;
    
    if (percentage === 0) {
      log(`  ⚪ ${groupName}: Not configured (${variables.length} vars)`, 'yellow');
    } else if (percentage === 100) {
      log(`  ✅ ${groupName}: Fully configured (${variables.length}/${variables.length})`, 'green');
    } else {
      log(`  🔶 ${groupName}: Partially configured (${configured.length}/${variables.length})`, 'yellow');
    }
  });
}

function countAllVariables() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envLocalPath)) {
    return 0;
  }

  const content = fs.readFileSync(envLocalPath, 'utf-8');
  const lines = content.split('\n');
  
  let count = 0;
  lines.forEach(line => {
    // Count lines that look like environment variables (not comments or empty)
    if (line.trim() && !line.trim().startsWith('#') && line.includes('=')) {
      count++;
    }
  });

  return count;
}

function validateConfiguration() {
  log('\n════════════════════════════════════════════════════════════', 'cyan');
  log('   HBU Asset Recovery - Environment Validation', 'cyan');
  log('════════════════════════════════════════════════════════════\n', 'cyan');

  // Check if .env.local exists
  const hasEnvFile = checkEnvFile();
  
  if (!hasEnvFile) {
    log('\n❌ Cannot proceed without .env.local file\n', 'red');
    process.exit(1);
  }

  // Load environment variables from .env.local
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  } catch (e) {
    log('\n⚠️  Warning: dotenv package not found. Attempting to continue...', 'yellow');
    log('   Variables may not be loaded properly.', 'yellow');
    log('   Install dotenv with: npm install dotenv\n', 'blue');
  }

  // Count total variables
  const totalVars = countAllVariables();
  log(`📊 Total environment variables found: ${totalVars}`, 'blue');

  // Validate required variables
  const { missing: requiredMissing, present: requiredPresent } = validateRequired();

  // Validate recommended variables
  const { missing: recommendedMissing, present: recommendedPresent } = validateRecommended();

  // Validate optional groups
  validateGroups();

  // Summary
  log('\n════════════════════════════════════════════════════════════', 'cyan');
  log('   Summary', 'cyan');
  log('════════════════════════════════════════════════════════════\n', 'cyan');

  log(`Total Variables: ${totalVars}`, 'blue');
  log(`Required Variables: ${requiredPresent.length}/${REQUIRED_VARS.length}`, 
      requiredMissing.length === 0 ? 'green' : 'red');
  log(`Recommended Variables: ${recommendedPresent.length}/${RECOMMENDED_VARS.length}`, 
      recommendedPresent.length > 0 ? 'green' : 'yellow');

  if (requiredMissing.length === 0) {
    log('\n✅ All required environment variables are configured!', 'green');
    log('✅ The application should be able to start.\n', 'green');
    
    if (recommendedMissing.length > 0) {
      log('💡 Consider configuring recommended variables for full functionality.\n', 'yellow');
    }
    
    return true;
  } else {
    log('\n❌ Missing required environment variables!', 'red');
    log('❌ The application may not function correctly.\n', 'red');
    log('📖 Please refer to .env.example for guidance.\n', 'yellow');
    
    return false;
  }
}

// Run validation
try {
  const isValid = validateConfiguration();
  process.exit(isValid ? 0 : 1);
} catch (error) {
  log(`\n❌ Error during validation: ${error.message}`, 'red');
  process.exit(1);
}
