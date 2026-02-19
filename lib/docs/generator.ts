import { PDFDocument } from 'pdf-lib';
import { Lead } from '@prisma/client';

export async function generateIntakePacket(lead: Lead) {
  const formUrl = 'https://your-storage-bucket.com/templates/Asset_Recovery_Agreement.pdf';
  const formPdfBytes = await fetch(formUrl).then(res => res.arrayBuffer());

  const pdfDoc = await PDFDocument.load(formPdfBytes);
  const form = pdfDoc.getForm();

  form.getTextField('FirstNameField').setText(lead.firstName);
  form.getTextField('LastNameField').setText(lead.lastName);
  form.getTextField('SurplusAmountField').setText(`$${lead.estimatedSurplus.toLocaleString()}`);
  form.getTextField('DateGeneratedField').setText(new Date().toLocaleDateString());

  if (lead.documentsNeeded && lead.documentsNeeded.length > 0) {
    const checklistText = `Please provide the following:\n- ` + lead.documentsNeeded.join('\n- ');
    const instructionsField = form.getTextField('CustomInstructionsField');
    if (instructionsField) instructionsField.setText(checklistText);
  }

  form.flatten();
  const pdfBytes = await pdfDoc.save();
  
  return { 
    url: `https://your-storage.com/generated/${lead.id}-packet.pdf`,
    base64: Buffer.from(pdfBytes).toString('base64')
  };
}