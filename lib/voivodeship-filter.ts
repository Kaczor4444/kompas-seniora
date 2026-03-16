/**
 * Voivodeship Filter Helper
 *
 * Centralna konfiguracja które województwa są widoczne na frontendzie.
 * Admin panel zawsze widzi wszystkie dane.
 */

// Lista województw widocznych dla userów
export const ENABLED_VOIVODESHIPS = ['małopolskie'] as const;

export type EnabledVoivodeship = typeof ENABLED_VOIVODESHIPS[number];

/**
 * Zwraca WHERE clause dla Prisma który filtruje po dozwolonych województwach
 *
 * @param additionalWhere - dodatkowe warunki do połączenia z AND
 * @returns Prisma WHERE object
 *
 * @example
 * ```ts
 * const placowki = await prisma.placowka.findMany({
 *   where: getVoivodeshipFilter()
 * });
 * ```
 *
 * @example
 * ```ts
 * const placowki = await prisma.placowka.findMany({
 *   where: getVoivodeshipFilter({ typ_placowki: 'DPS' })
 * });
 * ```
 */
export function getVoivodeshipFilter(additionalWhere?: Record<string, any>) {
  const baseFilter = {
    wojewodztwo: {
      in: ENABLED_VOIVODESHIPS as unknown as string[]
    }
  };

  if (!additionalWhere) {
    return baseFilter;
  }

  return {
    AND: [
      baseFilter,
      additionalWhere
    ]
  };
}

/**
 * Sprawdza czy województwo jest dozwolone
 */
export function isVoivodeshipEnabled(voivodeship: string): boolean {
  return ENABLED_VOIVODESHIPS.includes(voivodeship as EnabledVoivodeship);
}

/**
 * Lista wszystkich województw w Polsce (dla referencji)
 */
export const ALL_VOIVODESHIPS = [
  'dolnośląskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'łódzkie',
  'małopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'śląskie',
  'świętokrzyskie',
  'warmińsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie'
] as const;
