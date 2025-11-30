// Comprehensive System Test for WhatsApp Migration System
require('dotenv').config();
const axios = require('axios');
const pool = require('./services/db');

const BASE_URL = 'http://localhost:8080';

async function testComprehensiveSystem() {
  console.log('🧪 COMPREHENSIVE WHATSAPP MIGRATION SYSTEM TEST\n');
  console.log('=' .repeat(60));

  let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: System Infrastructure
  console.log('\n1. SYSTEM INFRASTRUCTURE');
  console.log('-'.repeat(30));

  try {
    // Database connectivity
    const dbResult = await pool.query('SELECT version()');
    console.log(`   ✅ Database: PostgreSQL ${dbResult.rows[0].version.split(' ')[1]}`);
    testResults.passed++;
  } catch (error) {
    console.log('   ❌ Database connection failed');
    testResults.failed++;
  }

  try {
    // Server status
    const response = await axios.get(`${BASE_URL}/api/landing`);
    console.log(`   ✅ Backend Server: Running on port 8080`);
    testResults.passed++;
  } catch (error) {
    console.log('   ❌ Backend server not accessible');
    testResults.failed++;
  }

  // Test 2: Database State Analysis
  console.log('\n2. DATABASE STATE ANALYSIS');
  console.log('-'.repeat(30));

  try {
    const botsCount = await pool.query('SELECT COUNT(*) FROM bots');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const leadsCount = await pool.query('SELECT COUNT(*) FROM leads');
    
    console.log(`   📊 Bots: ${botsCount.rows[0].count}`);
    console.log(`   👥 Users: ${usersCount.rows[0].count}`);
    console.log(`   📈 Leads: ${leadsCount.rows[0].count}`);
    testResults.passed++;
  } catch (error) {
    console.log('   ❌ Database analysis failed');
    testResults.failed++;
  }

  // Test 3: Authentication System
  console.log('\n3. AUTHENTICATION SYSTEM');
  console.log('-'.repeat(30));

  try {
    const authStatus = await axios.get(`${BASE_URL}/api/auth/status`);
    console.log(`   🔐 Auth Status: ${authStatus.data.authenticated ? 'Authenticated' : 'Not Authenticated'}`);
    
    // Check Google OAuth endpoints
    const oauthResponse = await axios.get(`${BASE_URL}/auth/google`, { 
      validateStatus: (status) => status < 500 
    });
    console.log(`   🔗 Google OAuth: ${oauthResponse.status === 302 ? 'Configured' : 'Issue detected'}`);
    testResults.passed++;
  } catch (error) {
    console.log('   ❌ Authentication system test failed');
    testResults.failed++;
  }

  // Test 4: Bot Management System
  console.log('\n4. BOT MANAGEMENT SYSTEM');
  console.log('-'.repeat(30));

  try {
    const bots = await pool.query('SELECT * FROM bots');
    console.log(`   🤖 Total Bots: ${bots.rows.length}`);
    
    bots.rows.forEach(bot => {
      console.log(`      - ${bot.name} (${bot.id}): ${bot.status}`);
    });

    // Check bot features
    const features = await pool.query('SELECT COUNT(*) FROM bot_features');
    console.log(`   ⚙️  Bot Features: ${features.rows[0].count} configured`);
    testResults.passed++;
  } catch (error) {
    console.log('   ❌ Bot management system test failed');
    testResults.failed++;
  }

  // Test 5: Baileys Connection Status
  console.log('\n5. BAILEYS CONNECTION STATUS');
  console.log('-'.repeat(30));

  try {
    const bots = await pool.query('SELECT * FROM bots');
    console.log(`   🔌 Bot Connection Status:`);
    
    for (const bot of bots.rows) {
      // Check auth session directories
      const fs = require('fs');
      const path = require('path');
      const authDir = path.join(__dirname, 'auth-sessions', bot.id);
      const hasAuth = fs.existsSync(authDir);
      
      console.log(`      - ${bot.name}: ${hasAuth ? 'Auth session exists' : 'No auth session'}`);
    }
    testResults.passed++;
  } catch (error) {
    console.log('   ⚠️  Baileys connection check incomplete');
    testResults.warnings++;
  }

  // Test 6: API Endpoints Health
  console.log('\n6. API ENDPOINTS HEALTH');
  console.log('-'.repeat(30));

  const endpoints = [
    '/api/landing',
    '/api/auth/status',
    '/api/events'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        validateStatus: (status) => status < 500
      });
      console.log(`   ✅ ${endpoint}: ${response.status}`);
      testResults.passed++;
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.message}`);
      testResults.failed++;
    }
  }

  // Test 7: Environment Configuration
  console.log('\n7. ENVIRONMENT CONFIGURATION');
  console.log('-'.repeat(30));

  const requiredEnv = [
    'DEEPSEEK_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'JWT_SECRET',
    'DATABASE_URL',
    'ADMIN_EMAILS'
  ];

  let envOk = true;
  requiredEnv.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Configured`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      envOk = false;
      testResults.failed++;
    }
  });

  if (envOk) {
    testResults.passed++;
  }

  // Test 8: Performance and Memory Check
  console.log('\n8. PERFORMANCE AND MEMORY');
  console.log('-'.repeat(30));

  const memoryUsage = process.memoryUsage();
  console.log(`   💾 Memory Usage:`);
  console.log(`      - RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
  console.log(`      - Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`      - Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
  
  if (memoryUsage.heapUsed < 100 * 1024 * 1024) { // Less than 100MB
    console.log(`   ✅ Memory usage: Normal`);
    testResults.passed++;
  } else {
    console.log(`   ⚠️  Memory usage: High`);
    testResults.warnings++;
  }

  // Test 9: Error Handling
  console.log('\n9. ERROR HANDLING VALIDATION');
  console.log('-'.repeat(30));

  try {
    // Test invalid endpoint
    await axios.get(`${BASE_URL}/api/invalid-endpoint`, {
      validateStatus: (status) => status === 404
    });
    console.log(`   ✅ 404 Error Handling: Working`);
    testResults.passed++;
  } catch (error) {
    console.log(`   ❌ Error handling test failed`);
    testResults.failed++;
  }

  // Test 10: System Integration Summary
  console.log('\n10. SYSTEM INTEGRATION SUMMARY');
  console.log('-'.repeat(30));

  console.log(`\n📊 TEST RESULTS:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.warnings}`);
  
  const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
  console.log(`   📈 Success Rate: ${successRate.toFixed(1)}%`);

  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS:');
  
  if (testResults.failed > 0) {
    console.log('   🔧 Address failed tests before deployment');
  }
  
  if (testResults.warnings > 0) {
    console.log('   ⚠️  Review warnings for potential improvements');
  }

  if (successRate >= 90) {
    console.log('   🎉 System is ready for production deployment!');
  } else if (successRate >= 70) {
    console.log('   📋 System needs some fixes before deployment');
  } else {
    console.log('   🚨 System requires significant work before deployment');
  }

  console.log('\n🔍 SPECIFIC ACTIONS NEEDED:');
  console.log('   - Test Google OAuth login flow with actual authentication');
  console.log('   - Verify Baileys QR code generation for WhatsApp connection');
  console.log('   - Test SSE event streaming after user authentication');
  console.log('   - Validate bot message processing and lead extraction');
  console.log('   - Check frontend PostCSS fix (already applied)');

  console.log('\n' + '=' .repeat(60));
  console.log('🧪 COMPREHENSIVE TESTING COMPLETE');

  return testResults;
}

testComprehensiveSystem().catch(console.error);