import { prisma } from '@/lib/prisma'
import { BulkJobStatus } from '@prisma/client'
import { documentService } from './document.service'
import { standardInvoiceGeneratorService, StandardInvoiceData } from './standard-invoice-generator.service'
import StorageService from '@/lib/storage/storage.service'
import { StoragePaths } from '@/lib/storage/types'
import { sendEmail } from '@/lib/email'
import { nanoid } from 'nanoid'
import { Client } from "@upstash/qstash"

const qstashClient = new Client({
    token: process.env.QSTASH_TOKEN || 'dummy-token-for-dev',
    baseUrl: process.env.QSTASH_URL || undefined,
});

// RFC-4180 compliant CSV parser — handles quoted fields including embedded JSON arrays
function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } // escaped quote
            else { inQuotes = !inQuotes }
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += ch
        }
    }
    result.push(current.trim())
    return result
}

const Papa = {
    parse: (text: string, options: any) => {
        const lines = text.split('\n').filter(line => line.trim())
        if (lines.length === 0) return { data: [] }

        const headers = parseCSVLine(lines[0])
        const data = lines.slice(1).map(line => {
            const values = parseCSVLine(line)
            const row: any = {}
            headers.forEach((header, i) => {
                const raw = values[i]?.trim() || ''
                if ((raw.startsWith('[') || raw.startsWith('{')) && (raw.endsWith(']') || raw.endsWith('}'))) {
                    try { row[header.trim()] = JSON.parse(raw) } catch { row[header.trim()] = raw }
                } else {
                    row[header.trim()] = raw
                }
            })
            return row
        })
        return { data }
    }
}

export interface BulkGenerationConfig {
    userId: string
    entityId: string
    templateId?: string
    csvData?: string | File
    rows?: any[]
    isStandardInvoice?: boolean
    notifyEmail?: string
}

export interface BatchProcessingPayload {
    jobId: string;
    rows: any[];
    entityId: string;
    templateId?: string;
    notifyEmail?: string;
    userId?: string;
}

export class BulkGenerationService {

