const nodemailer = require('nodemailer');

// Set this to true to skip email sending (for testing)
const SKIP_EMAILS = process.env.SKIP_EMAILS === 'true';

// Create transporter configuration
const createTransporter = () => {
  // Skip emails if configured
  if (SKIP_EMAILS) {
    console.log('Email sending is disabled (SKIP_EMAILS=true)');
    return null;
  }

  // Check if email credentials are configured
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!emailUser || !emailPassword) {
    console.warn('Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables.');
    return null;
  }

  try {
    return nodemailer.createTransport({
      service: 'gmail', // You can change this to your preferred email service
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
};

// Email templates
const emailTemplates = {
  companyRegistrationNotification: (companyData) => ({
    subject: 'New Company Registration Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Company Registration Request</h2>
        <p>A new company has submitted a registration request that requires your approval.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Company Details:</h3>
          <p><strong>Company Name:</strong> ${companyData.companyName}</p>
          <p><strong>Contact Person:</strong> ${companyData.fullname}</p>
          <p><strong>Email:</strong> ${companyData.email}</p>
          <p><strong>Phone:</strong> ${companyData.phone}</p>
          <p><strong>Sector:</strong> ${companyData.sector}</p>
          <p><strong>Address:</strong> ${companyData.address}</p>
          <p><strong>Governorate:</strong> ${companyData.governorate}</p>
          <p><strong>Job Title:</strong> ${companyData.jobTitle}</p>
        </div>
        
        <p>Please log into your admin dashboard to review and approve this request.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            This is an automated notification from Connect Jobs platform.
          </p>
        </div>
      </div>
    `
  }),

  companyApprovalNotification: (companyData, secretCode) => ({
    subject: 'Company Registration Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Company Registration Approved</h2>
        <p>Congratulations! Your company registration has been approved.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="color: #166534; margin-top: 0;">Your Secret Code:</h3>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; text-align: center; margin: 10px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #059669; letter-spacing: 2px;">${secretCode}</span>
          </div>
          <p style="color: #166534; font-weight: bold;">Please keep this code safe. You will need it to log into your account.</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Next Steps:</h3>
          <ol style="color: #475569;">
            <li>Go to the login page</li>
            <li>Enter your email address</li>
            <li>Enter the secret code provided above</li>
            <li>Start posting jobs and finding employees!</li>
          </ol>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `
  }),

  companyRejectionNotification: (companyData, reason) => ({
    subject: 'Company Registration Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Company Registration Update</h2>
        <p>We regret to inform you that your company registration request could not be approved at this time.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #991b1b; margin-top: 0;">Reason:</h3>
          <p style="color: #7f1d1d;">${reason || 'Your application did not meet our current requirements.'}</p>
        </div>
        
        <p>You may submit a new application with updated information at any time.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `
  })
};

// Email service functions
const emailService = {
  // Send company registration notification to admin
  async sendCompanyRegistrationNotification(companyData, adminEmail) {
    try {
      const transporter = createTransporter();
      
      if (!transporter) {
        console.warn('Email transporter not available. Skipping email notification.');
        return { success: false, error: 'Email transporter not configured' };
      }

      const template = emailTemplates.companyRegistrationNotification(companyData);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Company registration notification sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending company registration notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send approval notification to company
  async sendCompanyApprovalNotification(companyData, secretCode) {
    try {
      const transporter = createTransporter();
      
      if (!transporter) {
        console.warn('Email transporter not available. Skipping email notification.');
        return { success: false, error: 'Email transporter not configured' };
      }

      const template = emailTemplates.companyApprovalNotification(companyData, secretCode);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: companyData.email,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Company approval notification sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending company approval notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send rejection notification to company
  async sendCompanyRejectionNotification(companyData, reason) {
    try {
      const transporter = createTransporter();
      
      if (!transporter) {
        console.warn('Email transporter not available. Skipping email notification.');
        return { success: false, error: 'Email transporter not configured' };
      }

      const template = emailTemplates.companyRejectionNotification(companyData, reason);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: companyData.email,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Company rejection notification sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending company rejection notification:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService; 