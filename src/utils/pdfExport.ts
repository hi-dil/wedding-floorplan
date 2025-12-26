import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { Table, Guest } from "@/types";

interface TableWithGuests extends Table {
  guests: Guest[];
}

export interface PdfExportData {
  tables: TableWithGuests[];
  eventTitle?: string;
}

function drawSingleTable(
  pdf: jsPDF,
  table: TableWithGuests,
  x: number,
  y: number,
  width: number
): number {
  const totalPax = table.guests.reduce((sum, g) => sum + g.pax, 0);

  // Table header with name and occupancy
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(201, 162, 39); // Gold #C9A227
  const tableTitle = `${table.name} (${totalPax}/${table.seats} seats)`;
  pdf.text(tableTitle, x, y);

  const tableStartY = y + 4;

  // Build table data
  const tableData: (string | number)[][] = [];

  if (table.guests.length === 0) {
    tableData.push(["-", "(No guests)", "-", "-"]);
  } else {
    table.guests.forEach((guest, idx) => {
      tableData.push([
        idx + 1,
        guest.name,
        guest.phone || "-",
        guest.pax,
      ]);
    });
  }

  // Generate table using autoTable
  autoTable(pdf, {
    startY: tableStartY,
    head: [["#", "Name", "Phone", "Pax"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [201, 162, 39], // Gold #C9A227
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [61, 61, 61], // #3D3D3D
    },
    alternateRowStyles: {
      fillColor: [255, 254, 247], // Light ivory #FFFEF7
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" }, // #
      1: { cellWidth: width * 0.45 }, // Name
      2: { cellWidth: width * 0.35 }, // Phone
      3: { cellWidth: 10, halign: "center" }, // Pax
    },
    styles: {
      cellPadding: 1.5,
      lineColor: [232, 213, 163], // #E8D5A3
      lineWidth: 0.2,
    },
    tableWidth: width,
    margin: { left: x, right: pdf.internal.pageSize.getWidth() - x - width },
    didParseCell: (data) => {
      if (data.cell.raw === "(No guests)") {
        data.cell.styles.textColor = [150, 150, 150];
        data.cell.styles.fontStyle = "italic";
      }
    },
  });

  // Return the final Y position
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (pdf as any).lastAutoTable.finalY;
}

function addGuestTablesToPdf(
  pdf: jsPDF,
  tables: TableWithGuests[],
  startY: number
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const columnGap = 10;
  const columnWidth = (pageWidth - margin * 2 - columnGap) / 2;

  // Section title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(92, 64, 51); // Dark brown #5C4033
  pdf.text("Guest List by Table", pageWidth / 2, startY, { align: "center" });

  let currentY = startY + 10;

  // Sort tables naturally (Table 2 before Table 10)
  const sortedTables = [...tables].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  // Process tables in pairs
  for (let i = 0; i < sortedTables.length; i += 2) {
    const leftTable = sortedTables[i];
    const rightTable = sortedTables[i + 1]; // May be undefined if odd number

    // Estimate max height needed for this row
    const leftRows = Math.max(leftTable.guests.length, 1);
    const rightRows = rightTable ? Math.max(rightTable.guests.length, 1) : 0;
    const maxRows = Math.max(leftRows, rightRows);
    const estimatedHeight = 20 + maxRows * 6;

    // Check if we need a new page
    if (currentY + estimatedHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }

    // Draw left table
    const leftFinalY = drawSingleTable(
      pdf,
      leftTable,
      margin,
      currentY,
      columnWidth
    );

    // Draw right table (if exists)
    let rightFinalY = currentY;
    if (rightTable) {
      rightFinalY = drawSingleTable(
        pdf,
        rightTable,
        margin + columnWidth + columnGap,
        currentY,
        columnWidth
      );
    }

    // Move to next row (use the taller of the two tables)
    currentY = Math.max(leftFinalY, rightFinalY) + 10;
  }
}

export async function exportFloorPlanToPdf(
  floorPlanElement: HTMLElement,
  data: PdfExportData
): Promise<void> {
  // Create PDF in portrait A4
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;

  // Add header/title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(92, 64, 51); // Dark brown #5C4033
  pdf.text(data.eventTitle || "Floor Plan", pageWidth / 2, margin + 5, {
    align: "center",
  });

  let currentY = margin + 15;

  // Capture floor plan as image using html2canvas
  try {
    const canvas = await html2canvas(floorPlanElement, {
      scale: 2,
      backgroundColor: "#FFFEF7",
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
    });

    const imgData = canvas.toDataURL("image/png");

    // Calculate dimensions to fit width while maintaining aspect ratio
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    // Cap the image height to leave room for guest list
    const maxImgHeight = 80;
    const finalImgHeight = Math.min(imgHeight, maxImgHeight);
    const finalImgWidth =
      imgHeight > maxImgHeight
        ? (canvas.width / canvas.height) * finalImgHeight
        : imgWidth;

    // Center the image if it's narrower than page width
    const imgX = margin + (imgWidth - finalImgWidth) / 2;

    // Add border around image
    pdf.setDrawColor(232, 213, 163); // #E8D5A3
    pdf.setLineWidth(0.5);
    pdf.rect(imgX - 1, currentY - 1, finalImgWidth + 2, finalImgHeight + 2, "S");

    // Add the floor plan image
    pdf.addImage(imgData, "PNG", imgX, currentY, finalImgWidth, finalImgHeight);
    currentY += finalImgHeight + 15;
  } catch (error) {
    console.error("Error capturing floor plan:", error);
    // Continue with guest list even if image fails
  }

  // Add guest tables in 2-column paired layout
  addGuestTablesToPdf(pdf, data.tables, currentY);

  // Generate filename with date
  const date = new Date().toISOString().split("T")[0];
  const filename = `floor-plan-${date}.pdf`;

  // Download the PDF
  pdf.save(filename);
}
