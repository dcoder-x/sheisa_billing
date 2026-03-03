import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function run() {
    const doc = await PDFDocument.create();
    const page = doc.addPage([500, 500]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("APT 11, Morenike villa, Federal University of Technology Akure", {
        x: 10, y: 400, size: 12, font, maxWidth: 100
    });

    const bytes = await doc.save();
    fs.writeFileSync('test-wrap.pdf', bytes);
    console.log('done test-wrap');
}
run();
