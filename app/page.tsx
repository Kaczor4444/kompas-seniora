import { prisma } from '@/lib/prisma';
import HomeClient from '@/src/components/HomeClient';

// 🔄 Revalidate every hour to keep data fresh
export const revalidate = 3600;

export default async function Home() {
  // 📊 Fetch real-time facility count and per-powiat breakdown
  const [totalFacilities, powiatGroups] = await Promise.all([
    prisma.placowka.count(),
    prisma.placowka.groupBy({ by: ['powiat'], _count: { _all: true } }),
  ]);

  const powiatCounts: Record<string, number> = {};
  for (const group of powiatGroups) {
    if (group.powiat) powiatCounts[group.powiat] = group._count._all;
  }

  return <HomeClient totalFacilities={totalFacilities} powiatCounts={powiatCounts} />;
}
