const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Setting up Prisma...');

try {
  // Generate Prisma Client
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('✓ Prisma Client generated successfully');
  console.log('\nNext steps:');
  console.log('1. Create .env.local with DATABASE_URL and SESSION_SECRET');
  console.log('2. Run: npx prisma migrate deploy (or npx prisma db push for development)');
  console.log('3. Run: node scripts/init-db.js (to seed demo data)');
  console.log('4. Run: pnpm dev (to start the dev server)');
} catch (error) {
  console.error('Error setting up Prisma:', error.message);
  process.exit(1);
}
