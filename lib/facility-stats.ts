import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CityStats {
  name: string;
  slug: string;
  count: number;
  voivodeship: string;
}

export interface FacilityStats {
  total: number;
  byVoivodeship: Record<string, number>;
  topCities: CityStats[];
}

export async function getFacilityStats(): Promise<FacilityStats> {
  try {
    const byVoivodeship = await prisma.placowka.groupBy({
      by: ['wojewodztwo'],
      _count: { id: true },
    });

    const byCity = await prisma.placowka.groupBy({
      by: ['miejscowosc', 'wojewodztwo'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const total = await prisma.placowka.count();

    const voivodeshipMap = byVoivodeship.reduce((acc, item) => {
      acc[item.wojewodztwo.toLowerCase()] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const topCities: CityStats[] = byCity.map(item => ({
      name: item.miejscowosc,
      slug: createSlug(item.miejscowosc),
      count: item._count.id,
      voivodeship: item.wojewodztwo,
    }));

    return { total, byVoivodeship: voivodeshipMap, topCities };

  } catch (error) {
    console.error('Error fetching facility stats:', error);
    throw new Error('Failed to fetch facility statistics');
  } finally {
    await prisma.$disconnect();
  }
}

export async function getVoivodeshipCount(voivodeship: string): Promise<number> {
  try {
    const count = await prisma.placowka.count({
      where: {
        wojewodztwo: {
          equals: voivodeship,
          mode: 'insensitive',
        },
      },
    });
    return count;
  } catch (error) {
    console.error(`Error counting facilities in ${voivodeship}:`, error);
    return 0;
  } finally {
    await prisma.$disconnect();
  }
}

export async function getCityCount(city: string): Promise<number> {
  try {
    const count = await prisma.placowka.count({
      where: {
        miejscowosc: {
          equals: city,
          mode: 'insensitive',
        },
      },
    });
    return count;
  } catch (error) {
    console.error(`Error counting facilities in ${city}:`, error);
    return 0;
  } finally {
    await prisma.$disconnect();
  }
}

function createSlug(cityName: string): string {
  return cityName
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '+');
}
