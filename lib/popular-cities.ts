export const popularCities = [
  { name: 'Kraków', slug: 'krakow', count: 24, voivodeship: 'małopolskie' },
  { name: 'Nowy Sącz', slug: 'nowy+sacz', count: 8, voivodeship: 'małopolskie' },
  { name: 'Tarnów', slug: 'tarnow', count: 12, voivodeship: 'małopolskie' },
  { name: 'Nowy Targ', slug: 'nowy+targ', count: 6, voivodeship: 'małopolskie' },
  { name: 'Oświęcim', slug: 'oswiecim', count: 5, voivodeship: 'małopolskie' },
  { name: 'Wadowice', slug: 'wadowice', count: 4, voivodeship: 'małopolskie' },
  { name: 'Zakopane', slug: 'zakopane', count: 3, voivodeship: 'małopolskie' },
  { name: 'Myślenice', slug: 'myslenice', count: 4, voivodeship: 'małopolskie' },
] as const;

export type City = typeof popularCities[number];

export const getTotalFacilities = () => {
  return popularCities.reduce((sum, city) => sum + city.count, 0);
};

export const getCityBySlug = (slug: string) => {
  return popularCities.find(city => city.slug === slug);
};
