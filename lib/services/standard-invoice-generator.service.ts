import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { Entity } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export interface StandardInvoiceLine {
    code: string;
    description: string;
    price: number;
    qty: number;
    taxRate: number;
    discountRate: number;
    total: number;
}

export interface StandardInvoiceSummary {
    grossTotal: number;      // Total ilíquido
    discountTotal: number;   // Desconto
    globalDiscount: number;  // Desconto Global
    totalWithDiscount: number; // Total com Descontos
    taxTotal: number;        // Total de Impostos
    retention: number;       // Retenção
    netTotal: number;        // Total a pagar
}

export interface StandardInvoiceData {
    entity: Entity;
    clientName: string;
    clientNif: string;
    clientAddress?: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate?: Date;
    lines: StandardInvoiceLine[];
    summary: StandardInvoiceSummary;
}

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
    }).format(val);
};

const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const formatDateTime = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 16);
};

export class StandardInvoiceGeneratorService {

    private drawTextValue(
        page: any, text: string, font: PDFFont, size: number,
        x: number, y: number, align: 'left' | 'right' | 'center' = 'left',
        maxWidth?: number
    ) {
        if (!text) return;
        const width = font.widthOfTextAtSize(text, size);
        let finalX = x;
        if (align === 'right') finalX = x - width;
        if (align === 'center') finalX = x - (width / 2);

        page.drawText(text, {
            x: finalX,
            y,
            size,
            font,
            color: rgb(0, 0, 0)
        });
    }

