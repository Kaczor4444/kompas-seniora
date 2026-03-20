import { prisma } from '@/lib/prisma';
import { getVoivodeshipFilter } from '@/lib/voivodeship-filter';
import { getFeaturedArticlesForHome } from '@/lib/articleHelpers';
import HomeClient from '@/src/components/HomeClient';

// 🔄 Revalidate every hour to keep data fresh
export const revalidate = 3600;

export default async function Home() {
  // 📊 Fetch real-time facility count, per-powiat breakdown, and featured articles
  const [totalFacilities, allFacilities, featuredArticles] = await Promise.all([
    prisma.placowka.count({
      where: getVoivodeshipFilter()
    }),
    prisma.placowka.findMany({
      where: getVoivodeshipFilter(),
      select: { powiat: true, miejscowosc: true }
    }),
    getFeaturedArticlesForHome(),
  ]);

  const powiatCounts: Record<string, number> = {};

  // Count facilities per powiat
  for (const facility of allFacilities) {
    if (!facility.powiat) continue;
    powiatCounts[facility.powiat] = (powiatCounts[facility.powiat] || 0) + 1;
  }

  // ✅ Miasta na prawach powiatu - dodaj osobne liczniki dla miast
  // Kraków (miasto) - tylko placówki w mieście Kraków
  const krakowCity = allFacilities.filter(f =>
    f.powiat?.toLowerCase().includes('krakow') &&
    f.miejscowosc === 'Kraków'
  ).length;
  if (krakowCity > 0) {
    powiatCounts['Kraków'] = krakowCity;
  }

  // Nowy Sącz (miasto) - tylko placówki w mieście Nowy Sącz
  // ⚠️ UWAGA: W bazie są DWA powiaty: "m. Nowy Sącz" i "nowosądecki"
  // Liczymy placówki z OBOK powiatów gdzie miejscowosc="Nowy Sącz"
  const nowySaczCity = allFacilities.filter(f =>
    f.miejscowosc === 'Nowy Sącz'
  ).length;
  if (nowySaczCity > 0) {
    powiatCounts['Nowy Sącz'] = nowySaczCity;
  }

  // Tarnów (miasto) - tylko placówki w mieście Tarnów
  // ⚠️ UWAGA: W bazie są DWA powiaty: "m. Tarnów" i "tarnowski"
  // Liczymy placówki z OBOK powiatów gdzie miejscowosc="Tarnów"
  const tarnowCity = allFacilities.filter(f =>
    f.miejscowosc === 'Tarnów'
  ).length;
  if (tarnowCity > 0) {
    powiatCounts['Tarnów'] = tarnowCity;
  }

  return <HomeClient totalFacilities={totalFacilities} powiatCounts={powiatCounts} featuredArticles={featuredArticles} />;
}
