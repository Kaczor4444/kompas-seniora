import { prisma } from '@/lib/prisma';
import HomeClient from '@/src/components/HomeClient';

// 🔄 Revalidate every hour to keep data fresh
export const revalidate = 3600;

export default async function Home() {
  // 📊 Fetch real-time facility count from database
  const totalFacilities = await prisma.placowka.count();

  return <HomeClient totalFacilities={totalFacilities} />;
}
