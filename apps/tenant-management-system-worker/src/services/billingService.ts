import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";

// --- INTERFACE (No changes needed) ---
export interface IReceiptData {
  billNo: string;
  paymentDate: string;
  receivedAmount: number;
  rentMonth: string | null;
  tenantName: string | null;
  propertyType: string | null; 
  floor: string | null;
  propertyNumber: string | null;
  estateName: string | null;
  proprietor: string | null;
  propertyAddress: string | null;
  basic: number | null;
  propertyTax: number | null;
  repairCess: number | null;
  misc: number | null;
  chequeReturnCharge: number | null;
  previousOutstanding: number | null;
  penalty: number | null;
}

// --- CURRENCY FORMATTER (Using "Rs." as confirmed) ---
function formatCurrency(num: number | null) {
  const amount = num ?? 0;
  // The table in the PDF does not have Rs. So we handle it separately
  return amount.toLocaleString("en-IN");
}

// --- NEW HELPER: To convert number to words (Indian English) ---
function numberToWords(num: number): string {
  const a = [
    "",
    "one ",
    "two ",
    "three ",
    "four ",
    "five ",
    "six ",
    "seven ",
    "eight ",
    "nine ",
    "ten ",
    "eleven ",
    "twelve ",
    "thirteen ",
    "fourteen ",
    "fifteen ",
    "sixteen ",
    "seventeen ",
    "eighteen ",
    "nineteen ",
  ];
  const b = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  function inWords(n: number): string {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  }

  let result = "";
  result += inWords(Math.floor(num / 10000000)) + "crore ";
  num %= 10000000;
  result += inWords(Math.floor(num / 100000)) + "lakh ";
  num %= 100000;
  result += inWords(Math.floor(num / 1000)) + "thousand ";
  num %= 1000;
  result += inWords(num);

  // Clean up extra spaces and capitalize
  result = result.replace(/\s+/g, " ").trim();
  result = result.charAt(0).toUpperCase() + result.slice(1);

  return result + " Rupees Only";
}

