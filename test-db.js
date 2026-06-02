const { PrismaClient } = require('@prisma/client');

async function test(url) {
  process.env.DATABASE_URL = url;
  console.log(`Testing URL: ${url}`);
  const prisma = new PrismaClient();
  try {
    const count = await prisma.signal.count();
    console.log(`Success! Count: ${count}`);
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.log(`Failed: ${err.message}`);
    await prisma.$disconnect();
    return false;
  }
}

async function run() {
  const options = [
    'file:./prisma/dev.db',
    'file:C:/Users/Neha Kukreja/OneDrive/Desktop/EY/RiskLens/app/prisma/dev.db',
    'file:C:\\Users\\Neha Kukreja\\OneDrive\\Desktop\\EY\\RiskLens\\app\\prisma\\dev.db',
    'file:/C:/Users/Neha%20Kukreja/OneDrive/Desktop/EY/RiskLens/app/prisma/dev.db',
    'file:C:/Users/Neha%20Kukreja/OneDrive/Desktop/EY/RiskLens/app/prisma/dev.db',
    'file:C:\\Users\\Neha%20Kukreja\\OneDrive\\Desktop\\EY\\RiskLens\\app\\prisma\\dev.db'
  ];
  
  for (const opt of options) {
    const res = await test(opt);
    if (res) {
      console.log(`\n==== RECOMMENDED URL: ${opt} ====\n`);
      break;
    }
  }
}

run();
