import nodemailer from "nodemailer";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NDFI TRACK brand colors from Tailwind config
const BRAND_COLORS = {
  primary: '#739b3c',      // primary-600
  primaryLight: '#84a861', // primary-500
  primaryDark: '#5a7a2f',  // primary-700
  secondary: '#899b33',    // secondary-600
  secondaryLight: '#8da34d', // secondary-500
  secondaryDark: '#6b7a28',  // secondary-700
  base: '#a8c27a',         // base-500
  baseLight: '#b0d394',    // base-400
  baseDark: '#94b05f',     // base-600
  black: '#2e3e14',        // black
  success: '#10b981',      // Keep success green
  warning: '#f59e0b',      // Keep warning orange
  error: '#ef4444'         // Keep error red
};

// Beautiful HTML email template with NDFI TRACK brand colors
const createEmailTemplate = (message, purpose) => {
  const purposeTitle = purpose?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Update";
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NDFI TRACK - ${purposeTitle}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f9fbf5;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                border: 1px solid #e9f0e0;
            }
            .header {
                background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
                position: relative;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
            }
            .logo-container {
                margin-bottom: 25px;
                position: relative;
                z-index: 1;
            }
            .logo-image {
                max-width: 100px;
                height: auto;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                background-color: white;
                padding: 8px;
            }
            .logo-text {
                font-size: 32px;
                font-weight: 700;
                margin-top: 20px;
                margin-bottom: 8px;
                position: relative;
                z-index: 1;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .tagline {
                font-size: 16px;
                opacity: 0.95;
                font-style: italic;
                position: relative;
                z-index: 1;
                font-weight: 300;
            }
            .content {
                padding: 40px 30px;
            }
            .message {
                background: linear-gradient(135deg, #f9fbf5 0%, #eff5e7 100%);
                padding: 25px;
                border-radius: 12px;
                border-left: 5px solid ${BRAND_COLORS.primary};
                margin: 25px 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            .message p {
                margin: 0 0 15px 0;
                color: #374151;
            }
            .message p:last-child {
                margin-bottom: 0;
            }
            .footer {
                background: linear-gradient(135deg, #f9fbf5 0%, #eff5e7 100%);
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9f0e0;
            }
            .contact-info {
                background: linear-gradient(135deg, ${BRAND_COLORS.primary}10 0%, ${BRAND_COLORS.secondary}10 100%);
                padding: 20px;
                border-radius: 12px;
                margin: 25px 0;
                border: 1px solid ${BRAND_COLORS.primary}20;
            }
            .contact-info h3 {
                margin-top: 0;
                color: ${BRAND_COLORS.primary};
                font-size: 18px;
                font-weight: 600;
            }
            .contact-info p {
                margin: 8px 0;
                color: #374151;
            }
            .highlight {
                color: ${BRAND_COLORS.primary};
                font-weight: 600;
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                margin: 15px 0;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(115, 155, 60, 0.3);
                transition: all 0.3s ease;
            }
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(115, 155, 60, 0.4);
            }
            .alert {
                background: linear-gradient(135deg, ${BRAND_COLORS.warning}10 0%, ${BRAND_COLORS.warning}05 100%);
                border: 1px solid ${BRAND_COLORS.warning}30;
                color: #92400e;
                padding: 18px;
                border-radius: 12px;
                margin: 20px 0;
                font-size: 14px;
            }
            .alert strong {
                color: ${BRAND_COLORS.warning};
            }
            .success-badge {
                display: inline-block;
                background: ${BRAND_COLORS.success};
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin: 5px 0;
            }
            .info-badge {
                display: inline-block;
                background: ${BRAND_COLORS.primary};
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin: 5px 0;
            }
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, ${BRAND_COLORS.primary}20 50%, transparent 100%);
                margin: 25px 0;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 12px;
                }
                .header {
                    padding: 30px 20px;
                }
                .content {
                    padding: 30px 20px;
                }
                .logo-text {
                    font-size: 28px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-container">
                    <img src="cid:logo.png" alt="NDFI TRACK Logo" class="logo-image">
                </div>
                <div class="logo-text">NDFI TRACK</div>
                <div class="tagline">Transforming Finance, Empowering Growth</div>
            </div>
            
            <div class="content">
                <div class="message">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                
                <div class="contact-info">
                    <h3>📞 Contact Information</h3>
                    <p><strong>Phone:</strong> +250 78 831 722</p>
                    <p><strong>Email:</strong> info@ndfis.rw</p>
                    <p><strong>Address:</strong> Kigali, Rwanda</p>
                    <p><strong>Website:</strong> <a href="https://ndfis.rw" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">ndfis.rw</a></p>
                </div>
                
                <div class="divider"></div>
                
                <div class="alert">
                    <strong>🔒 Security Notice:</strong> Please keep this notification for your records. 
                    For security reasons, never share your personal information with unauthorized persons.
                    If you have any concerns, please contact us immediately.
                </div>
            </div>
            
            <div class="footer">
                <p style="margin: 0; color: ${BRAND_COLORS.secondary}; font-size: 14px; font-weight: 500;">
                    © 2025 Afriforge | NDFI TRACK. All rights reserved.
                </p>
                <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">
                    This is an automated message. Please do not reply to this email.
                </p>
                <div style="margin-top: 15px;">
                    <span class="success-badge">✓ Secure</span>
                    <span class="info-badge">📧 Official</span>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const sendEmail = async (to, subject, message, purpose = "custom") => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let htmlContent = createEmailTemplate(message, purpose);

  // Try to attach the logo if it exists
  const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
  const attachments = [];
  
  if (fs.existsSync(logoPath) && fs.statSync(logoPath).size > 0) {
    attachments.push({
      filename: 'logo.png',
      path: logoPath,
      cid: 'logo.png'
    });
    console.log('Logo attached successfully');
  } else {
    console.log('Logo file not found or empty at:', logoPath);
    console.log('Please add the logo.png file to the assets directory');
    // Create a fallback template without logo
    const fallbackHtmlContent = createEmailTemplate(message, purpose).replace(
      '<img src="cid:logo.png" alt="NDFI TRACK Logo" class="logo-image">',
      '<div style="font-size: 40px; margin-bottom: 15px;">🏦</div>'
    );
    htmlContent = fallbackHtmlContent;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message, // Plain text version for email clients that don't support HTML
    html: htmlContent, // HTML version with beautiful template
    attachments: attachments
  });
};
