import { prisma } from '@/lib/prisma';

type SecurityEventType = 
  | 'login_success' 
  | 'login_failed' 
  | 'rate_limit' 
  | 'logout';

interface LogSecurityEventParams {
  eventType: SecurityEventType;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function logSecurityEvent({
  eventType,
  ipAddress,
  userAgent,
  metadata,
}: LogSecurityEventParams) {
  try {
    await prisma.adminSecurityLog.create({
      data: {
        eventType,
        ipAddress,
        userAgent,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging shouldn't break the app
  }
}

// Rate limiting: check failed attempts in last 15 minutes
export async function checkRateLimit(ipAddress: string): Promise<{
  isBlocked: boolean;
  attempts: number;
}> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  const failedAttempts = await prisma.adminSecurityLog.count({
    where: {
      ipAddress,
      eventType: 'login_failed',
      timestamp: {
        gte: fifteenMinutesAgo,
      },
    },
  });

  return {
    isBlocked: failedAttempts >= 5,
    attempts: failedAttempts,
  };
}