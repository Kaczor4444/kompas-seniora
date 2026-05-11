// FAQ Data - wszystkie pytania
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'finanse' | 'definicje' | 'formalnosci' | 'zaufanie';
}

export const allFAQData: FAQItem[] = [
  // --- SEKCJA 1: FINANSE I KOSZTY ---
  {
    id: 'koszt-dps',
    question: 'Ile kosztuje pobyt w Domu Pomocy Społecznej (DPS)?',
    // POPRAWKA: koszt ustala powiat (wójt/burmistrz), nie MOPS
    answer: 'Koszt pobytu ustala każdy **powiat osobno** (wójt lub burmistrz w zarządzeniu) i ogłasza go do 31 marca każdego roku. W Małopolsce w 2026 r. wynosi od **5 775 zł do ponad 12 000 zł miesięcznie**. Mieszkaniec płaci maksymalnie **70% swojego dochodu** — resztę dopłaca rodzina lub gmina. Nasz Kalkulator pokazuje rzeczywisty podział dla Twojej sytuacji.',
    category: 'finanse'
  },
  {
    id: 'kto-doplaca',
    question: 'Kto dopłaca resztę kosztów do DPS?',
    // POPRAWKA: dodano kolejność + próg 300%
    answer: 'Ustawa o pomocy społecznej (art. 61) określa kolejność: najpierw **małżonek** seniora, potem **dzieci i wnuki**, na końcu **gmina** jako gwarant. Rodzina dopłaca jednak tylko wtedy, gdy jej dochód przekracza ustawowy próg — **3 030 zł netto** dla osoby samotnej lub **2 469 zł na osobę** w rodzinie. Poniżej tych kwot resztę pokrywa gmina.',
    category: 'finanse'
  },
  {
    id: 'rodzenstwo-nie-placi',
    question: 'Czy rodzeństwo musi płacić za DPS brata lub siostry?',
    answer: '**Nie.** Art. 61 ustawy o pomocy społecznej wymienia jako zobowiązanych wyłącznie: mieszkańca, jego małżonka oraz dzieci i wnuki (zstępnych w linii prostej). Rodzeństwo i inni krewni w linii bocznej **nie mają żadnego prawnego obowiązku** dopłaty — niezależnie od swoich dochodów.',
    category: 'finanse'
  },
  {
    id: 'progi-300',
    question: 'Od jakiej kwoty dochodu rodzina musi dopłacać do DPS?',
    answer: 'Rodzina jest zobowiązana do dopłaty tylko jeśli jej dochód przekracza **300% kryterium dochodowego**. W 2026 roku wynosi ono **3 030 zł netto dla osoby samotnej** lub **2 469 zł netto na osobę w rodzinie**. Poniżej tych progów rodzina jest zwolniona z opłaty, a brakującą kwotę pokrywa w całości gmina.',
    category: 'finanse'
  },
  {
    id: 'oplata-za-przyjecie',
    question: 'Czy DPS pobiera opłatę za przyjęcie?',
    answer: 'Nie. Ustawa o pomocy społecznej **nie przewiduje żadnych opłat wstępnych** ani "za przyjęcie" do Domu Pomocy Społecznej. Płacisz wyłącznie miesięczny koszt utrzymania.',
    category: 'finanse'
  },
  {
    id: 'publiczne-vs-prywatne',
    question: 'Czym różnią się publiczne i prywatne domy opieki?',
    // POPRAWKA: "3000-8000 zł" → "5 000–15 000 zł" (aktualne 2026)
    answer: 'Publiczne DPS są **dotowane przez samorząd** — mieszkaniec płaci max 70% dochodu, niezależnie od rzeczywistego kosztu utrzymania. Prywatne domy opieki ustalają ceny rynkowo: zwykle **5 000–15 000 zł miesięcznie**, bez ustawowych limitów odpłatności dla rodziny. **Kompas Seniora pokazuje wyłącznie publiczne placówki** z przejrzystymi cenami.',
    category: 'finanse'
  },
  {
    id: 'jak-dziala-kalkulator',
    question: 'Jak działa Kalkulator Kosztów?',
    // POPRAWKA: opis nowego kalkulatora (4 karty, live, małżonek+dzieci)
    answer: 'Podaj koszt DPS, emeryturę seniora, dochód małżonka i liczbę dzieci — **kalkulator na żywo pokaże podział kosztów** między mieszkańca, małżonka, dzieci i gminę. Możesz też wpisać swoje miasto, aby wyszukać pobliskie placówki i automatycznie podstawić ich cenę do kalkulatora.',
    category: 'finanse'
  },
  {
    id: 'dodatkowe-koszty',
    question: 'Czy oprócz kosztu pobytu są jakieś dodatkowe opłaty?',
    answer: 'Koszt pobytu w DPS zazwyczaj obejmuje zakwaterowanie, wyżywienie i podstawową opiekę. **Dodatkowe wydatki** mogą obejmować leki na receptę, artykuły higieniczne lub specjalistyczne usługi medyczne — zależnie od indywidualnych potrzeb mieszkańca.',
    category: 'finanse'
  },

  // --- SEKCJA 2: RÓŻNICE I DEFINICJE PLACÓWEK ---
  {
    id: 'dps-vs-sds',
    question: 'Czym różni się DPS od ŚDS?',
    answer: 'DPS (Dom Pomocy Społecznej) to placówka **całodobowej** opieki dla osób, które nie są w stanie samodzielnie funkcjonować. **ŚDS (Środowiskowy Dom Samopomocy)** to placówka **wsparcia dziennego** dla osób z zaburzeniami psychicznymi, ze spektrum autyzmu lub niepełnosprawnością intelektualną.',
    category: 'definicje'
  },
  {
    id: 'zol-vs-dps',
    question: 'Czym różni się płatność w ZOL od DPS?',
    answer: 'W Zakładzie Opiekuńczo-Leczniczym (ZOL) **Narodowy Fundusz Zdrowia pokrywa koszty opieki medycznej** — pacjent płaci jedynie za zakwaterowanie i wyżywienie (max 70% dochodu). Kluczowa różnica: **rodzina w ZOL nie jest prawnie zobowiązana do dopłaty** tak jak w DPS. ZOL przeznaczony jest dla osób wymagających głównie opieki medycznej, nie opiekuńczo-bytowej.',
    category: 'definicje'
  },
  {
    id: 'kto-do-dps',
    question: 'Kto może ubiegać się o miejsce w DPS?',
    answer: 'Osoby starsze, chore przewlekle lub z niepełnosprawnościami, które **wymagają całodobowej opieki** i nie mogą jej otrzymać w rodzinie ani w środowisku domowym. Wymagana jest decyzja administracyjna z **MOPS/GOPS** po przeprowadzeniu wywiadu środowiskowego.',
    category: 'definicje'
  },
  {
    id: 'sds-dla-kogo',
    question: 'Czy ŚDS jest tylko dla osób z chorobami psychicznymi?',
    answer: 'Nie. Chociaż jest to główna grupa docelowa, ŚDS jest przeznaczony również dla osób z **niepełnosprawnością intelektualną** oraz osób ze **spektrum autyzmu** lub niepełnosprawnościami sprzężonymi. Służy aktywizacji i rehabilitacji społecznej — senior wraca do domu wieczorem.',
    category: 'definicje'
  },

  // --- SEKCJA 3: FORMALNOŚCI ---
  {
    id: 'pierwsze-kroki',
    question: 'Jakie są pierwsze kroki do umieszczenia bliskiego w DPS?',
    answer: 'Pierwszym krokiem jest **kontakt z lokalnym Ośrodkiem Pomocy Społecznej (MOPS/GOPS)**, który przeprowadzi wywiad środowiskowy i zainicjuje proces wydania **decyzji administracyjnej** kierującej do placówki. Więcej szczegółów znajdziesz w naszym poradniku o procesie przyjęcia.',
    category: 'formalnosci'
  },
  {
    id: 'czas-oczekiwania',
    question: 'Jak długo trwa oczekiwanie na miejsce w DPS?',
    answer: 'Czas oczekiwania jest różny i zależy od **dostępności wolnych miejsc** oraz pilności przypadku. W Małopolsce jest łącznie **6 013 miejsc** w publicznych DPS — stan na 30 kwietnia 2026 r.: **101 wolnych miejsc** przy 167 osobach na liście oczekujących. Dane aktualizujemy co miesiąc, ale sytuacja zmienia się szybko — **warto dzwonić bezpośrednio do placówki**, bo wolne miejsce może pojawić się w każdej chwili. W nagłych sytuacjach zdrowotnych MOPS może przyspieszyć procedurę.',
    category: 'formalnosci'
  },
  {
    id: 'miejsce-zamieszkania',
    question: 'Czy muszę być mieszkańcem danego regionu, aby korzystać z DPS w tym regionie?',
    answer: '**Nie.** Możesz ubiegać się o miejsce w DPS na terenie całej Polski. Formalności i decyzję administracyjną prowadzi jednak **Ośrodek Pomocy Społecznej z Twojego miejsca zamieszkania** — nawet jeśli wybrałeś placówkę w innym województwie.',
    category: 'formalnosci'
  },
  {
    id: 'lista-oczekujacych',
    question: 'Czy w każdym DPS jest lista oczekujących?',
    answer: 'Tak, większość placówek prowadzi **listy oczekujących** ze względu na ograniczoną liczbę miejsc. Aktualne informacje o dostępności otrzymasz kontaktując się bezpośrednio z DPS — numery telefonów i adresy e-mail znajdziesz przy każdej placówce na naszej stronie.',
    category: 'formalnosci'
  },

  // --- SEKCJA 4: WYSZUKIWARKA I ZAUFANIE ---
  {
    id: 'wiarygodnosc-danych',
    question: 'Czy dane o cenach i placówkach są wiarygodne?',
    answer: 'Tak. Wszystkie informacje pochodzą z **oficjalnych publicznych rejestrów** (Małopolski Urząd Wojewódzki, GUS) i są regularnie aktualizowane. Pokazujemy **rzeczywiste koszty utrzymania** ogłaszane przez powiaty — nie szacunki ani dane z ogłoszeń.',
    category: 'zaufanie'
  },
  {
    id: 'filtrowanie-schorzenie',
    question: 'Czy mogę znaleźć DPS dla osoby z demencją lub chorobą Alzheimera?',
    answer: 'Tak. Możesz filtrować placówki według profilu opieki — dla osób z chorobą Alzheimera i demencją, przewlekle chorych somatycznie, lub wymagających rehabilitacji. Każda placówka ma opisany typ opieki, który oferuje.',
    category: 'zaufanie'
  },
  {
    id: 'wyszukiwanie-bez-powiatu',
    question: 'Nie znam nazwy powiatu — czy mogę znaleźć DPS?',
    answer: 'Oczywiście. Wystarczy wpisać **nazwę swojej miejscowości** (nawet małej wioski) — wyszukiwarka automatycznie znajdzie wszystkie placówki w okolicy. Nie musisz znać struktury administracyjnej powiatów ani gmin.',
    category: 'zaufanie'
  },
  {
    id: 'najblizsze-dps',
    question: 'Jak znaleźć najbliższy DPS od mojego miejsca zamieszkania?',
    answer: 'Użyj funkcji **"Znajdź w okolicy"** — wpisz nazwę swojej miejscowości, a system pokaże placówki posortowane według odległości. Przy każdej zobaczysz dokładną odległość i możliwość sprawdzenia trasy w Google Maps.',
    category: 'zaufanie'
  },
  {
    id: 'tylko-malopolska',
    question: 'Czy pokazujecie placówki tylko z Małopolski?',
    answer: 'Obecnie skupiamy się na **województwie małopolskim** (184 placówki DPS i ŚDS), zapewniając najdokładniejsze i najbardziej aktualne dane. Planujemy stopniowe rozszerzanie bazy o kolejne regiony Polski.',
    category: 'zaufanie'
  },
  {
    id: 'jak-zaczac',
    question: 'Jak zacząć poszukiwania na Waszej stronie?',
    answer: 'Zacznij od wpisania **nazwy miejscowości lub regionu** w pole wyszukiwania, lub otwórz **Kalkulator Kosztów**, aby od razu zobaczyć podział finansowy dla Twojej sytuacji. Możesz też przeglądać wszystkie 184 placówki na mapie.',
    category: 'zaufanie'
  },
];

// Mini FAQ dla Homepage — pobieramy po id, nie po indeksie (odporne na zmiany kolejności)
const findById = (id: string): FAQItem => allFAQData.find(x => x.id === id)!;

export const miniFAQData: FAQItem[] = [
  findById('koszt-dps'),
  findById('publiczne-vs-prywatne'),
  findById('dps-vs-sds'),
  findById('pierwsze-kroki'),
  findById('wyszukiwanie-bez-powiatu'),
  findById('jak-zaczac'),
];
