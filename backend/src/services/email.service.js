// =============================================
// backend/src/services/email.service.js
// =============================================
// Email Service - Nodemailer Setup
//
// WHAT IS NODEMAILER?
// Nodemailer is a Node.js module that allows you to send emails.
// It supports SMTP (the standard protocol for sending email).
//
// WHY A SEPARATE SERVICE FILE?
// Keeping email logic separate from controllers means:
// - Controllers stay clean and focused
// - Email logic is reusable across multiple controllers
// - Easy to switch email providers without changing business logic
// =============================================

const nodemailer = require('nodemailer');

// Create the email transporter (the "email client" configuration)
// Think of this as configuring an email app with your account settings
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    // secure: true means use SSL (port 465)
    // secure: false means use TLS (port 587) - for development with Mailtrap
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html - HTML content of the email body
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Support System" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Don't throw the error - email failure shouldn't crash the app
    // Just log it and continue
    console.error('❌ Email failed to send:', error.message);
    return { success: false, error: error.message };
  }
};

// =============================================
// EMAIL TEMPLATES
// Pre-built email HTML for different events
// =============================================

/**
 * Template: Welcome email for new users
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7c3aed, #3b82f6); padding: 30px; border-radius: 12px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎫 Support Ticket System</h1>
        <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Welcome aboard!</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-top: 20px;">
        <h2 style="color: #1e293b;">Hello, ${user.name}! 👋</h2>
        <p style="color: #64748b; line-height: 1.6;">
          Your account has been successfully created. You can now:
        </p>
        <ul style="color: #64748b; line-height: 2;">
          <li>Create support tickets for any issues</li>
          <li>Track the status of your tickets</li>
          <li>Communicate with our support team</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/login" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; 
                  border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: bold;">
          Go to Dashboard →
        </a>
      </div>
      
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
        This email was sent from the Support Ticket System.
      </p>
    </div>
  `;

  return sendEmail(user.email, 'Welcome to Support Ticket System! 🎉', html);
};

/**
 * Template: Ticket created notification
 */
const sendTicketCreatedEmail = async (user, ticket) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #10b981; padding: 20px; border-radius: 12px; text-align: center;">
        <h2 style="color: white; margin: 0;">✅ Ticket Created Successfully</h2>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-top: 20px;">
        <p style="color: #475569;">Hi ${user.name},</p>
        <p style="color: #475569; line-height: 1.6;">
          Your support ticket has been created and our team will review it shortly.
        </p>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">${ticket.title}</h3>
          <p style="color: #64748b;">Priority: <strong>${ticket.priority.toUpperCase()}</strong></p>
          <p style="color: #64748b;">Status: <strong style="color: #10b981;">OPEN</strong></p>
        </div>
        
        <a href="${process.env.FRONTEND_URL}/tickets/${ticket.id}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; 
                  border-radius: 8px; text-decoration: none; font-weight: bold;">
          View Ticket →
        </a>
      </div>
    </div>
  `;

  return sendEmail(user.email, `Ticket Created: ${ticket.title}`, html);
};

/**
 * Template: Ticket status updated notification
 */
const sendTicketUpdatedEmail = async (user, ticket) => {
  const statusColors = {
    open: '#10b981',
    pending: '#f59e0b',
    closed: '#94a3b8',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${statusColors[ticket.status] || '#7c3aed'}; padding: 20px; border-radius: 12px; text-align: center;">
        <h2 style="color: white; margin: 0;">🔄 Ticket Status Updated</h2>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-top: 20px;">
        <p style="color: #475569;">Hi ${user.name},</p>
        <p style="color: #475569; line-height: 1.6;">
          Your ticket status has been updated.
        </p>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">${ticket.title}</h3>
          <p style="color: #64748b;">New Status: 
            <strong style="color: ${statusColors[ticket.status]};">${ticket.status.toUpperCase()}</strong>
          </p>
        </div>
        
        <a href="${process.env.FRONTEND_URL}/tickets/${ticket.id}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; 
                  border-radius: 8px; text-decoration: none; font-weight: bold;">
          View Ticket →
        </a>
      </div>
    </div>
  `;

  return sendEmail(user.email, `Ticket Updated: ${ticket.title}`, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTicketCreatedEmail,
  sendTicketUpdatedEmail,
};
