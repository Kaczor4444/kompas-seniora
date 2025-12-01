export const categories = [
  'Wszystkie',
  'Wybór opieki', 
  'Porady dla opiekunów',
  'Porady dla seniorów',
  'Finanse i świadczenia',
  'Prawne aspekty'
] as const;

export type Category = typeof categories[number];
