import crypto from "crypto";

export const SKUGenerator = (prefix: string = "SKU"): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}${timestamp}${randomPart}`;
};