import { getFacilityStats, type CityStats } from './facility-stats';

export const POPULAR_CITIES_CONFIG = [
  // Małopolskie — city=true (szukaj tylko w tym mieście)
  { name: 'Kraków',    slug: 'krakow',    voivodeship: 'małopolskie', lat: null, lng: null },
  { name: 'Tarnów',   slug: 'tarnow',    voivodeship: 'małopolskie', lat: null, lng: null },
  { name: 'Wieliczka', slug: 'wieliczka', voivodeship: 'małopolskie', lat: null, lng: null },
  { name: 'Wadowice',  slug: 'wadowice',  voivodeship: 'małopolskie', lat: null, lng: null },
  { name: 'Nowy Sącz', slug: 'nowy+sacz', voivodeship: 'małopolskie', lat: null, lng: null },
  { name: 'Gorlice',   slug: 'gorlice',   voivodeship: 'małopolskie', lat: null, lng: null },
  // Śląskie — near=true z koordynatami (szukaj wszystkich woj. śląskiego w okolicy)
  { name: 'Katowice',    slug: 'katowice',    voivodeship: 'śląskie', lat: 50.2599, lng: 19.0216 },
  { name: 'Zabrze',      slug: 'zabrze',      voivodeship: 'śląskie', lat: 50.3248, lng: 18.7857 },
  { name: 'Gliwice',     slug: 'gliwice',     voivodeship: 'śląskie', lat: 50.2945, lng: 18.6714 },
  { name: 'Bytom',       slug: 'bytom',       voivodeship: 'śląskie', lat: 50.3484, lng: 18.9162 },
  { name: 'Częstochowa', slug: 'czestochowa', voivodeship: 'śląskie', lat: 50.8118, lng: 19.1203 },
  { name: 'Cieszyn',     slug: 'cieszyn',     voivodeship: 'śląskie', lat: 49.7503, lng: 18.6349 },
] as const;

export type PopularCity = CityStats;

export async function getPopularCities(): Promise<PopularCity[]> {
  try {
    const stats = await getFacilityStats();

    const popularCities = POPULAR_CITIES_CONFIG.map(config => {
      const cityStats = stats.topCities.find(
        city => city.name.toLowerCase() === config.name.toLowerCase()
      );

      return {
        name: config.name,
        slug: config.slug,
        count: cityStats?.count || 0,
        voivodeship: config.voivodeship,
      };
    });

    return popularCities.sort((a, b) => b.count - a.count);

  } catch (error) {
    console.error('Error fetching popular cities:', error);

    return POPULAR_CITIES_CONFIG.map(config => ({
      name: config.name,
      slug: config.slug,
      count: 0,
      voivodeship: config.voivodeship,
    }));
  }
}

export async function getTotalFacilities(): Promise<number> {
  try {
    const stats = await getFacilityStats();
    return stats.total;
  } catch (error) {
    console.error('Error fetching total facilities:', error);
    return 0;
  }
}

export async function getVoivodeshipFacilities(voivodeship: string): Promise<number> {
  try {
    const stats = await getFacilityStats();
    return stats.byVoivodeship[voivodeship.toLowerCase()] || 0;
  } catch (error) {
    console.error(`Error fetching facilities for ${voivodeship}:`, error);
    return 0;
  }
}

export type City = PopularCity;
