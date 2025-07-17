import sgMail from '@sendgrid/mail';

const FROM_EMAIL = 'jubair@mds.com.bd';
const FROM_NAME = 'Lovable Ex';

function initializeSendGrid() {
  const SENDGRID_KEY = process.env.SENDGRID_KEY;
  if (!SENDGRID_KEY) {
    throw new Error('SENDGRID_KEY is not set in environment variables');
  }
  sgMail.setApiKey(SENDGRID_KEY);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  initializeSendGrid();
  
  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  };
  
  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

export interface HireExpertRequest {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
}

export interface RegisterExpertRequest {
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: string;
  portfolio?: string;
  hourlyRate?: string;
  bio: string;
}

export async function sendHireExpertEmail(request: HireExpertRequest) {
  const { name, email, company, projectType, budget, timeline, message } = request;
  
  // Email to the agency
  const agencySubject = 'New Expert Hire Request - Lovable Ex';
  const agencyHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">New Expert Hire Request</h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Client Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
      </div>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Project Details</h3>
        <p><strong>Project Type:</strong> ${projectType}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <p><strong>Timeline:</strong> ${timeline}</p>
      </div>
      
      <div style="background-color: #fefce8; padding: 20px; border-radius: 8px;">
        <h3 style="color: #374151; margin-top: 0;">Message</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        This request was submitted through the Lovable Extension Expert Hub.
      </p>
    </div>
  `;
  
  // Confirmation email to the client
  const clientSubject = 'Expert Hire Request Received - Lovable Ex';
  const clientHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">Thank You for Your Interest!</h2>
      
      <p>Dear ${name},</p>
      
      <p>We have received your request to hire an expert for your project. Our team will review your requirements and get back to you within 24 hours with suitable expert recommendations.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Your Request Summary</h3>
        <p><strong>Project Type:</strong> ${projectType}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <p><strong>Timeline:</strong> ${timeline}</p>
      </div>
      
      <p>If you have any immediate questions or need to update your requirements, please reply to this email or contact us directly.</p>
      
      <p>Best regards,<br>
      The Lovable Ex Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        This is an automated confirmation email. Please do not reply to this email.
      </p>
    </div>
  `;
  
  // Send both emails
  await Promise.all([
    sendEmail({
      to: 'jubair@mds.com.bd',
      subject: agencySubject,
      html: agencyHtml,
      replyTo: email
    }),
    sendEmail({
      to: email,
      subject: clientSubject,
      html: clientHtml
    })
  ]);
}

export async function sendRegisterExpertEmail(request: RegisterExpertRequest) {
  const { name, email, phone, skills, experience, portfolio, hourlyRate, bio } = request;
  
  // Email to the agency
  const agencySubject = 'New Expert Registration - Lovable Ex';
  const agencyHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">New Expert Registration</h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Personal Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${portfolio ? `<p><strong>Portfolio:</strong> <a href="${portfolio}" target="_blank">${portfolio}</a></p>` : ''}
      </div>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Professional Details</h3>
        <p><strong>Experience:</strong> ${experience}</p>
        ${hourlyRate ? `<p><strong>Hourly Rate:</strong> ${hourlyRate}</p>` : ''}
        <p><strong>Skills:</strong> ${skills.join(', ')}</p>
      </div>
      
      <div style="background-color: #fefce8; padding: 20px; border-radius: 8px;">
        <h3 style="color: #374151; margin-top: 0;">Bio</h3>
        <p style="white-space: pre-wrap;">${bio}</p>
      </div>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        This registration was submitted through the Lovable Extension Expert Hub.
      </p>
    </div>
  `;
  
  // Confirmation email to the expert
  const expertSubject = 'Expert Registration Received - Lovable Ex';
  const expertHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">Welcome to Lovable Ex!</h2>
      
      <p>Dear ${name},</p>
      
      <p>Thank you for your interest in becoming an expert with Lovable Ex. We have received your registration and our team will review your profile.</p>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">What's Next?</h3>
        <ul>
          <li>Our team will review your profile and skills</li>
          <li>We may reach out for a brief interview or portfolio review</li>
          <li>Once approved, you'll be added to our expert network</li>
          <li>You'll start receiving project opportunities that match your skills</li>
        </ul>
      </div>
      
      <p>We typically respond to expert applications within 2-3 business days. If you have any questions about the process, please feel free to reach out.</p>
      
      <p>Best regards,<br>
      The Lovable Ex Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        This is an automated confirmation email. Please do not reply to this email.
      </p>
    </div>
  `;
  
  // Send both emails
  await Promise.all([
    sendEmail({
      to: 'jubair@mds.com.bd',
      subject: agencySubject,
      html: agencyHtml,
      replyTo: email
    }),
    sendEmail({
      to: email,
      subject: expertSubject,
      html: expertHtml
    })
  ]);
} 