// BACKEND/utils/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Admin = require('../models/Admin');
const connectDB = require('../config/db');

async function createAdmin() {
  try {
    // 1. Connect to database
    await connectDB();

    // 2. Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'viveks3931@gmail.com' });
    if (existingAdmin) {
      console.log('ℹ️ Admin already exists with email: viveks3931@gmail.com');
      return process.exit(0);
    }

    // 3. Validate required environment variable
    if (!process.env.ADMIN_PASS) {
      throw new Error('ADMIN_PASS environment variable is not set');
    }

    // 4. Hash password with proper salt rounds (recommended: 10-12)

    // 5. Create new admin
    const adminUser = new Admin({
      name: 'Admin',
      email: 'viveks3931@gmail.com',
      password: process.env.ADMIN_PASS,
      role: 'admin',
      isSuperAdmin: true,  // Recommended if you have hierarchy
      permissions: ['all'] // Recommended for permission system
    });

    // 6. Save admin
    await adminUser.save();
    console.log('✅ Admin user created successfully:');
    console.log(`   Email: viveks3931@gmail.com`);
    console.log(`   Password: [hashed]`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();