#!/usr/bin/env node

/**
 * Script to generate a secure JWT secret key
 * Usage: node generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate a secure random string
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n🔐 Generated JWT Secret Key:\n');
console.log('='.repeat(50));
console.log(secret);
console.log('='.repeat(50));
console.log('\n📋 Copy this value and add it to Vercel Environment Variables as:');
console.log('   Key: JWT_SECRET');
console.log('   Value: ' + secret);
console.log('\n✅ This secret is cryptographically secure and safe to use in production.\n');

