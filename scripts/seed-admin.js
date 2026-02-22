const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@shiesa.com';
    const password = 'password123'; // Default password - change immediately in production
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Seeding admin user: ${email}...`);

    try {
        const admin = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
                fullName: 'Super Admin',
                role: 'SUPER_ADMIN',
            },
        });
        console.log('Admin user created:', admin);
    } catch (e) {
        console.error('Error seeding admin user:', e);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
