import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { partnerInquirySchema } from "@/lib/validations/partner";
import { checkPartnerInquiryRateLimit } from "@/lib/rate-limit/partner-inquiry";
import { sendPartnerInquiryEmails } from "@/lib/email/send-partner-emails";
import { isValidAdminCookie } from "@/lib/adminAuth";
import { checkRedisRateLimit } from "@/lib/redis";
import { z } from "zod";

// POST - Submit partnership inquiry
export async function POST(req: NextRequest) {
  // IP-based rate limit: 10 submissions per hour (email-based limit is bypassable with new emails)
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    'unknown';
  const ipLimit = await checkRedisRateLimit(ip, 10, 3600, 'wspolpraca');
  if (!ipLimit.allowed) {
    return Response.json(
      { success: false, message: 'Osiągnięto limit zgłoszeń. Spróbuj ponownie za godzinę.' },
      { status: 429 }
    );
  }

  try {
    // 1. Parse and validate request body
    const body = await req.json();
    const validatedData = partnerInquirySchema.parse(body);

    // 2. Check rate limit per email
    const rateLimit = await checkPartnerInquiryRateLimit(validatedData.email);
    
    if (!rateLimit.allowed) {
      return Response.json(
        {
          success: false,
          message: `Osiągnięto limit zgłoszeń. Spróbuj ponownie jutro.`,
          resetAt: rateLimit.resetAt.toISOString()
        },
        { status: 429 }
      );
    }

    // 3. Save to database
    const inquiry = await prisma.partnerInquiry.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        organization: validatedData.organization,
        partnerType: validatedData.partnerType,
        phone: validatedData.phone || null,
        message: validatedData.message,
        gdprConsent: validatedData.gdprConsent
      }
    });

    console.log("✅ Partner inquiry created:", inquiry.id);

    // 4. Send emails (non-blocking errors)
    const emailResults = await sendPartnerInquiryEmails({
      name: validatedData.name,
      email: validatedData.email,
      organization: validatedData.organization,
      partnerType: validatedData.partnerType,
      phone: validatedData.phone || undefined,
      message: validatedData.message
    });

    // 5. Log email issues but don't fail the request
    if (emailResults.errors.length > 0) {
      console.warn("⚠️ Email issues:", emailResults.errors);
    }

    // 6. Success response
    return Response.json(
      {
        success: true,
        message: "Dziękujemy za zgłoszenie! Skontaktujemy się wkrótce.",
        data: {
          id: inquiry.id,
          emailStatus: {
            adminSent: emailResults.adminEmailSent,
            userSent: emailResults.userEmailSent
          }
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Partnership inquiry error:", error);

    // Validation error
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          message: "Nieprawidłowe dane formularza",
          errors: error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    // Database error
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return Response.json(
        {
          success: false,
          message: "Wystąpił problem z zapisem danych. Spróbuj ponownie."
        },
        { status: 409 }
      );
    }

    // Generic error (don't expose internals!)
    return Response.json(
      {
        success: false,
        message: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
      },
      { status: 500 }
    );
  }
}

// GET - List inquiries (Admin only)
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidAdminCookie(cookieStore.get('admin-auth')?.value)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const rawLimit  = parseInt(searchParams.get("limit")  || "50");
    const rawOffset = parseInt(searchParams.get("offset") || "0");
    const limit  = Math.min(200, Math.max(1,  isNaN(rawLimit)  ? 50 : rawLimit));
    const offset = Math.min(100000, Math.max(0, isNaN(rawOffset) ? 0  : rawOffset));

    const where = status ? { status } : {};

    const [inquiries, total] = await Promise.all([
      prisma.partnerInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.partnerInquiry.count({ where })
    ]);

    return Response.json({
      success: true,
      data: inquiries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error("❌ GET inquiries error:", error);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
