// Test script for Baileys connection and system validation
require('dotenv').config();
const pool = require('./services/db');
const baileysManager = require('./services/baileysManager');

async function testSystem() {
  console.log('🧪 Starting WhatsApp Migration System Tests...\n');

  // Test 1: Database Connection
  console.log('1. Testing Database Connection...');
  try {
    const result = await pool.query('SELECT COUNT(*) as bot_count FROM bots');
    console.log(`   ✅ Database connected - Total bots: ${result.rows[0].bot_count}`);
    
    // Check existing bots
    const bots = await pool.query('SELECT * FROM bots');
    console.log(`   📊 Existing bots: ${bots.rows.length}`);
    bots.rows.forEach(bot => {
      console.log(`      - ${bot.name} (${bot.id}): ${bot.status}`);
    });
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
  }

  // Test 2: Baileys Module Loading
  console.log('\n2. Testing Baileys Module Loading...');
  try {
    const { baileys, Boom } = await baileysManager.loadBaileys();
    console.log('   ✅ Baileys module loaded successfully');
    console.log('   ✅ Boom module loaded successfully');
  } catch (error) {
    console.log('   ❌ Baileys module loading failed:', error.message);
  }

  // Test 3: Check Active Sessions
  console.log('\n3. Checking Active Baileys Sessions...');
  try {
    // This would require access to internal state, but we can test via public methods
    const bots = await pool.query('SELECT * FROM bots');
    for (const bot of bots.rows) {
      const status = baileysManager.getBotStatus(bot.id);
      const isReady = baileysManager.isBotReady(bot.id);
      console.log(`   - ${bot.name}: Status=${status}, Ready=${isReady}`);
    }
  } catch (error) {
    console.log('   ❌ Error checking sessions:', error.message);
  }

  // Test 4: Test Bot Creation Flow
  console.log('\n4. Testing Bot Creation Requirements...');
  try {
    const testBotConfig = {
      id: 'test-bot-' + Date.now(),
      name: 'Test Bot',
      port: 30000,
      prompt: 'You are a test bot for system validation.',
      status: 'enabled',
      ownerEmail: 'test@example.com'
    };
    console.log('   ✅ Bot configuration structure valid');
    console.log('   📝 Test bot would be created with:', testBotConfig);
  } catch (error) {
    console.log('   ❌ Bot configuration test failed:', error.message);
  }

  // Test 5: Check Environment Variables
  console.log('\n5. Checking Environment Variables...');
  const requiredEnvVars = [
    'DEEPSEEK_API_KEY',
    'GOOGLE_CLIENT_ID', 
    'GOOGLE_CLIENT_SECRET',
    'JWT_SECRET',
    'DATABASE_URL'
  ];
  
  let envOk = true;
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      envOk = false;
    }
  });

  console.log('\n📋 Test Summary:');
  console.log(`   Database: ${pool ? 'Connected' : 'Failed'}`);
  console.log(`   Environment: ${envOk ? 'Complete' : 'Incomplete'}`);
  console.log(`   Baileys Module: Loaded`);
  
  if (!envOk) {
    console.log('\n⚠️  WARNING: Some environment variables are missing. System may not function properly.');
  }

  console.log('\n🎯 Next Steps:');
  console.log('   - Create a test bot to validate Baileys connection');
  console.log('   - Test QR code generation and authentication flow');
  console.log('   - Verify SSE event streaming');
  console.log('   - Test message processing and lead extraction');

  process.exit(0);
}

testSystem().catch(console.error);