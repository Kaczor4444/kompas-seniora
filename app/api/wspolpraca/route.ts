import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { partnerInquirySchema } from "@/lib/validations/partner";
import { checkPartnerInquiryRateLimit } from "@/lib/rate-limit/partner-inquiry";
import { sendPartnerInquiryEmails } from "@/lib/email/send-partner-emails";
import { z } from "zod";

// POST - Submit partnership inquiry
export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await req.json();
    const validatedData = partnerInquirySchema.parse(body);

    // 2. Check rate limit
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
          errors: error.errors.map(e => ({
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

// GET - List inquiries (Admin only - TODO: add auth)
export async function GET(req: NextRequest) {
  try {
    // TODO: Add admin auth check here
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        { success: false, message: "Not implemented yet" },
        { status: 501 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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
