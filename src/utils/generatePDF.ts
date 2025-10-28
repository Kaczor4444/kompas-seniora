import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FavoriteFacility } from './favorites';

const arialFont = require('@/src/fonts/arial-unicode.js');

export function generateFavoritesPDF(favorites: FavoriteFacility[]) {
  const doc = new jsPDF();
  
  // Add Arial Unicode font (full Polish support!)
  doc.addFileToVFS('ArialUnicode.ttf', arialFont);
  doc.addFont('ArialUnicode.ttf', 'Arial', 'normal');
  doc.setFont('Arial');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(244, 63, 94);
  doc.text('Kompas Seniora', 15, 20);
  
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Twoje Ulubione Placówki', 15, 32);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString('pl-PL', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Wygenerowano: ${date}`, 15, 40);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 45, pageWidth - 15, 45);
  
  // Prepare table data (NO character replacement needed!)
  const tableData = favorites.map((facility, index) => {
    const price = facility.koszt_pobytu 
      ? `${Math.round(facility.koszt_pobytu).toLocaleString('pl-PL')} zł/mc`
      : 'Bezpłatne';
    
    return [
      `${index + 1}.`,
      facility.nazwa,
      facility.typ_placowki,
      `${facility.miejscowosc}\n${facility.powiat}`,
      facility.telefon || '-',
      price
    ];
  });
  
  // Generate table with Arial Unicode
  autoTable(doc, {
    startY: 50,
    head: [['#', 'Nazwa placówki', 'Typ', 'Lokalizacja', 'Telefon', 'Koszt']],
    body: tableData,
    styles: {
      font: 'Arial',
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [244, 63, 94],
      textColor: [255, 255, 255],
      fontStyle: 'normal',
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 45 },
      2: { cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30, halign: 'right', textColor: [244, 63, 94] },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 15, right: 15 },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Arial');
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('kompas-seniora.vercel.app', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Strona ${i} z ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
  }
  
  doc.save(`kompas-seniora-ulubione-${Date.now()}.pdf`);
}
