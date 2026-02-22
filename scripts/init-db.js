import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database initialization...');

  // Upsert test entity
  const entity = await prisma.entity.upsert({
    where: { registrationNumber: 'REG-2024-001' },
    update: {},
    create: {
      name: 'Tech Solutions Inc',
      registrationNumber: 'REG-2024-001',
      email: 'contact@techsolutions.com',
      phone: '+1-555-0100',
      address: '123 Business St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'United States',
      businessType: 'Technology',
      status: 'ACTIVE',
    },
  });

  console.log('Upserted entity:', entity.id);

  // Clean up existing child data to ensure fresh seed
  console.log('Cleaning up existing data...');
  await prisma.invoice.deleteMany({ where: { entityId: entity.id } });
  await prisma.transaction.deleteMany({ where: { entityId: entity.id } });
  await prisma.supplier.deleteMany({ where: { entityId: entity.id } });

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@shiesa.com' },
    update: {},
    create: {
      email: 'admin@shiesa.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Upserted admin user:', adminUser.email);

  const entityUser = await prisma.user.upsert({
    where: { email: 'user@techsolutions.com' },
    update: { entityId: entity.id },
    create: {
      email: 'user@techsolutions.com',
      password: hashedPassword,
      fullName: 'John Doe',
      role: 'ENTITY_USER',
      entityId: entity.id,
    },
  });

  console.log('Upserted entity user:', entityUser.email);

  // Create demo suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      entityId: entity.id,
      name: 'Global Supplies Ltd',
      email: 'contact@globalsupplies.com',
      phone: '+1-555-0101',
      address: '456 Supply Ave',
      bankAccount: 'BANK-123456',
      status: 'ACTIVE',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      entityId: entity.id,
      name: 'Premium Services Co',
      email: 'info@premiumservices.com',
      phone: '+1-555-0102',
      address: '789 Service Blvd',
      bankAccount: 'BANK-789012',
      status: 'ACTIVE',
    },
  });

  console.log('Created suppliers');

  // Create demo invoices
  const invoices = [
    {
      invoiceNumber: '#100F950',
      amount: 250,
      status: 'PAID',
      daysAgo: 7,
    },
    {
      invoiceNumber: '#100F522',
      amount: 12780,
      status: 'PENDING',
      daysAgo: 2,
    },
    {
      invoiceNumber: '#100F98F',
      amount: 740,
      status: 'PAID',
      daysAgo: 3,
    },
    // Removed duplicate entry for #100F98F which was in the original file
    {
      invoiceNumber: '#100DF40',
      amount: 17890,
      status: 'CANCELLED',
      daysAgo: 4,
    },
  ];

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    const daysAgo = inv.daysAgo || 0;
    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - daysAgo);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    /* 
       Note: We removed the duplicate object from the array, but if any other invoices exist globally,
       this might still fail. However, since we define specific invoice numbers here and deleted 
       entity-linked invoices above, this should be safe unless invoice validation is global 
       across entities AND sharing numbers. Our schema implies global uniqueness.
       But we're only cleaning up *this* entity's invoices.
       If '#100F950' belongs to *another* entity, it will fail. 
       In a dev seed, this is usually acceptable, or we could delete by invoiceNumber.
    */

    // Safety check: Delete if exists (global check)
    await prisma.invoice.deleteMany({
      where: { invoiceNumber: inv.invoiceNumber }
    });

    await prisma.invoice.create({
      data: {
        entityId: entity.id,
        invoiceNumber: inv.invoiceNumber,
        supplierId: i % 2 === 0 ? supplier1.id : supplier2.id,
        amount: inv.amount,
        issueDate,
        dueDate,
        paymentDate: inv.status === 'PAID' ? new Date(issueDate.getTime() + 86400000) : null,
        status: inv.status,
        description: `Invoice for services rendered`,
      },
    });
  }

  console.log('Created demo invoices');

  // Create demo transactions
  await prisma.transaction.create({
    data: {
      entityId: entity.id,
      type: 'INCOME',
      amount: 16860,
      description: 'Monthly service income',
      transactionDate: new Date(),
      category: 'Services',
    },
  });

  await prisma.transaction.create({
    data: {
      entityId: entity.id,
      type: 'EXPENSE',
      amount: 12500,
      description: 'Supplier payments',
      transactionDate: new Date(),
      category: 'Operations',
    },
  });

  console.log('Created demo transactions');
  console.log('Database initialization completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
