export const otpVerificationTemplate = (otp: string | number) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email Verification</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" 
      style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; 
      overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <tr>
        <td style="background: #007BFF; padding: 16px; color: #ffffff; font-size: 20px; font-weight: bold; text-align: center;">
          🔐 Email Verification
        </td>
      </tr>

      <tr>
        <td style="padding: 20px; color: #333;">
          <p style="font-size: 15px; margin-bottom: 15px;">
            Please use the One-Time Password (OTP) below to verify your email address:
          </p>

          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; 
            background: #f5f5f5; padding: 14px; border-radius: 6px; margin: 20px 0;">
            ${otp}
          </p>

          <p style="font-size: 14px; color: #555;">
            This OTP will expire in <strong>2 minutes</strong>. Please do not share it with anyone.
          </p>
        </td>
      </tr>

      <tr>
        <td style="background: #f1f1f1; padding: 12px; text-align: center; font-size: 12px; color: #666;">
          This email was sent by <a style="font-weight:600" href="https://devtowhid.vercel.app/">Fuchka App</a>.  
          If you didn’t request this, you can safely ignore it.
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};