    async generate(data: StandardInvoiceData): Promise<string> {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4
        const { width, height } = page.getSize();

        // Fonts
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let currentY = height - 50;

        // --- Header Section ---
        // Left: Entity Info
        currentY -= 60; // Leave space for Logo

        // Entity Name
        this.drawTextValue(page, data.entity.name || 'Zito Andrade Cassange Comercial', boldFont, 10, 50, currentY);
        currentY -= 12;
        this.drawTextValue(page, data.entity.address || 'Rua Marien Ngouabi, Casa n° 54-A - Maianga - Luanda', regularFont, 9, 50, currentY);
        currentY -= 12;
        this.drawTextValue(page, `Tel: ${data.entity.phone || '(244) 923959316'}`, regularFont, 9, 50, currentY);
        currentY -= 12;
        this.drawTextValue(page, `E-mail: ${data.entity.email || 'cassangezitoandrade@gmail.com'}`, regularFont, 9, 50, currentY);
        currentY -= 12;
        this.drawTextValue(page, `Contribuinte: ${data.entity.registrationNumber || '001532176ME033'}`, regularFont, 9, 50, currentY);

        // Right: Client Info
        let rightY = height - 120;
        this.drawTextValue(page, 'Exmo.(s) Sr(s)', regularFont, 9, 350, rightY);
        rightY -= 12;
        this.drawTextValue(page, data.clientName.toUpperCase(), boldFont, 10, 350, rightY);
        if (data.clientAddress) {
            rightY -= 12;
            this.drawTextValue(page, data.clientAddress.toUpperCase(), regularFont, 9, 350, rightY);
        }

        currentY -= 30;

        // --- Document Title ---
        this.drawTextValue(page, 'Original', regularFont, 9, 50, currentY);
        currentY -= 15;
        this.drawTextValue(page, `Factura n.o ${data.invoiceNumber}`, boldFont, 11, 50, currentY);
        currentY -= 5;

        // Thick Line
        page.drawLine({
            start: { x: 50, y: currentY },
            end: { x: width - 50, y: currentY },
            thickness: 2,
            color: rgb(0, 0, 0)
        });
        currentY -= 15;

        // --- Document Info Table ---
        const docInfoHeaders = ['Data do Documento', 'Data Vencimento', 'Data/Hora de Emissão', 'Contribuinte', 'V/ Ref.'];
        const docInfoX = [50, 160, 260, 400, 480];

        docInfoHeaders.forEach((h, i) => this.drawTextValue(page, h, regularFont, 9, docInfoX[i], currentY));
        currentY -= 12;

        this.drawTextValue(page, formatDate(data.issueDate), regularFont, 9, docInfoX[0], currentY);
        this.drawTextValue(page, data.dueDate ? formatDate(data.dueDate) : formatDate(data.issueDate), regularFont, 9, docInfoX[1], currentY);
        this.drawTextValue(page, formatDateTime(data.issueDate), regularFont, 9, docInfoX[2], currentY);
        this.drawTextValue(page, data.clientNif || '', regularFont, 9, docInfoX[3], currentY);
        this.drawTextValue(page, 'JANEIRO', regularFont, 9, docInfoX[4], currentY); // placeholder

        currentY -= 12;
        this.drawTextValue(page, 'Observações', regularFont, 9, 50, currentY);
        currentY -= 5;

        page.drawLine({
            start: { x: 50, y: currentY },
            end: { x: width - 50, y: currentY },
            thickness: 1,
            color: rgb(0, 0, 0)
        });
        currentY -= 20;

        // --- Items Table Title ---
        const itemHeaders = ['Código', 'Descrição', 'Preço Uni.', 'Qtd.', 'Taxa/IVA %', 'Desc. %', 'Total'];
        const itemX = [50, 130, 360, 400, 460, 500, 545]; // Total right aligned at 545
        const itemAlign = ['left', 'left', 'right', 'right', 'right', 'right', 'right'] as any;

        page.drawLine({
            start: { x: 50, y: currentY + 12 },
            end: { x: width - 50, y: currentY + 12 },
            thickness: 2,
            color: rgb(0, 0, 0)
        });

        itemHeaders.forEach((h, i) => this.drawTextValue(page, h, boldFont, 9, itemX[i], currentY, itemAlign[i]));
        currentY -= 5;

        page.drawLine({
            start: { x: 50, y: currentY },
            end: { x: width - 50, y: currentY },
            thickness: 1,
            color: rgb(0, 0, 0)
        });
        currentY -= 15;

        // --- Items ---
        data.lines.forEach(line => {
            if (line.total === 0) return; // Skip 0 value lines
            this.drawTextValue(page, line.code, regularFont, 9, itemX[0], currentY, itemAlign[0]);
            this.drawTextValue(page, line.description, regularFont, 9, itemX[1], currentY, itemAlign[1]);
            this.drawTextValue(page, formatCurrency(line.price), regularFont, 9, itemX[2], currentY, itemAlign[2]);
            this.drawTextValue(page, line.qty.toFixed(2), regularFont, 9, itemX[3], currentY, itemAlign[3]);
            this.drawTextValue(page, `${line.taxRate.toFixed(2)}${line.taxRate === 0 ? 'M04' : ''}`, regularFont, 9, itemX[4], currentY, itemAlign[4]);
            this.drawTextValue(page, line.discountRate.toFixed(2), regularFont, 9, itemX[5], currentY, itemAlign[5]);
            this.drawTextValue(page, formatCurrency(line.total), regularFont, 9, itemX[6], currentY, itemAlign[6]);
            currentY -= 15;
        });

        // --- Bottom Area ---
        const bottomYStart = 250;

        page.drawLine({
            start: { x: 50, y: bottomYStart + 12 },
            end: { x: width - 50, y: bottomYStart + 12 },
            thickness: 2,
            color: rgb(0, 0, 0)
        });

        // --- Taxes Table (Left) ---
        let leftY = bottomYStart;
        const taxHeaders = ['Imposto/IVA %', 'Incidência', 'Valor'];
        const taxX = [50, 200, 300];

        taxHeaders.forEach((h, i) => this.drawTextValue(page, h, boldFont, 9, taxX[i], leftY));
        leftY -= 5;
        page.drawLine({
            start: { x: 50, y: leftY },
            end: { x: 300, y: leftY },
            thickness: 1,
            color: rgb(0, 0, 0)
        });
        leftY -= 15;
        this.drawTextValue(page, 'Isento - 0', regularFont, 9, taxX[0], leftY);
        this.drawTextValue(page, formatCurrency(data.summary.netTotal), regularFont, 9, taxX[1], leftY);
        this.drawTextValue(page, formatCurrency(data.summary.taxTotal), regularFont, 9, taxX[2], leftY);

        leftY -= 30;

        this.drawTextValue(page, 'Regime de IVA', boldFont, 9, 50, leftY);
        leftY -= 5;
        page.drawLine({ start: { x: 50, y: leftY }, end: { x: 300, y: leftY }, thickness: 1, color: rgb(0, 0, 0) });
        leftY -= 12;
        this.drawTextValue(page, 'Regime de exclusão', regularFont, 9, 50, leftY);
        leftY -= 20;

        this.drawTextValue(page, 'Bens e Serviços', boldFont, 9, 50, leftY);
        leftY -= 5;
        page.drawLine({ start: { x: 50, y: leftY }, end: { x: 300, y: leftY }, thickness: 1, color: rgb(0, 0, 0) });
        leftY -= 12;
        this.drawTextValue(page, 'Os bens/serviços foram colocados à disposição do adquirente na data e', regularFont, 8, 50, leftY);
        leftY -= 10;
        this.drawTextValue(page, 'local do documento', regularFont, 8, 50, leftY);
        leftY -= 20;

        this.drawTextValue(page, 'Dados Bancários', boldFont, 9, 50, leftY);
        leftY -= 5;
        page.drawLine({ start: { x: 50, y: leftY }, end: { x: 300, y: leftY }, thickness: 1, color: rgb(0, 0, 0) });
        leftY -= 12;
        this.drawTextValue(page, 'NIB BAI Conta - 13827431810001 | 004000003827431810139', regularFont, 8, 50, leftY);
        leftY -= 5;
        page.drawLine({ start: { x: 50, y: leftY }, end: { x: 300, y: leftY }, thickness: 1, color: rgb(0, 0, 0) });
        leftY -= 12;
        this.drawTextValue(page, 'NIB Banco Sol Conta - 14355224210001 | 004400004355224210192', regularFont, 8, 50, leftY);
        leftY -= 5;
        page.drawLine({ start: { x: 50, y: leftY }, end: { x: 300, y: leftY }, thickness: 1, color: rgb(0, 0, 0) });
        leftY -= 12;
        this.drawTextValue(page, 'NIB BFA Conta - 14758967130001 | 000600004758967130149', regularFont, 8, 50, leftY);
        leftY -= 5;
        page.drawLine({ start: { x: 50, y: leftY }, end: { x: 300, y: leftY }, thickness: 1, color: rgb(0, 0, 0) });

        // --- Summary Table (Right) ---
        let rightYStart = bottomYStart;
        this.drawTextValue(page, 'Sumário', boldFont, 9, 360, rightYStart);
        rightYStart -= 5;
        page.drawLine({ start: { x: 360, y: rightYStart }, end: { x: width - 50, y: rightYStart }, thickness: 1, color: rgb(0, 0, 0) });
        rightYStart -= 15;

        const summaryLabels = [
            'Total ilíquido:', 'Desconto:', 'Desconto Global:',
            'Total com Descontos:', 'Total de Impostos:', 'Retenção: (0,00%)'
        ];
        const summaryValues = [
            data.summary.grossTotal, data.summary.discountTotal, data.summary.globalDiscount,
            data.summary.totalWithDiscount, data.summary.taxTotal, data.summary.retention
        ];

        summaryLabels.forEach((label, i) => {
            this.drawTextValue(page, label, regularFont, 9, 360, rightYStart);
            this.drawTextValue(page, formatCurrency(summaryValues[i]), regularFont, 9, 545, rightYStart, 'right');
            rightYStart -= 12;
        });

        rightYStart -= 5;
        page.drawLine({ start: { x: 360, y: rightYStart }, end: { x: width - 50, y: rightYStart }, thickness: 1, color: rgb(0, 0, 0) });
        rightYStart -= 15;
        this.drawTextValue(page, 'Total:', boldFont, 10, 360, rightYStart);
        this.drawTextValue(page, formatCurrency(data.summary.netTotal), boldFont, 10, 545, rightYStart, 'right');

        rightYStart -= 5;
        page.drawLine({ start: { x: 360, y: rightYStart }, end: { x: width - 50, y: rightYStart }, thickness: 1, color: rgb(0, 0, 0) });

        // Footer Text
        const footerY = 50;
        this.drawTextValue(page, `${data.entity.address || 'Rua Marien Ngouabi, Casa n° 54-A - Maianga'} | tel: ${data.entity.phone}`, regularFont, 8, 50, footerY);
        this.drawTextValue(page, 'IAot - Processado por programa validado n.° 144/AGT/2019 | FactPlus', regularFont, 8, 50, footerY - 12);
        this.drawTextValue(page, '1 de 1', regularFont, 8, width - 50, footerY - 12, 'right');

        const modifiedPdfBytes = await pdfDoc.save();
        const modifiedPdfBase64 = Buffer.from(modifiedPdfBytes).toString('base64');
        return `data:application/pdf;base64,${modifiedPdfBase64}`;
    }
}

export const standardInvoiceGeneratorService = new StandardInvoiceGeneratorService();
