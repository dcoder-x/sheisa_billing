import nodemailer from 'nodemailer';

// Check if email is configured
const isEmailConfigured = !!(
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD &&
  process.env.SMTP_HOST
);

// Create reusable transporter with fallback options (only if configured)
const transporter = isEmailConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '465') === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Fallback options for connection issues
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
}) : null;

// Verify transporter configuration (don't block app startup)
if (transporter) {
  transporter.verify(function (error, success) {
    if (error) {
      console.error('Email transporter error:', error);
      console.log('Email service may not work properly. Please check your SMTP configuration.');
    } else {
      console.log('Email server is ready to send messages');
    }
  });
} else {
  console.log('Email service not configured. Email notifications will be disabled.');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: string;
    path?: string;
    encoding?: string;
    contentType?: string;
  }>;
}

/**
 * Send an email using nodemailer
 */
export async function sendEmail({ to, subject, html, text, attachments }: EmailOptions) {
  // If email service is not configured, log and return early
  if (!transporter) {
    console.warn('Email service not configured. Cannot send email to:', to);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Sheisa Billing" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html,
      attachments: attachments || [],
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

function getEmailStyles() {
  return `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 32px; }
        .header h1 { color: #000; font-size: 28px; margin: 0; }
        .button { display: inline-block; padding: 12px 32px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 24px 0; }
        .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    `;
}

/**
 * Send verification OTP email
 */
export async function sendVerificationOTP(email: string, otp: string, userName?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          ${getEmailStyles()}
          .otp-box { background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #37322F; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; font-weight: bold; color: #37322F; margin-bottom: 10px;">Sheisa Billing</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Verify Your Email</h1>
          </div>
          
          <p>Hi ${userName || 'there'},</p>
          
          <p>Thanks for signing up for Sheisa Billing! Please use the verification code below to complete your registration:</p>
          
          <div class="otp-box">
            <p class="otp-code">${otp}</p>
          </div>
          
          <p>This code will expire in 15 minutes.</p>
          
          <p>If you didn't create an account with Sheisa Billing, you can safely ignore this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sheisa Billing. All rights reserved.</p>
            <p>Design, automate, and share templates effortlessly.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Hi ${userName || 'there'},
    
    Thanks for signing up for Sheisa Billing! Your verification code is:
    
    ${otp}
    
    This code will expire in 15 minutes.
    
    If you didn't create an account with Sheisa Billing, you can safely ignore this email.
    
    © ${new Date().getFullYear()} Sheisa Billing
  `;

  return sendEmail({
    to: email,
    subject: `Your Sheisa Billing verification code: ${otp}`,
    html,
    text,
  });
}

/**
 * Send password reset OTP email
 */
export async function sendPasswordResetOTP(email: string, otp: string, userName?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          ${getEmailStyles()}
          .otp-box { background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #37322F; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; font-weight: bold; color: #37322F; margin-bottom: 10px;">Sheisa Billing</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Reset Your Password</h1>
          </div>
          
          <p>Hi ${userName || 'there'},</p>
          
          <p>We received a request to reset your password. Please use the code below to continue:</p>
          
          <div class="otp-box">
            <p class="otp-code">${otp}</p>
          </div>
          
          <p>This code will expire in 15 minutes.</p>
          
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sheisa Billing. All rights reserved.</p>
            <p>Design, automate, and share templates effortlessly.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Hi ${userName || 'there'},
    
    We received a request to reset your password. Your reset code is:
    
    ${otp}
    
    This code will expire in 15 minutes.
    
    If you didn't request a password reset, you can safely ignore this email.
    
    © ${new Date().getFullYear()} Sheisa Billing
  `;

  return sendEmail({
    to: email,
    subject: `Your Sheisa Billing password reset code: ${otp}`,
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string, userName?: string) {
  const resetUrl = `${process.env.AUTH_URL}/auth/reset-password/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          ${getEmailStyles()}
          .warning { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; font-weight: bold; color: #37322F; margin-bottom: 10px;">Sheisa Billing</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Reset Your Password</h1>
          </div>
          
          <p>Hi ${userName || 'there'},</p>
          
          <p>We received a request to reset your password for your Sheisa Billing account. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button" style="color: #ffffff;">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #37322F; word-break: break-all;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sheisa Billing. All rights reserved.</p>
            <p>Design, automate, and share templates effortlessly.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Hi ${userName || 'there'},
    
    We received a request to reset your password for your Sheisa Billing account. Click the link below to create a new password:
    
    ${resetUrl}
    
    This password reset link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    
    © ${new Date().getFullYear()} Sheisa Billing
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your Sheisa Billing password',
    html,
    text,
  });
}

/**
 * Send template invitation email with secure token
 */
export async function sendTemplateInvitation({
  email,
  templateName,
  inviteLink,
}: {
  email: string;
  templateName: string;
  inviteLink: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          ${getEmailStyles()}
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="color: #333; margin-bottom: 16px;">You've been invited to fill a template</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You've been invited to fill the template: <strong style="color: #000;">${templateName}</strong>
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Click the button below to get started:
          </p>
          <div style="margin: 32px 0;">
            <a href="${inviteLink}" class="button">Fill Template</a>
          </div>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-top: 24px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              🔒 <strong>Security note:</strong> This link is unique to you and can only be used once. It will expire after the template is filled.
            </p>
          </div>
          <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>© ${new Date().getFullYear()} Sheisa Billing</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
You've been invited to fill a template

Template: ${templateName}

Click the link below to get started:
${inviteLink}

Security note: This link is unique to you and can only be used once. It will expire after the template is filled.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Sheisa Billing
  `;

  return sendEmail({
    to: email,
    subject: `You've been invited to fill: ${templateName}`,
    html,
    text,
  });
}

/**
 * Send form invitation email with secure token
 */
export async function sendFormInvitation({
  email,
  formTitle,
  inviteLink,
}: {
  email: string;
  formTitle: string;
  inviteLink: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          ${getEmailStyles()}
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="color: #333; margin-bottom: 16px;">You've been invited to complete a form</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You've been invited to complete the form: <strong style="color: #000;">${formTitle}</strong>
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Click the button below to start:
          </p>
          <div style="margin: 32px 0;">
            <a href="${inviteLink}" class="button">Start Form</a>
          </div>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-top: 24px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              🔒 <strong>Security note:</strong> this link allows access to complete the form.
            </p>
          </div>
          <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>© ${new Date().getFullYear()} Sheisa Billing</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
You've been invited to complete a form

Form: ${formTitle}

Click the link below to start:
${inviteLink}

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Sheisa Billing
  `;

  return sendEmail({
    to: email,
    subject: `You've been invited to complete: ${formTitle}`,
    html,
    text,
  });
}

/**
 * Send document completion email with attachment
 */
export async function sendDocumentCompletionEmail(
  email: string,
  userName: string,
  templateName: string,
  documentUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${getEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 24px;">Document Ready</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Your document <strong>"${templateName}"</strong> has been successfully generated.</p>
          <p>We've attached the completed document to this email for your convenience.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${documentUrl}" class="button" style="color: #ffffff;">Download Document</a>
          </div>
          
          <p>Thank you for using Sheisa Billing!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sheisa Billing. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${userName},

    Your document "${templateName}" has been successfully generated.
    
    We've attached the completed document to this email.
    
    You can also download it here: ${documentUrl}

    © ${new Date().getFullYear()} Sheisa Billing
  `;

  // Determine filename from URL
  const filename = documentUrl.split('/').pop()?.split('?')[0] || 'document.pdf';

  return sendEmail({
    to: email,
    subject: `Your completed document: ${templateName}`,
    html,
    text,
  });
}


export async function sendApprovalEmail(to: string, entityName: string, subdomain: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Construct subdomain URL
  let loginUrl = baseUrl;
  try {
    const url = new URL(baseUrl);
    const host = url.host;
    const protocol = url.protocol;

    // Check if it's localhost or production domain
    if (host.includes('localhost')) {
      loginUrl = `${protocol}//${subdomain}.${host}`;
    } else {
      // Assuming standard subdomain structure: subdomain.domain.com
      // If base is app.domain.com, we want subdomain.domain.com ?? 
      // Or if base is domain.com, we want subdomain.domain.com

      // Handle cases where base might have 'www' or 'app'
      const parts = host.split('.');
      if (parts.length > 2) {
        // e.g. app.domain.com -> replace app with subdomain
        parts[0] = subdomain;
        loginUrl = `${protocol}//${parts.join('.')}`;
      } else {
        // e.g. domain.com -> subdomain.domain.com
        loginUrl = `${protocol}//${subdomain}.${host}`;
      }
    }
  } catch (e) {
    console.error('Error constructing subdomain URL', e);
    // Fallback
    loginUrl = `${baseUrl}/sites/${subdomain}/login`;
  }

  // Append /login to ensuring they land on login page
  // Wait, the tenant root might redirect to login, but let's be explicit if needed.
  // Actually, tenant root is the dashboard/login.
  // Let's just point to the root of the subdomain

  return sendEmail({
    to,
    subject: 'Your Registration for SHIESA Billing has been Approved',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${getEmailStyles()}
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Registration Approved</h1>
            <p>Hello,</p>
            <p>Your registration request for <strong>${entityName}</strong> has been approved.</p>
            <p>Your dedicated portal is now ready.</p>
            <p>You can log in to your account using the email and password you provided during registration.</p>
            <p style="text-align: center;"><a href="${loginUrl}" class="button">Access Your Portal</a></p>
            <p style="text-align: center; font-size: 12px; color: #666;">Portal URL: <a href="${loginUrl}">${loginUrl}</a></p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Sheisa Billing. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendDeclineEmail(to: string, entityName: string, reason?: string) {
  return sendEmail({
    to,
    subject: 'Update on your SHIESA Billing Registration',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${getEmailStyles()}
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Registration Application Update</h1>
            <p>Hello,</p>
            <p>Your registration request for <strong>${entityName}</strong> has been reviewed.</p>
            <p>Unfortunately, we are unable to approve your application at this time.</p>
            ${reason ? `<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0;"><p style="margin: 0; color: #856404;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
            <p>If you believe this is an error, please contact support.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Sheisa Billing. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
