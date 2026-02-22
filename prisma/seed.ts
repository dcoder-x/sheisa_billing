import { PrismaClient, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // Create Super Admin (no entity) safely checking if it already exists
    const adminEmail = 'admin@shiesa.com';
    const existingAdmin = await prisma.user.findFirst({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        const superAdminPassword = await bcrypt.hash('admin123', 10)
        const superAdmin = await prisma.user.create({
            data: {
                email: adminEmail,
                fullName: 'Super Admin',
                password: superAdminPassword,
                role: UserRole.SUPER_ADMIN,
            },
        })
        console.log(`Created Super Admin: ${superAdmin.email}`)
    } else {
        console.log(`Super Admin already exists: ${adminEmail}`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
