import 'dotenv/config'

export const database = process.env.DATABASE_URL
export const PORT = process.env.PORT || 5000;
export const access_Key = process.env.JWT_ACCESS_SECRET_KEY
export const refresh_Key = process.env.JWT_REFRESH_SECRET_KEY
export const accessKey_ExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '7d'
export const refreshKey_ExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d'
export const bcryptSaltRound = process.env.BCRYPT_SALT_ROUNDS
export const smtp_host: string | any = process.env.SMTP_HOST
export const smtp_port = process.env.SMTP_PORT
export const smtp_user = process.env.SMTP_USER
export const smtp_pass = process.env.SMTP_PASS

export const emailToAdmin = process.env.CONTACT_FORM_EMAIL;

export const stripe_secret_key = process.env.STRIPE_SECRET_KEY
export const stripe_webhook_secret = process.env.STRIPE_WEBHOOK_SECRET

// Used to build "Track your order" / "View invoice" links inside emails.
// Set FRONTEND_URL in your .env — falls back to the production storefront domain.
export const frontend_url = process.env.FRONTEND_URL || "https://store.dhrubix.com"