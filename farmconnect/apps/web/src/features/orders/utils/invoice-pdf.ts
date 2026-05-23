import { jsPDF } from 'jspdf';

import type { Order, PaymentMethod } from '../api/orders.api';
import { asCurrency, readProductSnapshot, titleFromUnknown } from './order.utils';

interface GenerateInvoiceOptions {
  buyerName?: string | null;
  paymentMethod?: PaymentMethod | null;
}

function loadLogoDataUrl(): Promise<string | null> {
  return fetch('/logo.svg')
    .then(async (response) => {
      if (!response.ok) return null;
      const svg = await response.text();
      const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

      return await new Promise<string | null>((resolve) => {
        const image = new Image();
        image.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = image.width || 96;
            canvas.height = image.height || 96;
            const context = canvas.getContext('2d');
            if (!context) {
              resolve(null);
              return;
            }
            context.drawImage(image, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch {
            resolve(null);
          }
        };
        image.onerror = () => resolve(null);
        image.src = svgUrl;
      });
    })
    .catch(() => null);
}

function paymentMethodLabel(paymentMethod?: PaymentMethod | null) {
  switch (paymentMethod) {
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    case 'CASH_ON_DELIVERY':
      return 'Cash on Delivery';
    case 'CIB_CARD':
      return 'CIB Card';
    case 'EDAHABIA':
      return 'Edahabia';
    default:
      return 'Not set';
  }
}

export async function generateInvoicePdf(order: Order, options: GenerateInvoiceOptions = {}) {
  const doc = new jsPDF();
  const issuedAt = new Date().toLocaleString();
  const logoDataUrl = await loadLogoDataUrl();
  const sellerNames = Array.from(
    new Set(order.items.map((item) => item.product?.producer?.businessName).filter(Boolean)),
  ) as string[];
  const buyerName = options.buyerName ?? order.buyerAddress?.recipientName ?? order.buyer?.fullName ?? 'Buyer';

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 14, 10, 22, 22);
    } catch {
      // If SVG rendering is unavailable, continue with the text header.
    }
  }

  doc.setFontSize(20);
  doc.text('FarmConnect', 42, 18);
  doc.setFontSize(12);
  doc.text('Invoice', 42, 26);

  doc.setFontSize(10);
  doc.text(`Invoice ID: ${order.id}`, 14, 42);
  doc.text(`Date: ${issuedAt}`, 14, 48);
  doc.text(`Buyer: ${buyerName}`, 14, 54);
  doc.text(`Farms: ${sellerNames.join(', ') || 'Unknown farm'}`, 14, 60);
  doc.text(`Payment method: ${paymentMethodLabel(options.paymentMethod)}`, 14, 66);

  let y = 78;
  doc.setFontSize(11);
  doc.text('Product', 14, y);
  doc.text('Qty', 110, y);
  doc.text('Unit price', 136, y);
  doc.text('Total', 176, y, { align: 'right' });
  y += 4;
  doc.line(14, y, 196, y);
  y += 7;

  order.items.forEach((item) => {
    const snapshot = readProductSnapshot(item.productSnapshot);
    const productName =
      titleFromUnknown(snapshot.title, '') ||
      titleFromUnknown(item.product?.title, item.product?.slug ?? 'Product');

    doc.setFontSize(10);
    doc.text(productName.slice(0, 44), 14, y);
    doc.text(String(item.quantity), 110, y);
    doc.text(asCurrency(item.unitPrice, item.currency), 136, y);
    doc.text(asCurrency(item.total, item.currency), 176, y, { align: 'right' });
    y += 7;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  y += 4;
  doc.line(14, y, 196, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(`Order total: ${asCurrency(order.total, order.currency)}`, 176, y, { align: 'right' });

  y += 12;
  doc.setFontSize(9);
  doc.text('Thank you for using FarmConnect.', 14, y);
  doc.save(`farmconnect-invoice-${order.id.slice(0, 8)}.pdf`);
}
