import { Resend } from "resend";
import { getAdminEmailTemplate, getUserEmailTemplate } from "./partner-inquiry-templates";

// Lazy init - only when actually sending emails
let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

interface PartnerEmailData {
  name: string;
  email: string;
  organization: string;
  partnerType: string;
  phone?: string;
  message: string;
}

export async function sendPartnerInquiryEmails(data: PartnerEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.error("ADMIN_EMAIL not configured");
    throw new Error("Email configuration error");
  }

  const submittedAt = new Date().toLocaleString("pl-PL", {
    dateStyle: "long",
    timeStyle: "short"
  });

  const results = {
    adminEmailSent: false,
    userEmailSent: false,
    errors: [] as string[]
  };

  // Send admin notification
  try {
    await getResendClient().emails.send({
      from: "Kompas Seniora <onboarding@resend.dev>",
      to: adminEmail,
      replyTo: data.email,
      subject: `🤝 Nowe zapytanie partnera: ${data.organization}`,
      html: getAdminEmailTemplate({ ...data, submittedAt })
    });
    results.adminEmailSent = true;
    console.log("✅ Admin email sent successfully");
  } catch (error) {
    console.error("❌ Failed to send admin email:", error);
    results.errors.push("Admin email failed");
  }

  // Send user confirmation
  try {
    await getResendClient().emails.send({
      from: "Kompas Seniora <onboarding@resend.dev>",
      to: data.email,
      subject: "Dziękujemy za zgłoszenie współpracy - Kompas Seniora",
      html: getUserEmailTemplate({ name: data.name })
    });
    results.userEmailSent = true;
    console.log("✅ User confirmation email sent successfully");
  } catch (error) {
    console.error("❌ Failed to send user email:", error);
    results.errors.push("User email failed");
  }

  return results;
}