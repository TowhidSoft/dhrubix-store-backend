import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { filenameToUrl } from "../files/utils/file-url.utils";

const CURRENCY_SYMBOLS: Record<string, string> = {
    BDT: "৳",
    USD: "$",
    EUR: "€",
    GBP: "£",
};

const money = (amount: number, currency?: string) => {
    const symbol = CURRENCY_SYMBOLS[currency || "BDT"] || `${currency || ""} `;
    return `${symbol}${(amount || 0).toFixed(2)}`;
};

export interface InvoiceProduct {
    name: string;
    quantity: number;
    price: number; // unit price at time of purchase
}

export interface InvoiceData {
    orderNo: string;
    orderDate: Date;
    deliveredDate?: Date;
    customerName: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    paymentMethod: string;
    currency?: string;
    amount: number; // grand total
    shippingFee: number;
    products: InvoiceProduct[];
}

/**
 * Renders a simple, standard invoice PDF for a delivered order and writes it
 * to the uploads folder (served statically at /uploads, same convention as
 * product images — see file-url.utils.ts). Returns the filename + public URL
 * so the caller can store it on the Order record and attach it to an email.
 */
export const generateInvoicePdf = (data: InvoiceData): Promise<{ filename: string; filePath: string; url: string }> => {
    return new Promise((resolve, reject) => {
        try {
            const filename = `invoice-${data.orderNo}.pdf`;
            const uploadsDir = path.join(process.cwd(), "uploads");
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const filePath = path.join(uploadsDir, filename);

            const doc = new PDFDocument({ size: "A4", margin: 50 });
            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // ---------- Header ----------
            doc
                .fillColor("#2558B3")
                .fontSize(22)
                .font("Helvetica-Bold")
                .text("Dhrubix Store", 50, 50);

            doc
                .fillColor("#111827")
                .fontSize(20)
                .font("Helvetica-Bold")
                .text("INVOICE", 400, 50, { align: "right" });

            doc
                .fillColor("#6B7280")
                .fontSize(10)
                .font("Helvetica")
                .text(`Order No: ${data.orderNo}`, 400, 78, { align: "right" })
                .text(`Order Date: ${data.orderDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`, 400, 92, { align: "right" });

            if (data.deliveredDate) {
                doc.text(
                    `Delivered: ${data.deliveredDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`,
                    400,
                    106,
                    { align: "right" }
                );
            }

            doc.moveTo(50, 130).lineTo(545, 130).strokeColor("#E5E7EB").stroke();

            // ---------- Bill To ----------
            doc
                .fillColor("#9CA3AF")
                .fontSize(9)
                .font("Helvetica-Bold")
                .text("BILL TO", 50, 145);

            const addressLine = [data.address, data.city, data.state, data.zipCode, data.country]
                .filter(Boolean)
                .join(", ");

            doc
                .fillColor("#111827")
                .fontSize(11)
                .font("Helvetica-Bold")
                .text(data.customerName, 50, 160);

            doc
                .fillColor("#374151")
                .fontSize(10)
                .font("Helvetica")
                .text(addressLine, 50, 176, { width: 300 })
                .text(data.phone, 50, doc.y + 2)
                .text(data.email, 50, doc.y + 2);

            doc
                .fillColor("#9CA3AF")
                .fontSize(9)
                .font("Helvetica-Bold")
                .text("PAYMENT METHOD", 350, 145);
            doc
                .fillColor("#111827")
                .fontSize(10)
                .font("Helvetica")
                .text(data.paymentMethod, 350, 160);

            // ---------- Product table ----------
            let tableTop = 240;
            const col = { name: 50, qty: 330, price: 400, total: 480 };

            doc
                .fillColor("#ffffff")
                .rect(50, tableTop, 495, 24)
                .fill("#2558B3");

            doc
                .fillColor("#ffffff")
                .fontSize(9)
                .font("Helvetica-Bold")
                .text("PRODUCT", col.name + 8, tableTop + 7)
                .text("QTY", col.qty, tableTop + 7, { width: 50, align: "center" })
                .text("UNIT PRICE", col.price, tableTop + 7, { width: 70, align: "right" })
                .text("TOTAL", col.total, tableTop + 7, { width: 60, align: "right" });

            let rowY = tableTop + 24;
            let subtotal = 0;

            data.products.forEach((p, idx) => {
                const lineTotal = p.price * p.quantity;
                subtotal += lineTotal;
                const rowHeight = 26;

                if (idx % 2 === 1) {
                    doc.rect(50, rowY, 495, rowHeight).fill("#F9FAFB");
                }

                doc
                    .fillColor("#111827")
                    .fontSize(9)
                    .font("Helvetica")
                    .text(p.name, col.name + 8, rowY + 8, { width: 260 })
                    .text(String(p.quantity), col.qty, rowY + 8, { width: 50, align: "center" })
                    .text(money(p.price, data.currency), col.price, rowY + 8, { width: 70, align: "right" })
                    .text(money(lineTotal, data.currency), col.total, rowY + 8, { width: 60, align: "right" });

                rowY += rowHeight;

                // Basic pagination guard for very long orders
                if (rowY > 700) {
                    doc.addPage();
                    rowY = 50;
                }
            });

            doc.moveTo(50, rowY + 6).lineTo(545, rowY + 6).strokeColor("#E5E7EB").stroke();

            // ---------- Summary ----------
            let summaryY = rowY + 20;
            const summaryLabelX = 380;
            const summaryValueX = 480;

            doc
                .fillColor("#6B7280")
                .fontSize(10)
                .font("Helvetica")
                .text("Subtotal", summaryLabelX, summaryY, { width: 90 })
                .text(money(subtotal, data.currency), summaryValueX, summaryY, { width: 65, align: "right" });

            summaryY += 18;
            doc
                .text("Shipping Fee", summaryLabelX, summaryY, { width: 90 })
                .text(money(data.shippingFee, data.currency), summaryValueX, summaryY, { width: 65, align: "right" });

            summaryY += 22;
            doc.moveTo(summaryLabelX, summaryY).lineTo(545, summaryY).strokeColor("#E5E7EB").stroke();
            summaryY += 10;

            doc
                .fillColor("#111827")
                .fontSize(13)
                .font("Helvetica-Bold")
                .text("Total", summaryLabelX, summaryY, { width: 90 })
                .fillColor("#2558B3")
                .text(money(data.amount, data.currency), summaryValueX, summaryY, { width: 65, align: "right" });

            // ---------- Footer ----------
            doc
                .fillColor("#9CA3AF")
                .fontSize(9)
                .font("Helvetica")
                .text(
                    "Thank you for shopping with Dhrubix Store. This is a system-generated invoice.",
                    50,
                    760,
                    { align: "center", width: 495 }
                );

            doc.end();

            writeStream.on("finish", () => {
                resolve({
                    filename,
                    filePath,
                    url: filenameToUrl(filename),
                });
            });
            writeStream.on("error", reject);
        } catch (err) {
            reject(err);
        }
    });
};
