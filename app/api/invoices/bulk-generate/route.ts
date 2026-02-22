import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session || !session.entityId) {
        return NextResponse.json(
            { message: 'Unauthorized - Entity ID missing' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { templateId, csvData } = body;

        if (!templateId || !Array.isArray(csvData) || csvData.length === 0) {
            return NextResponse.json(
                { message: 'Invalid request data' },
                { status: 400 }
            );
        }

        const template = await prisma.invoiceTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return NextResponse.json(
                { message: 'Template not found' },
                { status: 404 }
            );
        }

        let successCount = 0;
        const errors: any[] = [];

        // Process each row
        for (const rowData of csvData) {
            const row = rowData as any;
            try {
                const { SupplierName, Email, Amount, Description, DueDate } = row;

                if (!SupplierName || !Email || !Amount) {
                    errors.push({ row, error: 'Missing required fields (SupplierName, Email, Amount)' });
                    continue;
                }

                // 1. Find or Create Supplier
                let supplier = await prisma.supplier.findFirst({
                    where: {
                        entityId: session.entityId,
                        email: Email,
                    },
                });

                if (!supplier) {
                    supplier = await prisma.supplier.create({
                        data: {
                            entityId: session.entityId,
                            name: SupplierName,
                            email: Email,
                            phone: '', // Optional in CSV
                            address: '', // Optional in CSV
                            status: 'ACTIVE',
                        },
                    });
                }

                // 2. Create Invoice
                const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const issueDate = new Date();
                const dueDateObj = DueDate ? new Date(DueDate) : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

                const newInvoice = await prisma.invoice.create({
                    data: {
                        entityId: session.entityId,
                        supplierId: supplier.id,
                        invoiceNumber,
                        amount: parseFloat(Amount),
                        issueDate,
                        dueDate: dueDateObj,
                        status: 'PENDING',
                        description: Description || template.name,
                        // attachmentUrl: 'TODO: Generate PDF', 
                    },
                });

                // 3. Generate Content (Simple accumulation)
                // In a real app, we'd generate a PDF here using a library like PDFKit or Puppeteer
                // For now, we'll just use the template content and replace placeholders for the email body.
                let emailContent = template.content;
                emailContent = emailContent.replace('{{SupplierName}}', supplier.name);
                emailContent = emailContent.replace('{{Amount}}', Amount);
                emailContent = emailContent.replace('{{InvoiceNumber}}', invoiceNumber);
                emailContent = emailContent.replace('{{Description}}', Description || '');
                emailContent = emailContent.replace('{{Date}}', issueDate.toLocaleDateString());

                // 4. Send Email
                await sendEmail({
                    to: Email,
                    subject: `Invoice ${invoiceNumber} from ${session.user.name || 'Us'}`, // Or Entity Name if available in session
                    html: emailContent
                });

                successCount++;
            } catch (err: any) {
                console.error('Error processing row:', row, err);
                errors.push({ row, error: err.message });
            }
        }

        return NextResponse.json({
            message: 'Bulk processing complete',
            count: successCount,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        console.error('Error in bulk generation:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
