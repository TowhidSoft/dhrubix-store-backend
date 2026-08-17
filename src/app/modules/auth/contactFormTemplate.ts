export const contactFormTemplate = (name: string, email: string, message: string) => {
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