// --- The PDF Generation Service ---
export async function generateBillPdf(data: IReceiptData): Promise<Uint8Array> {
  if (!data.rentMonth) {
    throw new Error("Cannot generate a bill without a rent month.");
  }

  const pdfDoc = await PDFDocument.create();
  // Using a slightly different page size to better match the original's proportions
  const page = pdfDoc.addPage([595, 421]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const FONT_SIZE = 10;
  const BLACK = rgb(0, 0, 0);

  // Helper to draw centered text
  const drawCenteredText = (text: string, y: number, f: any, size: number) => {
    const textWidth = f.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y,
      font: f,
      size,
      color: BLACK,
    });
  };

  // --- HEADER ---
  drawCenteredText(
    data.estateName?.toUpperCase() || "JAY MAHAL ESTATE",
    height - 40,
    boldFont,
    16
  );
  drawCenteredText(
    data.propertyAddress ||
      "20/48, LOHAR CHAWL OR 39, KITCHEN GARDEN LANE, MUMBAI-400002",
    height - 55,
    font,
    FONT_SIZE
  );

  // --- BILL INFO ---
  page.drawText(`BILL NO: ${data.billNo}`, {
    x: 40,
    y: height - 85,
    font,
    size: FONT_SIZE,
  });
  page.drawText(`DATE: ${format(new Date(data.paymentDate), "dd/MM/yyyy")}`, {
    x: width - 150,
    y: height - 85,
    font,
    size: FONT_SIZE,
  });

  page.drawText(data.tenantName?.toUpperCase() || "TENANT NAME", {
    x: 40,
    y: height - 110,
    font,
    size: FONT_SIZE,
  });
  page.drawText("Dr. To,", {
    x: width - 150,
    y: height - 110,
    font,
    size: FONT_SIZE,
  });

  // --- RENT DETAILS (Complex part) ---
  const proprietorName = data.proprietor || "Jay Kajaria & Bina Kajaria";
  drawCenteredText(proprietorName, height - 125, boldFont, 12);

  const rentDetailsY = height - 150;
  page.drawText(`For rent of ${data.propertyType?.toUpperCase() || "OFFICE"}`, {
    x: 40,
    y: rentDetailsY,
    font,
    size: FONT_SIZE,
  });
  page.drawText(`No. ${data.propertyNumber || ""}`, {
    x: 260,
    y: rentDetailsY,
    font,
    size: FONT_SIZE,
  });
  page.drawText(`on ${data.floor?.toUpperCase() || ""}`, {
    x: 330,
    y: rentDetailsY,
    font,
    size: FONT_SIZE,
  });
  page.drawText(`floor of the above premises`, {
    x: 380,
    y: rentDetailsY,
    font,
    size: FONT_SIZE,
  });

  page.drawText(
    `for the month of ${format(new Date(data.rentMonth), "MMMM yyyy")}`,
    { x: 40, y: rentDetailsY - 20, font, size: FONT_SIZE }
  );

  // Amount in words
  const totalAmount =
    (data.basic ?? 0) +
    (data.propertyTax ?? 0) +
    (data.repairCess ?? 0) +
    (data.misc ?? 0) +
    (data.penalty ?? 0) +
    (data.previousOutstanding ?? 0);
  page.drawText(numberToWords(totalAmount), {
    x: 260,
    y: rentDetailsY - 20,
    font,
    size: FONT_SIZE,
  });

  // --- TABLE ---
  const tableTopY = height - 210;
  const tableHeaders = [
    "Basic",
    "Property\nTax",
    "Repair\nCess",
    "Miscellaneous",
    "Penalty",
    "Previous\nOutstanding",
    "Total",
  ];
  const colXPositions = [40, 110, 180, 260, 350, 410, 500];

  // Draw table lines
  page.drawLine({
    start: { x: 35, y: tableTopY + 22 },
    end: { x: width - 35, y: tableTopY + 22 },
  });
  page.drawLine({
    start: { x: 35, y: tableTopY - 5 },
    end: { x: width - 35, y: tableTopY - 5 },
  });
  page.drawLine({
    start: { x: 35, y: tableTopY - 25 },
    end: { x: width - 35, y: tableTopY - 25 },
  });
  for (const x of [35, 105, 175, 255, 345, 405, 495, width - 35]) {
    page.drawLine({
      start: { x, y: tableTopY + 22 },
      end: { x, y: tableTopY - 25 },
    });
  }

  // Draw table headers
  tableHeaders.forEach((header, i) => {
    const lines = header.split("\n");
    lines.forEach((line, j) => {
      const textWidth = font.widthOfTextAtSize(line, FONT_SIZE);
      page.drawText(line, {
        x: colXPositions[i] + (65 - textWidth) / 2,
        y: tableTopY + 10 - j * 10,
        font,
        size: FONT_SIZE,
      });
    });
  });

  // Draw table values
  const tableValues = [
    data.basic,
    data.propertyTax,
    data.repairCess,
    data.misc,
    data.penalty,
    data.previousOutstanding,
    totalAmount,
  ].map(formatCurrency);

  tableValues.forEach((value, i) => {
    const textWidth = font.widthOfTextAtSize(value, FONT_SIZE);
    page.drawText(value, {
      x: colXPositions[i] + (65 - textWidth) / 2,
      y: tableTopY - 15,
      font,
      size: FONT_SIZE,
    });
  });

  // --- FOOTER ---
  const footerY = height - 310;
  page.drawText("Payment received by on ________________", {
    x: 40,
    y: footerY,
    font,
    size: FONT_SIZE,
  });
  drawCenteredText("Without Prejudice.", footerY, font, FONT_SIZE);

  const proprietorText = "PROPRIETOR";
  const proprietorWidth = font.widthOfTextAtSize(proprietorText, FONT_SIZE);
  page.drawText(proprietorText, {
    x: width - 40 - proprietorWidth,
    y: footerY,
    font,
    size: FONT_SIZE,
  });

  // [cite_start]; // Hardcoded due date from the bill [cite: 126]
  page.drawText("Pay within Due Date: 30/9/2025", {
    x: width - 190,
    y: tableTopY - 45,
    font,
    size: FONT_SIZE,
  });

  // Signature line
  page.drawLine({
    start: { x: width - 150, y: footerY - 5 },
    end: { x: width - 40, y: footerY - 5 },
  });

  drawCenteredText("RENT MEANS STANDARD RENT", height - 350, font, FONT_SIZE);

  // --- NOTES AT BOTTOM ---
  const notesY = height - 380;
  const notes = [
    "PLEASE NOTE a. Payment is valid subject to realisation of cheque. b. This is a computer generated bill and does not require any signature.",
    "c. Any discrepancy must be brought to notice within 15 days. d. Penalty on late payment will be charged every quarter.",
    `e. Cheque return charge will be Rs. ${formatCurrency(data.chequeReturnCharge)}/-`,
  ];
  notes.forEach((note, i) => {
    page.drawText(note, { x: 40, y: notesY - i * 12, font, size: 8 });
  });

  return pdfDoc.save();
}
