/**
 * Quick script to create/upgrade a test user to Career Pro plan.
 * 
 * Usage: node scripts/create-test-user.js
 * 
 * This creates (or upgrades) a test user with Career Pro subscription.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { config } = require('../src/config/environment');

const TEST_USER = {
  name: 'Test Career Pro',
  email: 'test@careerai.com',
  password: 'Test@1234',
};

async function main() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    const User = require('../src/models/User');

    // Check if user exists
    let user = await User.findOne({ email: TEST_USER.email });

    if (user) {
      // Upgrade existing user
      user.subscription.plan = 'career_pro';
      user.subscription.status = 'active';
      user.subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      await user.save();
      console.log('✅ Upgraded existing user to Career Pro');
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 12);
      user = await User.create({
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: hashedPassword,
        subscription: {
          plan: 'career_pro',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      console.log('✅ Created new Career Pro test user');
    }

    console.log('\n🎯 Test Account Credentials:');
    console.log(`   Email:    ${TEST_USER.email}`);
    console.log(`   Password: ${TEST_USER.password}`);
    console.log(`   Plan:     Career Pro ✨`);
    console.log(`   Status:   Active`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
