import { PrismaClient } from "@prisma/client";
import { standardInvoiceGeneratorService } from "./lib/services/standard-invoice-generator.service";

const prisma = new PrismaClient();

async function main() {
    const entity = await prisma.entity.findFirst();
    console.log("Found entity:", entity?.name);
    try {
        const base64Pdf = await standardInvoiceGeneratorService.generate({
            entity: entity as any,
            clientName: "Test Client",
            clientNif: "123456",
            invoiceNumber: "INV-123",
            issueDate: new Date(),
            lines: [{ code: "LOTO", description: "LOTO", price: 100, qty: 1, taxRate: 0, discountRate: 0, total: 100 }],
            summary: { grossTotal: 100, discountTotal: 0, globalDiscount: 0, totalWithDiscount: 100, taxTotal: 0, retention: 0, netTotal: 100 }
        });
        console.log("Success, PDF base64 length:", base64Pdf.length);
    } catch (err) {
        console.error("GENERATION ERROR:", err);
    }
}
main();
