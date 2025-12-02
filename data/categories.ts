export const primaryCategories = [
  'Wszystkie',
  'Wybór opieki',
  'Dla opiekuna',
  'Dla seniora'
] as const;

export const secondaryCategories = [
  'Finanse i świadczenia',
  'Prawne aspekty'
] as const;

export const categories = [
  ...primaryCategories,
  ...secondaryCategories
] as const;

export type Category = typeof categories[number];
export type PrimaryCategory = typeof primaryCategories[number];
export type SecondaryCategory = typeof secondaryCategories[number];
