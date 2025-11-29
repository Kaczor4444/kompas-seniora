import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Poradniki - Kompas Seniora | Przewodniki dla seniorów i opiekunów',
  description: 'Jak wybrać DPS, ile kosztuje opieka, jak złożyć wniosek o dodatek pielęgnacyjny - praktyczne przewodniki krok po kroku. Dowiedz się, czy senior musi wyrazić zgodę na DPS, jak uzyskać dofinansowanie i jakie prawa przysługują opiekunom.',
  keywords: 'jak wybrać DPS, ile kosztuje opieka nad seniorem, jak złożyć wniosek, jak uzyskać dofinansowanie, czy senior musi wyrazić zgodę, kto płaci za DPS, kiedy przysługuje dodatek pielęgnacyjny, jak załatwić opiekę, demencja pierwsze objawy, prawa opiekuna rodzinnego',
};

export default function PoradnikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
