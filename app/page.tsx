import { prisma } from '@/lib/prisma';
import { getVoivodeshipFilter, getMainSearchFilter } from '@/lib/voivodeship-filter';
import { getFeaturedArticlesForHome } from '@/lib/articleHelpers';
import HomeClient from '@/src/components/HomeClient';

// 🔄 Revalidate every hour to keep data fresh
export const revalidate = 3600;

export default async function Home() {
  // 📊 Fetch real-time facility count, per-powiat breakdown, and featured articles
  // Wolne miejsca — najnowszy snapshot
  const latestWolneDate = await prisma.placowkaWolneMiejsca.findFirst({
    where: { placowka: { typ_placowki: 'DPS', wojewodztwo: 'małopolskie' } },
    orderBy: { data_stanu: 'desc' },
    select: { data_stanu: true },
  });
  const totalWolne = latestWolneDate ? await prisma.placowkaWolneMiejsca.aggregate({
    where: { placowka: { typ_placowki: 'DPS', wojewodztwo: 'małopolskie' }, data_stanu: latestWolneDate.data_stanu },
    _sum: { wolne_ogolem: true },
  }).then(r => r._sum.wolne_ogolem ?? 0) : 0;

  const [totalFacilities, allFacilities, featuredArticles] = await Promise.all([
    prisma.placowka.count({ where: getMainSearchFilter() }),
    prisma.placowka.findMany({
      where: getVoivodeshipFilter(),
      select: { powiat: true, miejscowosc: true, typ_placowki: true, wojewodztwo: true }
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

  const malopolska = allFacilities.filter(f => f.wojewodztwo === 'małopolskie');
  const slaskie    = allFacilities.filter(f => f.wojewodztwo === 'śląskie');

  const typeCounts = {
    DPS:        malopolska.filter(f => f.typ_placowki === 'DPS').length,
    SDS:        malopolska.filter(f => f.typ_placowki === 'ŚDS').length,
    KlubSenior: malopolska.filter(f => f.typ_placowki === 'Klub Senior+').length,
    DDSenior:   malopolska.filter(f => f.typ_placowki === 'Dzienny Dom Senior+').length,
    UTW:        malopolska.filter(f => f.typ_placowki === 'UTW').length,
  };

  const typeCountsSlaskie = {
    DPS:        slaskie.filter(f => f.typ_placowki === 'DPS').length,
    SDS:        0,
    KlubSenior: slaskie.filter(f => f.typ_placowki === 'Klub Senior+').length,
    DDSenior:   slaskie.filter(f => f.typ_placowki === 'Dzienny Dom Senior+').length,
    UTW:        0,
  };

  const powiatCountsByType: Record<'DPS' | 'KlubSenior' | 'DDSenior', Record<string, number>> = {
    DPS: {}, KlubSenior: {}, DDSenior: {}
  };
  for (const f of malopolska) {
    if (!f.powiat) continue;
    if (f.typ_placowki === 'DPS') powiatCountsByType.DPS[f.powiat] = (powiatCountsByType.DPS[f.powiat] || 0) + 1;
    else if (f.typ_placowki === 'Klub Senior+') powiatCountsByType.KlubSenior[f.powiat] = (powiatCountsByType.KlubSenior[f.powiat] || 0) + 1;
    else if (f.typ_placowki === 'Dzienny Dom Senior+') powiatCountsByType.DDSenior[f.powiat] = (powiatCountsByType.DDSenior[f.powiat] || 0) + 1;
  }

  const powiatCountsByTypeSlaskie: Record<'DPS' | 'KlubSenior' | 'DDSenior', Record<string, number>> = {
    DPS: {}, KlubSenior: {}, DDSenior: {}
  };
  for (const f of slaskie) {
    if (!f.powiat) continue;
    if (f.typ_placowki === 'DPS') powiatCountsByTypeSlaskie.DPS[f.powiat] = (powiatCountsByTypeSlaskie.DPS[f.powiat] || 0) + 1;
    else if (f.typ_placowki === 'Klub Senior+') powiatCountsByTypeSlaskie.KlubSenior[f.powiat] = (powiatCountsByTypeSlaskie.KlubSenior[f.powiat] || 0) + 1;
    else if (f.typ_placowki === 'Dzienny Dom Senior+') powiatCountsByTypeSlaskie.DDSenior[f.powiat] = (powiatCountsByTypeSlaskie.DDSenior[f.powiat] || 0) + 1;
  }

  return (
    <HomeClient
      totalFacilities={totalFacilities}
      totalWolne={totalWolne}
      wolneMonth={latestWolneDate ? latestWolneDate.data_stanu.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }) : undefined}
      powiatCounts={powiatCounts}
      featuredArticles={featuredArticles}
      typeCounts={typeCounts}
      typeCountsSlaskie={typeCountsSlaskie}
      powiatCountsByType={powiatCountsByType}
      powiatCountsByTypeSlaskie={powiatCountsByTypeSlaskie}
    />
  );
}
