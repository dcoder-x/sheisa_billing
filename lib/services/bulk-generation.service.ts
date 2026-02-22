import { prisma } from '@/lib/prisma'
import { BulkJobStatus } from '@prisma/client'
import { documentService } from './document.service'
import { sendEmail } from '@/lib/email'
import { nanoid } from 'nanoid'

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
                // Auto-parse JSON arrays/objects stored as cell values (for table fields)
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
    templateId: string
    csvData: string | File
    batchSize?: number
    notifyEmail?: string
}

export class BulkGenerationService {
    /**
     * Start a bulk generation job
     */
    async startBulkGeneration(config: BulkGenerationConfig) {
        const { userId, templateId, csvData, batchSize = 50, notifyEmail } = config

        let rows: any[] = []
        let filename = 'bulk_generation.csv'

        // Parse CSV
        if (typeof csvData === 'string') {
            const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true })
            rows = parsed.data
        } else if (csvData instanceof File) {
            filename = csvData.name
            const text = await csvData.text()
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
            rows = parsed.data
        } else {
            throw new Error('Invalid CSV data');
        }

        if (rows.length === 0) {
            throw new Error('CSV file is empty')
        }

        const totalRows = rows.length

        const template = await prisma.invoiceTemplate.findUnique({
            where: {
                id: templateId,
            },
        })

        if (!template) {
            throw new Error('Template not found')
        }

        // Create bulk generation job
        const entityId = template.entityId;

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

        // Start processing asynchronously
        console.log(`[BulkGeneration] Starting async processing for job ${job.id}`);
        this.processBulkJob(job.id, rows, template, notifyEmail, userId).catch((error) => {
            console.error('Bulk generation failed:', error)
        })

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
        const supplierName: string = (row['supplier_name'] || row['supplier'] || '').trim()
        let supplierId: string | undefined
        let supplierEmail: string | undefined

        if (supplierName) {
            const supplier = await prisma.supplier.findFirst({
                where: {
                    entityId,
                    name: { equals: supplierName, mode: 'insensitive' },
                },
            })
            if (supplier) {
                supplierId = supplier.id
                supplierEmail = supplier.email
            }
        }

        // Parse well-known columns
        const amount = parseFloat(row['amount'] || row['total'] || '0') || 0
        const issueDate = row['issue_date'] ? new Date(row['issue_date']) : new Date()
        const dueDate = row['due_date'] ? new Date(row['due_date']) : undefined
        const description = row['description'] || row['invoice_description'] || undefined
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
     * Process bulk generation job in batches
     */
    private async processBulkJob(
        jobId: string,
        rows: any[],
        template: any,
        notifyEmail?: string,
        userId?: string
    ) {
        const job = await prisma.bulkGenerationJob.findUnique({
            where: { id: jobId },
        })

        if (!job) {
            throw new Error('Job not found')
        }

        // Update job status
        await prisma.bulkGenerationJob.update({
            where: { id: jobId },
            data: {
                status: BulkJobStatus.PROCESSING,
            },
        })

        const errors: any[] = []
        const batchSize = 50 // Default

        // Process in batches
        const successDocumentIds: string[] = []

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, Math.min(i + batchSize, rows.length))

            // Process batch concurrently
            const batchPromises = batch.map(async (row, batchIndex) => {
                const currentRow = i + batchIndex + 1
                try {
                    const result = await documentService.generateDocument({
                        userId: userId || 'system',
                        templateId: template.id,
                        formData: row,
                        bulkJobId: jobId,
                    })

                    if (!result.success) {
                        throw new Error(result.error || 'Document generation failed')
                    }

                    // Create invoice record and (optionally) notify supplier
                    if (result.documentId) {
                        await this.createInvoiceForRow(
                            row,
                            template.entityId,
                            result.documentId,
                            result.documentUrl || ''
                        ).catch(err => console.error('Invoice creation failed for row', currentRow, err))
                    }

                    return { success: true, documentId: result.documentId }
                } catch (error: any) {
                    return { success: false, row: currentRow, data: row, error: error.message }
                }
            })

            const results = await Promise.all(batchPromises)

            let batchSuccessCount = 0
            let batchFailureCount = 0

            // Process results
            for (const result of results) {
                if (result.success && result.documentId) {
                    batchSuccessCount++
                    successDocumentIds.push(result.documentId)
                } else {
                    batchFailureCount++
                    errors.push({
                        row: result.row,
                        data: result.data,
                        error: result.error
                    })
                }
            }

            // Update job progress for the batch
            await prisma.bulkGenerationJob.update({
                where: { id: jobId },
                data: {
                    processedRows: { increment: batch.length },
                    successCount: { increment: batchSuccessCount },
                    failureCount: { increment: batchFailureCount },
                },
            })

            // Small delay between batches
            await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Generate Zip if there are successful documents
        let zipUrl: string | undefined
        if (successDocumentIds.length > 0 && userId) {
            try {
                const zipDocId = await documentService.createZipFromDocuments(successDocumentIds, userId)
                const zipDoc = await documentService.getDocumentById(zipDocId, userId)
                if (zipDoc && zipDoc.pdfUrl) {
                    zipUrl = await documentService.getDocumentPdfUrl(zipDocId, userId, 7 * 24 * 3600) || undefined
                }
            } catch (error) {
                console.error('Failed to generate zip for bulk job:', error)
            }
        }

        // Mark job as completed
        await prisma.bulkGenerationJob.update({
            where: { id: jobId },
            data: {
                status: errors.length === rows.length ? BulkJobStatus.FAILED : BulkJobStatus.COMPLETED,
                errorLog: errors.length > 0 ? errors : undefined,
                resultUrl: zipUrl, // Save the Zip URL
            },
        })

        // Send notification email
        if (notifyEmail) {
            // ... send email logic ...
            await sendEmail({
                to: notifyEmail,
                subject: 'Bulk Generation Completed',
                html: `<p>Your bulk generation job is complete. ${zipUrl ? `<a href="${zipUrl}">Download Zip</a>` : ''}</p>`
            });
        }
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId: string, userId: string) {
        const job = await prisma.bulkGenerationJob.findFirst({
            where: {
                id: jobId,
                // entityId check?
            },
        })

        if (!job) {
            throw new Error('Job not found')
        }

        const progress = job.totalRows > 0 ? (job.processedRows / job.totalRows) * 100 : 0

        return {
            ...job,
            progress: Math.round(progress),
        }
    }

}

export const bulkGenerationService = new BulkGenerationService()