    /**
     * Start a bulk generation job (QStash Producer)
     */
    async startBulkGeneration(config: BulkGenerationConfig) {
        const { userId, entityId, templateId, csvData, rows: providedRows, isStandardInvoice, notifyEmail } = config

        let rows: any[] = providedRows || []

        // Parse CSV if provided (Legacy Flow for Template Builder)
        if (!providedRows && csvData) {
            if (typeof csvData === 'string') {
                const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true })
                rows = parsed.data
            } else if (csvData instanceof File) {
                const text = await csvData.text()
                const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
                rows = parsed.data
            }
        }

        if (rows.length === 0) {
            throw new Error('Data payload is empty')
        }

        const totalRows = rows.length

        let template = null;
        if (templateId) {
            template = await prisma.invoiceTemplate.findUnique({
                where: { id: templateId },
            })
            if (!template) throw new Error('Template not found')
        }

        // Create bulk generation job
        const job = await prisma.bulkGenerationJob.create({
            data: {
                entityId,
                totalRows,
                processedRows: 0,
                successCount: 0,
                failureCount: 0,
                status: BulkJobStatus.PENDING,
            },
        })

        // Chunk rows into batches of 50
        const batchSize = 50;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        for (let i = 0; i < rows.length; i += batchSize) {
            const batchRows = rows.slice(i, i + batchSize);
            const payload: BatchProcessingPayload = {
                jobId: job.id,
                rows: batchRows,
                entityId,
                templateId: template?.id,
                notifyEmail,
                userId
            };

            // If we're in a dev mode without QStash keys, we can just immediately call processBatch asynchronously
            // But ideally we rely on QStash for timeouts. We'll publish to QStash here.
            try {
                if (process.env.QSTASH_TOKEN) {
                    await qstashClient.publishJSON({
                        url: `${appUrl}/api/webhooks/qstash/bulk-generate`,
                        body: payload,
                    });
                } else {
                    // Fallback for immediate local testing if no token is present
                    console.log('[BulkGeneration] QSTASH_TOKEN not found. Processing batch asynchronously in-memory.');
                    this.processBatch(payload).catch(console.error);
                }
            } catch (err) {
                console.error('Failed to publish batch to QStash', err);
                // Fallback
                this.processBatch(payload).catch(console.error);
            }
        }

        return {
            jobId: job.id,
            totalRows,
        }
    }

    /**
     * Create an Invoice record for a CSV row after successful document generation
     */
    private async createInvoiceForRow(
        row: any,
        entityId: string,
        documentId: string,
        documentUrl: string
    ) {
        // Resolve supplier by name (case-insensitive) scoped to entity
        const supplierName: string = (row['STAFFNAME'] || row['supplier_name'] || row['supplier'] || '').trim()
        let supplierId: string | undefined
        let supplierEmail: string | undefined

        const emailFromCsv = (row['EMAIL DO FORNECEDOR'] || row['EMAIL FORNECEDOR'] || row['EMAIL'] || row['email_fornecedor'] || '').trim()
        const phoneFromCsv = (row['TELEFONE DO FORNECEDOR'] || row['TELEFONE FORNECEDOR'] || row['TELEFONE'] || row['telefone_fornecedor'] || '').trim()
        const addressFromCsv = (row['ENDEREÇO DO FORNECEDOR'] || row['ENDEREÇO FORNECEDOR'] || row['ENDEREÇO'] || row['endereco_fornecedor'] || '').trim()

        if (supplierName) {
            let supplier = await prisma.supplier.findFirst({
                where: {
                    entityId,
                    name: { equals: supplierName, mode: 'insensitive' },
                },
            })

            // If found but email is missing and CSV provided one, we can optionally update it.
            if (supplier) {
                if (!supplier.email || supplier.email.includes('@example.com')) {
                    if (emailFromCsv || phoneFromCsv || addressFromCsv) {
                        supplier = await prisma.supplier.update({
                            where: { id: supplier.id },
                            data: {
                                email: emailFromCsv || supplier.email,
                                phone: phoneFromCsv || supplier.phone,
                                address: addressFromCsv || supplier.address,
                            }
                        })
                    }
                }
                supplierId = supplier.id
                supplierEmail = supplier.email
            } else {
                // Auto register the supplier if not found
                const newSupplier = await prisma.supplier.create({
                    data: {
                        entityId,
                        name: supplierName,
                        email: emailFromCsv || `${supplierName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
                        phone: phoneFromCsv || '',
                        address: addressFromCsv || '',
                        status: 'ACTIVE'
                    }
                })
                supplierId = newSupplier.id;
                supplierEmail = newSupplier.email;
            }
        }

        // Parse well-known columns
        const amount = parseFloat(row['A PAGAR'] || row['amount'] || row['total'] || '0') || 0
        const issueDate = row['issue_date'] ? new Date(row['issue_date']) : new Date()
        const dueDate = row['due_date'] ? new Date(row['due_date']) : undefined
        const description = row['LOTO'] ? `LOTO & VENDAS SB For ${supplierName}` : (row['description'] || row['invoice_description'] || undefined)
        const invoiceNumber = row['invoice_number'] || `INV-${nanoid(8).toUpperCase()}`

        // Create invoice record
        const invoice = await prisma.invoice.create({
            data: {
                entityId,
                invoiceNumber,
                supplierId: supplierId || null,
                documentId,
                amount,
                issueDate,
                dueDate: dueDate || null,
                description,
                attachmentUrl: documentUrl,
                status: 'PENDING',
            },
        })

        // Email supplier if found and has email
        if (supplierEmail) {
            await sendEmail({
                to: supplierEmail,
                subject: `Invoice ${invoiceNumber} from your client`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1e293b;">Invoice ${invoiceNumber}</h2>
                        <p>Dear ${supplierName},</p>
                        <p>Please find your invoice details below:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Invoice Number</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${invoiceNumber}</td></tr>
                            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Amount</td><td style="padding: 8px; border: 1px solid #e2e8f0;">$${amount.toFixed(2)}</td></tr>
                            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Issue Date</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${issueDate.toLocaleDateString()}</td></tr>
                            ${dueDate ? `<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Due Date</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${dueDate.toLocaleDateString()}</td></tr>` : ''}
                            ${description ? `<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Description</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${description}</td></tr>` : ''}
                        </table>
                        ${documentUrl ? `<p><a href="${documentUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Download Invoice</a></p>` : ''}
                        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">This invoice was generated automatically. Please contact us if you have any questions.</p>
                    </div>
                `,
            }).catch(err => console.error('Failed to send supplier invoice email:', err))
        }

        return invoice
    }

    /**
     * Process a batch of rows from QStash Webhook Consumer
     */
    async processBatch(payload: BatchProcessingPayload) {
        const { jobId, rows, entityId, templateId, notifyEmail, userId } = payload;

        const job = await prisma.bulkGenerationJob.findUnique({
            where: { id: jobId },
        })
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
        })

        if (!job || !entity) {
            throw new Error('Job or Entity not found')
        }

        if (job.status === BulkJobStatus.PENDING) {
            await prisma.bulkGenerationJob.update({
                where: { id: jobId },
                data: { status: BulkJobStatus.PROCESSING },
            });
        }

        let template = null;
        if (templateId) {
            template = await prisma.invoiceTemplate.findUnique({ where: { id: templateId } });
        }

        const errors: any[] = []
        let batchSuccessCount = 0
        let batchFailureCount = 0

        // Process batch concurrently
        const batchPromises = rows.map(async (row, batchIndex) => {
            try {
                let documentId = '';
                let documentUrl = '';

                if (template) {
                    const result = await documentService.generateDocument({
                        userId: userId || 'system',
                        templateId: template.id,
                        formData: row,
                        bulkJobId: jobId,
                    })

                    if (!result.success) {
                        throw new Error(result.error || 'Document generation failed')
                    }
                    documentId = result.documentId || '';
                    documentUrl = result.documentUrl || '';
                } else {
                    // STANDARD INVOICE LOGIC
                    const invoiceNumber = `FT 2026/${nanoid(4).toUpperCase()}`;
                    const issueDate = new Date();

                    const clientName = (row['STAFFNAME'] || 'Cliente Desconhecido').trim()
                    const clientNif = (row['N° Bihete - NIF'] || '').trim()

                    const paramToNumber = (val: any) => {
                        if (!val) return 0;
                        if (typeof val === 'number') return val;
                        return parseFloat(val.toString().trim().replace(/ /g, '').replace(/\./g, '').replace(',', '.')) || 0;
                    }

                    const lotoAmt = paramToNumber(row['LOTO']);
                    const vendasAmt = paramToNumber(row['VENDAS SB']);
                    const grossTotal = paramToNumber(row['COMISSÃO BRUTA']);
                    const totalComissao = paramToNumber(row['TOTAL COMISSÃO']);
                    const taxTotal = paramToNumber(row['IMPOSTO']);
                    const discountTotal = paramToNumber(row['TOTAL DESCONTO']);
                    const netTotal = paramToNumber(row['A PAGAR']);

                    const standardData: StandardInvoiceData = {
                        entity,
                        clientName,
                        clientNif,
                        invoiceNumber: invoiceNumber.split(' ')[1],
                        issueDate,
                        lines: [
                            { code: 'LOTO', description: 'LOTO', price: lotoAmt, qty: 1, taxRate: 0, discountRate: 0, total: lotoAmt },
                            { code: 'VENDAS', description: 'VENDAS SB', price: vendasAmt, qty: 1, taxRate: 0, discountRate: 0, total: vendasAmt }
                        ],
                        summary: {
                            grossTotal: grossTotal || totalComissao,
                            discountTotal,
                            globalDiscount: 0,
                            totalWithDiscount: (grossTotal || totalComissao) - discountTotal,
                            taxTotal,
                            retention: 0,
                            netTotal
                        }
                    };

                    const base64Pdf = await standardInvoiceGeneratorService.generate(standardData);
                    const fileBuffer = Buffer.from(base64Pdf.split(',')[1], 'base64');
                    const filename = `${nanoid()}.pdf`;

                    const doc = await prisma.document.create({
                        data: {
                            content: row,
                            status: 'completed',
                            bulkJob: { connect: { id: jobId } }
                        }
                    });
                    documentId = doc.id;

                    const storagePath = StoragePaths.templateDocument(userId || 'system', 'standard', documentId, filename);
                    const uploadResult = await StorageService.upload(fileBuffer, storagePath, {
                        contentType: 'application/pdf',
                        isPublic: false,
                        userId: userId || 'system'
                    });

                    documentUrl = uploadResult.url;

                    await prisma.document.update({
                        where: { id: documentId },
                        data: {
                            pdfUrl: documentUrl,
                            content: { ...row, url: documentUrl }
                        }
                    });
                }

                if (documentId) {
                    await this.createInvoiceForRow(row, entityId, documentId, documentUrl)
                        .catch(err => console.error('Invoice creation failed for row', err))
                }

                return { success: true, documentId }
            } catch (error: any) {
                console.error('Row Generation Failed:', error);
                return { success: false, data: row, error: error.message }
            }
        })

        const results = await Promise.all(batchPromises)

        for (const result of results) {
            if (result.success && result.documentId) {
                batchSuccessCount++
            } else {
                batchFailureCount++
                errors.push({
                    data: result.data,
                    error: result.error
                })
            }
        }

        // Atomically increment job counters and append errors if any
        let updatedJob;
        if (errors.length > 0) {
            const currentJob = await prisma.bulkGenerationJob.findUnique({ where: { id: jobId } });
            const currentErrors = Array.isArray(currentJob?.errorLog) ? currentJob?.errorLog : [];
            updatedJob = await prisma.bulkGenerationJob.update({
                where: { id: jobId },
                data: {
                    processedRows: { increment: rows.length },
                    successCount: { increment: batchSuccessCount },
                    failureCount: { increment: batchFailureCount },
                    errorLog: [...currentErrors, ...errors]
                },
            });
        } else {
            updatedJob = await prisma.bulkGenerationJob.update({
                where: { id: jobId },
                data: {
                    processedRows: { increment: rows.length },
                    successCount: { increment: batchSuccessCount },
                    failureCount: { increment: batchFailureCount },
                },
            });
        }

        // Check if this was the last batch by comparing total processed + failed vs totalRows
        // Since `processedRows` represents ALL attempted rows, it should equal totalRows when finished
        if (updatedJob.processedRows >= updatedJob.totalRows) {
            console.log(`Job ${jobId} finished processing. Generating Zip...`)
            await this.finalizeJob(updatedJob.id, updatedJob, notifyEmail, userId);
        }
    }

    /**
     * Finalizes the Job, generates the Zip, and sends completion email
     */
    private async finalizeJob(jobId: string, jobStats: any, notifyEmail?: string, userId?: string) {
        let zipUrl: string | undefined

        try {
            // Find all successfully generated documents for this job
            const documents = await prisma.document.findMany({
                where: { bulkJobId: jobId, status: 'completed', pdfUrl: { not: null } },
                select: { id: true, pdfUrl: true }
            });

            const successDocIds = documents.map((d: any) => d.id);

            if (successDocIds.length > 0 && userId) {
                const zipDocId = await documentService.createZipFromDocuments(successDocIds, userId)
                const zipDoc = await documentService.getDocumentById(zipDocId, userId)
                if (zipDoc && zipDoc.pdfUrl) {
                    zipUrl = await documentService.getDocumentPdfUrl(zipDocId, userId, 7 * 24 * 3600) || undefined
                }
            }
        } catch (error) {
            console.error('Failed to generate zip for bulk job:', error)
        }

        await prisma.bulkGenerationJob.update({
            where: { id: jobId },
            data: {
                status: jobStats.failureCount === jobStats.totalRows ? BulkJobStatus.FAILED : BulkJobStatus.COMPLETED,
                resultUrl: zipUrl,
            },
        })

        if (notifyEmail) {
            await sendEmail({
                to: notifyEmail,
                subject: 'Bulk Generation Completed',
                html: `<p>Your bulk generation job is complete. Processed ${jobStats.totalRows} records. ${zipUrl ? `<br/><br/><a href="${zipUrl}">Download Zip</a>` : ''}</p>`
            }).catch(e => console.error('Notify Email Error:', e));
        }
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId: string, userId?: string) {
        const job = await prisma.bulkGenerationJob.findFirst({
            where: { id: jobId },
        })

        if (!job) throw new Error('Job not found')

        const progress = job.totalRows > 0 ? (job.processedRows / job.totalRows) * 100 : 0
        return {
            ...job,
            progress: Math.round(progress),
        }
    }
}

export const bulkGenerationService = new BulkGenerationService()
