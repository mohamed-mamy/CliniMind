const PDFDocument = require('pdfkit');

/**
 * Creates a PDF for an invoice
 * @param {Object} invoice Invoice object with populated items
 * @returns {PDFDocument} Readable stream
 */
exports.createInvoicePdf = (invoice) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Colors
  const primaryColor = '#0f766e';
  const lightBg = '#f0fdfa';
  const borderColor = '#d1d5db';

  // === HEADER ===
  doc.rect(50, 40, 495, 80).fill(primaryColor);
  doc.fill('#ffffff').fontSize(24).font('Helvetica-Bold')
    .text('CliniMind Center', 70, 55, { align: 'left' });
  doc.fontSize(10).font('Helvetica')
    .text('INVOICE', 70, 85, { align: 'left' });

  // Invoice number & status badge
  const statusColors = { paid: '#059669', unpaid: '#dc2626', partial: '#d97706' };
  const badgeColor = statusColors[invoice.status] || '#6b7280';
  doc.rect(400, 50, 145, 25).fill(badgeColor);
  doc.fill('#ffffff').fontSize(12).font('Helvetica-Bold')
    .text(invoice.status.toUpperCase(), 430, 56, { align: 'center', width: 85 });

  // === CLIENT & INVOICE INFO ===
  doc.fill('#374151').fontSize(10).font('Helvetica');
  const infoY = 145;
  doc.text('Bill To:', 50, infoY);
  doc.font('Helvetica-Bold').fontSize(12).fill('#111827')
    .text(invoice.patientName, 50, infoY + 15);
  doc.font('Helvetica').fontSize(10).fill('#6b7280')
    .text(`Patient ID: ${invoice.patientId || '—'}`, 50, infoY + 35);

  doc.font('Helvetica-Bold').fill('#374151').fontSize(10)
    .text('Invoice Details', 350, infoY);
  doc.font('Helvetica').fill('#6b7280').fontSize(10);
  doc.text(`Invoice #:`, 350, infoY + 15);
  doc.text(`Date:`, 350, infoY + 30);
  doc.text(`Status:`, 350, infoY + 45);
  doc.font('Helvetica-Bold').fill('#111827');
  doc.text(`${invoice.invoiceNumber}`, 430, infoY + 15);
  doc.text(`${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, 430, infoY + 30);
  doc.text(`${invoice.status === 'paid' ? 'Payée' : invoice.status === 'partial' ? 'Partielle' : 'Impayée'}`, 430, infoY + 45);

  // Divider
  const dividerY = infoY + 75;
  doc.moveTo(50, dividerY).lineTo(545, dividerY).strokeColor(borderColor).stroke();

  // === ITEMS TABLE ===
  const tableY = dividerY + 20;
  const colX = { desc: 50, qty: 280, price: 370, total: 470 };
  const colWidths = { desc: 220, qty: 80, price: 90, total: 70 };

  // Table header
  doc.rect(50, tableY, 495, 22).fill(primaryColor);
  doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('DESCRIPTION', colX.desc + 8, tableY + 6);
  doc.text('QTY', colX.qty + 8, tableY + 6, { width: colWidths.qty - 16, align: 'right' });
  doc.text('UNIT PRICE', colX.price + 8, tableY + 6, { width: colWidths.price - 16, align: 'right' });
  doc.text('TOTAL', colX.total + 8, tableY + 6, { width: colWidths.total - 16, align: 'right' });

  // Table rows
  let rowY = tableY + 22;
  doc.font('Helvetica').fontSize(9).fill('#374151');

  (invoice.items || []).forEach((item, i) => {
    if (i % 2 === 0) {
      doc.rect(50, rowY, 495, 22).fill(lightBg);
    }
    doc.fill('#374151');
    doc.text(item.description, colX.desc + 8, rowY + 6);
    doc.text(item.quantity.toString(), colX.qty + 8, rowY + 6, { width: colWidths.qty - 16, align: 'right' });
    doc.text(`${item.unitPrice.toFixed(2)}`, colX.price + 8, rowY + 6, { width: colWidths.price - 16, align: 'right' });
    doc.text(`${item.total.toFixed(2)}`, colX.total + 8, rowY + 6, { width: colWidths.total - 16, align: 'right' });
    rowY += 22;
  });

  // Table bottom border
  doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(borderColor).stroke();
  rowY += 5;

  // === TOTALS ===
  const subtotal = (invoice.items || []).reduce((sum, item) => sum + item.total, 0);

  const totalsX = 350;
  const drawTotalLine = (label, value, yPos, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 10);
    doc.fill('#374151').text(label, totalsX, yPos);
    doc.fill(bold ? '#111827' : '#374151')
      .text(`${value.toFixed(2)} MRU`, 540, yPos, { align: 'right' });
  };

  drawTotalLine('Subtotal:', subtotal, rowY, false);
  rowY += 18;

  if (invoice.discountValue > 0) {
    const discountAmount = subtotal - invoice.totalAmount;
    doc.fill('#dc2626');
    doc.font('Helvetica').fontSize(10)
      .text(`Discount (${invoice.discountType === 'percentage' ? invoice.discountValue + '%' : 'Fixed'}):`, totalsX, rowY);
    doc.text(`-${discountAmount.toFixed(2)} MRU`, 540, rowY, { align: 'right' });
    rowY += 18;
  }

  doc.moveTo(totalsX, rowY).lineTo(545, rowY).strokeColor(borderColor).stroke();
  rowY += 8;

  drawTotalLine('Total Due:', invoice.totalAmount, rowY, true);
  rowY += 18;

  doc.fill('#059669').font('Helvetica').fontSize(10)
    .text('Paid:', totalsX, rowY);
  doc.text(`${invoice.paidAmount.toFixed(2)} MRU`, 540, rowY, { align: 'right' });
  rowY += 18;

  if (invoice.remainingAmount > 0) {
    doc.fill('#dc2626').font('Helvetica-Bold').fontSize(11)
      .text('Remaining Balance:', totalsX, rowY);
    doc.text(`${invoice.remainingAmount.toFixed(2)} MRU`, 540, rowY, { align: 'right' });
    rowY += 25;
  } else {
    rowY += 10;
  }

  // === FOOTER ===
  doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(borderColor).stroke();
  rowY += 15;
  doc.fill('#6b7280').font('Helvetica').fontSize(8)
    .text('CliniMind Center — Thank you for your business', 50, rowY, { align: 'center' });

  return doc;
};

/**
 * Creates a PDF for a prescription
 * @param {Object} prescription Prescription object with populated drugs
 * @param {Object} patient Patient object
 * @returns {PDFDocument} Readable stream
 */
exports.createPrescriptionPdf = (prescription, patient) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const primaryColor = '#0f766e';

  // Header
  doc.rect(50, 40, 495, 70).fill(primaryColor);
  doc.fill('#ffffff').fontSize(22).font('Helvetica-Bold')
    .text('CliniMind Center', 70, 52);
  doc.fontSize(10).font('Helvetica')
    .text('PRESCRIPTION', 70, 80);

  // Date
  doc.fill('#374151').fontSize(10).font('Helvetica')
    .text(`Date: ${new Date(prescription.createdAt).toLocaleDateString('fr-FR')}`, 400, 52);
  if (patient) {
    doc.text(`Patient: ${patient.firstName} ${patient.lastName}`, 400, 67);
  }

  // Divider
  const divY = 130;
  doc.moveTo(50, divY).lineTo(545, divY).strokeColor('#d1d5db').stroke();

  // Notes
  let y = divY + 20;
  if (prescription.notes) {
    doc.rect(50, y, 495, 35).fill('#fef3c7');
    doc.fill('#92400e').fontSize(9).font('Helvetica-Bold')
      .text('NOTES', 60, y + 5);
    doc.font('Helvetica').fontSize(9)
      .text(prescription.notes, 60, y + 18);
    y += 50;
  }

  // Drugs header
  doc.rect(50, y, 495, 22).fill(primaryColor);
  doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold')
    .text('#', 58, y + 6);
  doc.text('MEDICATION', 80, y + 6);
  doc.text('DOSAGE', 260, y + 6);
  doc.text('DURATION', 370, y + 6);
  doc.text('INSTRUCTIONS', 440, y + 6);
  y += 22;

  // Drugs rows
  doc.font('Helvetica').fontSize(9).fill('#374151');
  (prescription.drugs || []).forEach((drug, index) => {
    doc.text(`${index + 1}.`, 58, y + 4);
    doc.font('Helvetica-Bold').text(drug.drugName, 80, y + 4);
    doc.font('Helvetica').text(drug.dosage, 260, y + 4);
    doc.text(`${drug.duration} days`, 370, y + 4);
    doc.text(drug.instructions || '—', 440, y + 4, { width: 100 });
    y += 22;
  });

  // Signature
  y = Math.max(y + 40, 600);
  doc.moveTo(350, y).lineTo(545, y).strokeColor('#d1d5db').stroke();
  doc.fill('#6b7280').fontSize(9).font('Helvetica')
    .text('Signature & Stamp', 400, y + 8, { align: 'right' });

  return doc;
};
