const PDFDocument = require('pdfkit');

/**
 * Creates a PDF for an invoice
 * @param {Object} invoice Invoice object with populated items
 * @returns {PDFDocument} Readable stream
 */
exports.createInvoicePdf = (invoice) => {
  const doc = new PDFDocument({ margin: 50 });

  // Add basic header
  doc.fontSize(20).text('CliniMind Center', { align: 'center' });
  doc.fontSize(10).text('Facture', { align: 'center' });
  doc.moveDown();

  // Invoice Details
  doc.fontSize(12).text(`Facture N°: ${invoice.invoiceNumber}`);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
  doc.text(`Patient: ${invoice.patientName}`);
  doc.moveDown();

  // Items table header
  const tableTop = doc.y;
  doc.font('Helvetica-Bold');
  doc.text('Description', 50, tableTop);
  doc.text('Quantité', 250, tableTop);
  doc.text('Prix Unitaire', 350, tableTop);
  doc.text('Total', 450, tableTop);
  
  doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();
  doc.font('Helvetica');

  // Items
  let y = tableTop + 25;
  invoice.items.forEach(item => {
    doc.text(item.description, 50, y);
    doc.text(item.quantity.toString(), 250, y);
    doc.text(item.unitPrice.toString(), 350, y);
    doc.text(item.total.toString(), 450, y);
    y += 20;
  });

  doc.moveTo(50, y).lineTo(500, y).stroke();
  y += 15;

  // Totals
  doc.font('Helvetica-Bold');
  
  // Calculate subtotal
  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
  
  doc.text('Sous-total:', 350, y);
  doc.text(`${subtotal} MRU`, 450, y);
  y += 20;

  if (invoice.discountValue > 0) {
    const discountText = invoice.discountType === 'percentage' 
      ? `Remise (${invoice.discountValue}%):` 
      : `Remise (Fixe):`;
    
    const discountAmount = subtotal - invoice.totalAmount;
    doc.text(discountText, 350, y);
    doc.text(`-${discountAmount} MRU`, 450, y);
    y += 20;
  }

  doc.text('Total à payer:', 350, y);
  doc.text(`${invoice.totalAmount} MRU`, 450, y);
  y += 20;

  doc.text('Montant payé:', 350, y);
  doc.text(`${invoice.paidAmount} MRU`, 450, y);
  y += 20;

  doc.text('Reste à payer:', 350, y);
  doc.text(`${invoice.remainingAmount} MRU`, 450, y);

  doc.end();
  return doc;
};
