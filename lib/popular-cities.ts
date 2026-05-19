import { getFacilityStats, type CityStats } from './facility-stats';

export const POPULAR_CITIES_CONFIG = [
  // Małopolskie
  { name: 'Kraków', slug: 'krakow', voivodeship: 'małopolskie' },
  { name: 'Tarnów', slug: 'tarnow', voivodeship: 'małopolskie' },
  { name: 'Wieliczka', slug: 'wieliczka', voivodeship: 'małopolskie' },
  { name: 'Wadowice', slug: 'wadowice', voivodeship: 'małopolskie' },
  { name: 'Nowy Sącz', slug: 'nowy+sacz', voivodeship: 'małopolskie' },
  { name: 'Gorlice', slug: 'gorlice', voivodeship: 'małopolskie' },
  // Śląskie
  { name: 'Katowice', slug: 'katowice', voivodeship: 'śląskie' },
  { name: 'Zabrze', slug: 'zabrze', voivodeship: 'śląskie' },
  { name: 'Gliwice', slug: 'gliwice', voivodeship: 'śląskie' },
  { name: 'Bytom', slug: 'bytom', voivodeship: 'śląskie' },
  { name: 'Częstochowa', slug: 'czestochowa', voivodeship: 'śląskie' },
  { name: 'Cieszyn', slug: 'cieszyn', voivodeship: 'śląskie' },
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
