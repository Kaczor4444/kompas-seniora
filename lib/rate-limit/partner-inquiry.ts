import { prisma } from "@/lib/prisma";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkPartnerInquiryRateLimit(
  email: string
): Promise<RateLimitResult> {
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  const maxRequests = 5;
  
  const windowStart = new Date(Date.now() - windowMs);
  
  const count = await prisma.partnerInquiry.count({
    where: {
      email: email.toLowerCase(),
      createdAt: { gte: windowStart }
    }
  });
  
  const allowed = count < maxRequests;
  const remaining = Math.max(0, maxRequests - count);
  const resetAt = new Date(Date.now() + windowMs);
  
  return { allowed, remaining, resetAt };
}
