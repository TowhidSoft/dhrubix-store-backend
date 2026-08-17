import { frontend_url } from "../../../config/config";

export const orderMailTemplate = (name: string, email: string, message: string) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>New Contact Form Submission</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <tr>
        <td style="background: #af6900; padding: 16px; color: #ffffff; font-size: 20px; font-weight: bold; text-align: center;">
          📩 New Contact Form Submission by Customer
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; color: #333;">
          <p style="font-size: 16px; margin-bottom: 10px;"><strong>Name:</strong> ${name}</p>
          <p style="font-size: 16px; margin-bottom: 10px; color: #af6900"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 16px; margin-bottom: 10px;"><strong>Message:</strong></p>
          <p style="font-size: 15px; background: #f5f5f5; padding: 12px; border-radius: 6px; white-space: pre-line;">${message}</p>
        </td>
      </tr>
      <tr>
        <td style="background: #f1f1f1; padding: 12px; text-align: center; font-size: 12px; color: #666;">
          This email was generated from the contact form on your website. <a style="font-weight:600; color: #af6900" href="https://store.dhrubix.com">https://store.dhrubix.com</a>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

// --------------------------------------------------------------------------
// Shared helpers for the order-status / invoice templates below
// --------------------------------------------------------------------------

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const formatMoney = (amount: number, currency?: string) => {
  const symbol = CURRENCY_SYMBOLS[currency || "BDT"] || `${currency || ""} `;
  return `${symbol}${(amount || 0).toFixed(2)}`;
};

// Customer-facing copy + colour per status. Keep in sync with the
// STATUS_DISPLAY_MAP on the frontend (order.service.ts / OrderList.tsx).
export const STATUS_EMAIL_META: Record<
  string,
  { label: string; color: string; message: string }
> = {
  PENDING: {
    label: "Processing",
    color: "#F59E0B",
    message: "We've received your order and it's being processed.",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "#2563EB",
    message: "Your order has been accepted and is being prepared for shipment.",
  },
  DISPATCHED: {
    label: "Out for Delivery",
    color: "#7C3AED",
    message: "Your order is on its way to you.",
  },
  DELIVERED: {
    label: "Delivered",
    color: "#16A34A",
    message: "Your order has been delivered. We hope you love it!",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#DC2626",
    message: "Your order has been cancelled.",
  },
};

interface OrderEmailProduct {
  name: string;
  image?: string;
  quantity: number;
  price: number;
}

interface OrderEmailData {
  orderNo: string;
  status: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  amount: number;
  shippingFee: number;
  currency?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  trackingUrl: string;
  products: OrderEmailProduct[];
}

