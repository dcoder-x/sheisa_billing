import { PrismaClient, UserRole, EntityStatus, SupplierStatus, InvoiceStatus, TransactionType, ReportType, RegistrationStatus, TemplateType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // Cleanup existing data
    await prisma.document.deleteMany()
    await prisma.invoiceTemplate.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.report.deleteMany()
    await prisma.user.deleteMany()
    await prisma.registrationRequest.deleteMany()
    await prisma.entity.deleteMany()

    console.log('Deleted existing data')

    // Create Super Admin (no entity)
    const superAdminPassword = await bcrypt.hash('admin123', 10)
    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@shiesa.com',
            fullName: 'Super Admin',
            password: superAdminPassword,
            role: UserRole.SUPER_ADMIN,
        },
    })
    console.log(`Created Super Admin: ${superAdmin.email}`)

    // Create Default Entity
    const entity = await prisma.entity.create({
        data: {
            name: 'ElephantBet',
            registrationNumber: 'EB-2024-001',
            email: 'info@elephantbet.co.ao',
            phone: '+244900000000',
            address: 'Luanda, Angola',
            city: 'Luanda',
            state: 'LU',
            postalCode: '1000',
            country: 'Angola',
            businessType: 'Entertainment',
            subdomain: 'elephantbet',
            themeColor: '#e11d48', // distinct red/pink
            logoUrl: '/elephantbet.png',
            status: EntityStatus.ACTIVE,
        },
    })
    console.log(`Created Entity: ${entity.name}`)

    // Create Entity User
    const userPassword = await bcrypt.hash('user123', 10)
    const entityUser = await prisma.user.create({
        data: {
            email: 'user@elephantbet.com',
            fullName: 'Demo Admin',
            password: userPassword,
            role: UserRole.ENTITY_USER,
            entityId: entity.id,
        },
    })
    console.log(`Created Entity User: ${entityUser.email}`)

    // Create Pending Registration Request
    const registrationRequest = await prisma.registrationRequest.create({
        data: {
            entityName: 'Pending Inc',
            registrationNumber: 'REG987654',
            email: 'contact@pending.com',
            phone: '+15559876543',
            address: '456 Startup Ln',
            city: 'Innovate City',
            state: 'IC',
            postalCode: '90001',
            country: 'USA',
            businessType: 'Finance',
            subdomain: 'pending',
            themeColor: '#10b981', // Green
            logoUrl: null,
            password: await bcrypt.hash('pending123', 10),
            status: RegistrationStatus.PENDING,
        },
    })
    console.log(`Created Registration Request: ${registrationRequest.entityName}`)

    // Create some initial data for the entity
    // Suppliers
    const supplier = await prisma.supplier.create({
        data: {
            entityId: entity.id,
            name: 'Office Supplies Co',
            email: 'sales@officesupplies.com',
            phone: '+15551112222',
            address: '789 Paper St',
            status: SupplierStatus.ACTIVE,
        },
    })

    // Invoices
    await prisma.invoice.create({
        data: {
            entityId: entity.id,
            invoiceNumber: 'INV-001',
            supplierId: supplier.id,
            amount: 1500.00,
            issueDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            status: InvoiceStatus.PENDING,
            description: 'Monthly office supplies',
        },
    })

    // Template
    await prisma.invoiceTemplate.create({
        data: {
            entityId: entity.id,
            name: 'Standard Invoice',
            type: TemplateType.CUSTOM,
            content: JSON.stringify([{ id: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true }]),
        }
    })

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