const renderProductRows = (products: OrderEmailProduct[], currency?: string) =>
  products
    .map(
      (p) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right: 12px;">
                  <img src="${p.image || ""}" width="56" height="56" alt="${p.name}" style="border-radius: 6px; object-fit: cover; display: block; background:#f5f5f5;" />
                </td>
                <td style="font-size: 14px; color: #222; vertical-align: middle;">${p.name}</td>
              </tr>
            </table>
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; font-size: 14px; color: #555;">x${p.quantity}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 14px; color: #222; font-weight: 600;">${formatMoney(p.price * p.quantity, currency)}</td>
        </tr>`
    )
    .join("");

/**
 * Order status-update email — Daraz/Evaly-style layout:
 * brand header, status banner, itemized product table, order summary,
 * shipping address, and a "Track your order" CTA.
 */
export const orderStatusEmailTemplate = (data: OrderEmailData) => {
  const meta = STATUS_EMAIL_META[data.status] || {
    label: data.status,
    color: "#374151",
    message: "Your order status has been updated.",
  };
  const subtotal = data.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const addressLine = [data.address, data.city, data.state, data.zipCode, data.country]
    .filter(Boolean)
    .join(", ");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Order ${data.orderNo} — ${meta.label}</title>
  </head>
  <body style="margin:0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f2f4f7; padding: 24px 12px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">

      <!-- Brand header -->
      <tr>
        <td style="background: #2558B3; padding: 20px 28px; text-align: center;">
          <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.3px;">Dhrubix Store</span>
        </td>
      </tr>

      <!-- Status banner -->
      <tr>
        <td style="padding: 28px 28px 8px 28px; text-align: center;">
          <span style="display:inline-block; padding: 6px 18px; border-radius: 999px; background: ${meta.color}1A; color: ${meta.color}; font-size: 13px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;">
            ${meta.label}
          </span>
          <p style="margin: 16px 0 4px 0; font-size: 18px; color: #111827; font-weight: 600;">Hi ${data.customerName},</p>
          <p style="margin: 0; font-size: 14px; color: #6B7280;">${meta.message}</p>
        </td>
      </tr>

      <!-- Order meta -->
      <tr>
        <td style="padding: 20px 28px 0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; border-radius: 8px; border: 1px solid #EEF0F3;">
            <tr>
              <td style="padding: 14px 18px; font-size: 13px; color: #6B7280;">Order ID</td>
              <td style="padding: 14px 18px; font-size: 13px; color: #111827; font-weight: 600; text-align: right;">${data.orderNo}</td>
            </tr>
            ${data.trackingNumber
      ? `<tr>
              <td style="padding: 0 18px 14px 18px; font-size: 13px; color: #6B7280;">Tracking Number</td>
              <td style="padding: 0 18px 14px 18px; font-size: 13px; color: #111827; font-weight: 600; text-align: right;">${data.trackingNumber}</td>
            </tr>`
      : ""
    }
          </table>
        </td>
      </tr>

      <!-- Product table -->
      <tr>
        <td style="padding: 20px 28px 0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr>
                <th align="left" style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; padding-bottom: 8px; border-bottom: 2px solid #F3F4F6;">Product</th>
                <th align="center" style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; padding-bottom: 8px; border-bottom: 2px solid #F3F4F6;">Qty</th>
                <th align="right" style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; padding-bottom: 8px; border-bottom: 2px solid #F3F4F6;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${renderProductRows(data.products, data.currency)}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- Order summary -->
      <tr>
        <td style="padding: 16px 28px 0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #6B7280;">Subtotal</td>
              <td style="padding: 4px 0; font-size: 13px; color: #111827; text-align: right;">${formatMoney(subtotal, data.currency)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #6B7280;">Shipping Fee</td>
              <td style="padding: 4px 0; font-size: 13px; color: #111827; text-align: right;">${formatMoney(data.shippingFee, data.currency)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0 0 0; font-size: 15px; color: #111827; font-weight: 700; border-top: 1px solid #F3F4F6;">Total</td>
              <td style="padding: 10px 0 0 0; font-size: 15px; color: #2558B3; font-weight: 700; text-align: right; border-top: 1px solid #F3F4F6;">${formatMoney(data.amount, data.currency)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Shipping address -->
      <tr>
        <td style="padding: 20px 28px 0 28px;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase; font-weight: 600;">Shipping Address</p>
          <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.5;">
            ${data.customerName}<br/>
            ${addressLine}<br/>
            ${data.phone}
          </p>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding: 28px; text-align: center;">
          <a href="${data.trackingUrl}" style="display: inline-block; background: #2558B3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px;">
            Track Your Order
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background: #F9FAFB; padding: 18px; text-align: center; font-size: 12px; color: #9CA3AF;">
          Thank you for shopping with <a style="color: #2558B3; font-weight: 600; text-decoration: none;" href="${frontend_url}">Dhrubix Store</a>.<br/>
          If you have any questions, just reply to this email.
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

/**
 * Sent alongside the DELIVERED status email — short note pointing to the
 * attached invoice PDF (and a download link, in case the attachment gets stripped).
 */
export const invoiceEmailTemplate = (data: {
  orderNo: string;
  customerName: string;
  invoiceUrl: string;
}) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Invoice for Order ${data.orderNo}</title>
  </head>
  <body style="margin:0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f2f4f7; padding: 24px 12px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
      <tr>
        <td style="background: #2558B3; padding: 20px 28px; text-align: center;">
          <span style="color: #ffffff; font-size: 20px; font-weight: 700;">Dhrubix Store</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px 28px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 18px; color: #111827; font-weight: 600;">Hi ${data.customerName},</p>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #6B7280;">
            Your order <b>${data.orderNo}</b> has been delivered. Your invoice is attached to this email as a PDF.
          </p>
          <a href="${data.invoiceUrl}" style="display: inline-block; background: #16A34A; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px;">
            Download Invoice
          </a>
        </td>
      </tr>
      <tr>
        <td style="background: #F9FAFB; padding: 18px; text-align: center; font-size: 12px; color: #9CA3AF;">
          Thank you for shopping with Dhrubix Store.
        </td>
      </tr>
    </table>
  </body>
  </html>
`;
