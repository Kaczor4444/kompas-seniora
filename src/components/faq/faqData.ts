// FAQ Data - wszystkie pytania
export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: 'finanse' | 'definicje' | 'formalnosci' | 'zaufanie';
  }
  
  export const allFAQData: FAQItem[] = [
    // --- SEKCJA 1: FINANSE I KOSZTY (6 pytań) ---
    {
      id: 'koszt-dps',
      question: 'Ile kosztuje pobyt w Domu Pomocy Społecznej (DPS)?',
      answer: 'Koszt zależy od **oficjalnej opłaty ustalonej przez samorząd** (MOPS/GOPS) w danej gminie. **Mieszkaniec ponosi maksymalnie 70% swojego dochodu** (emerytury/renty). Pozostałą część pokrywa rodzina lub gmina. Nasz Kalkulator Kosztów pozwala precyzyjnie obliczyć udział każdej ze stron.',
      category: 'finanse'
    },
    {
      id: 'kto-doplaca',
      question: 'Kto dopłaca resztę kosztów do DPS?',
      answer: 'Różnicę między kosztem pobytu w DPS a opłatą wnoszoną przez mieszkańca **pokrywa rodzina** (w linii prostej) lub **gmina**, jeśli dochód rodziny jest zbyt niski. Dopłaty te są regulowane przez Ustawę o Pomocy Społecznej.',
      category: 'finanse'
    },
    {
      id: 'oplata-za-przyjecie',
      question: 'Czy DPS pobiera opłatę za przyjęcie?',
      answer: 'Nie. Ustawa o Pomocy Społecznej **nie przewiduje żadnych opłat wstępnych** ani "za przyjęcie" do Domu Pomocy Społecznej. Płacisz wyłącznie miesięczny koszt utrzymania.',
      category: 'finanse'
    },
    {
      id: 'publiczne-vs-prywatne',
      question: 'Czym różnią się publiczne i prywatne domy opieki?',
      answer: 'Publiczne DPS są **dotowane przez państwo** i mają uregulowane ceny zgodnie z ustawą (maksymalnie 70% dochodu mieszkańca). Prywatne domy opieki ustalają ceny rynkowo i mogą kosztować 3000-8000 zł miesięcznie. **Kompas Seniora pokazuje wyłącznie publiczne placówki** z przejrzystymi cenami.',
      category: 'finanse'
    },
    {
      id: 'jak-dziala-kalkulator',
      question: 'Jak działa Kalkulator Kosztów?',
      answer: 'Podaj wysokość emerytury lub renty osoby wymagającej opieki oraz preferowany region - **kalkulator automatycznie obliczy** maksymalny udział mieszkańca (70% dochodu) i oszacuje dopłatę rodziny lub gminy. Otrzymasz spersonalizowany budżet opieki.',
      category: 'finanse'
    },
    {
      id: 'dodatkowe-koszty',
      question: 'Czy oprócz kosztu pobytu są jakieś dodatkowe opłaty?',
      answer: 'Koszt pobytu w DPS zazwyczaj obejmuje zakwaterowanie, wyżywienie i podstawową opiekę. **Dodatkowe wydatki** mogą obejmować leki na receptę, artykuły higieniczne osobistej lub specjalistyczne usługi medyczne - zależnie od potrzeb mieszkańca.',
      category: 'finanse'
    },
  
    // --- SEKCJA 2: RÓŻNICE I DEFINICJE PLACÓWEK (3 pytania) ---
    {
      id: 'dps-vs-sds',
      question: 'Czym różni się DPS od ŚDS?',
      answer: 'DPS (Dom Pomocy Społecznej) to placówka **całodobowej** opieki dla osób, które nie są w stanie samodzielnie funkcjonować. **ŚDS (Środowiskowy Dom Samopomocy)** to placówka **wsparcia dziennego** dla osób z zaburzeniami psychicznymi, ze spektrum autyzmu lub niepełnosprawnością intelektualną.',
      category: 'definicje'
    },
    {
      id: 'kto-do-dps',
      question: 'Kto może ubiegać się o miejsce w DPS?',
      answer: 'Osoby starsze, chore przewlekle lub z niepełnosprawnościami, które **wymagają całodobowej opieki** i nie mogą jej otrzymać w rodzinie. Wymagana jest decyzja administracyjna z **MOPS/GOPS**.',
      category: 'definicje'
    },
    {
      id: 'sds-dla-kogo',
      question: 'Czy ŚDS jest tylko dla osób z chorobami psychicznymi?',
      answer: 'Nie. Chociaż jest to główna grupa docelowa, ŚDS jest przeznaczony również dla osób z **niepełnosprawnością intelektualną** oraz osób ze **spektrum autyzmu** lub niepełnosprawnościami sprzężonymi. Służy aktywizacji i rehabilitacji społecznej.',
      category: 'definicje'
    },
  
    // --- SEKCJA 3: FORMALNOŚCI (4 pytania) ---
    {
      id: 'pierwsze-kroki',
      question: 'Jakie są pierwsze kroki do umieszczenia bliskiego w DPS?',
      answer: 'Pierwszym krokiem jest **kontakt z lokalnym Ośrodkiem Pomocy Społecznej (MOPS/GOPS)**, który przeprowadzi wywiad środowiskowy i zainicjuje proces wydania **decyzji administracyjnej** kwalifikującej do umieszczenia w placówce.',
      category: 'formalnosci'
    },
    {
      id: 'czas-oczekiwania',
      question: 'Jak długo trwa oczekiwanie na miejsce w DPS?',
      answer: 'Czas oczekiwania jest różny i zależy od **dostępności wolnych miejsc** oraz pilności przypadku. Może trwać od kilku tygodni do kilku miesięcy. W nagłych sytuacjach zdrowotnych czas ten może zostać skrócony.',
      category: 'formalnosci'
    },
    {
      id: 'miejsce-zamieszkania',
      question: 'Czy muszę być mieszkańcem danego regionu, aby korzystać z DPS w tym regionie?',
      answer: '**Nie.** Zgodnie z prawem, możesz ubiegać się o miejsce w DPS na terenie całej Polski. Decyzję i formalności prowadzi **Ośrodek Pomocy Społecznej z Twojego miejsca zamieszkania**.',
      category: 'formalnosci'
    },
    {
      id: 'lista-oczekujacych',
      question: 'Czy w każdym DPS jest lista oczekujących?',
      answer: 'Tak, większość placówek prowadzi **listy oczekujących** ze względu na ograniczoną liczbę miejsc. Aktualne informacje o dostępności otrzymasz kontaktując się bezpośrednio z DPS - numery telefonów i adresy email znajdziesz przy każdej placówce na naszej stronie.',
      category: 'formalnosci'
    },
  
    // --- SEKCJA 4: WYSZUKIWARKA I ZAUFANIE (6 pytań) ---
    {
      id: 'wiarygodnosc-danych',
      question: 'Czy dane o cenach i placówkach są wiarygodne?',
      answer: 'Tak! Wszystkie informacje pochodzą z **oficjalnych publicznych źródeł** i są regularnie aktualizowane. Pokazujemy **rzeczywiste ceny** obowiązujące w publicznych domach pomocy społecznej, zatwierdzone przez samorządy lokalne.',
      category: 'zaufanie'
    },
    {
      id: 'filtrowanie-schorzenie',
      question: 'Czy mogę znaleźć DPS dla osoby z demencją lub chorobą Alzheimera?',
      answer: 'Tak! Możesz filtrować placówki według specjalizacji - dla osób z chorobą Alzheimera i demencją, przewlekle chorych somatycznie, lub wymagających rehabilitacji. Każda placówka ma opisane typy opieki, które oferuje.',
      category: 'zaufanie'
    },
    {
      id: 'wyszukiwanie-bez-powiatu',
      question: 'Nie znam nazwy powiatu - czy mogę znaleźć DPS?',
      answer: 'Oczywiście! Wystarczy wpisać **nazwę swojej miejscowości** (nawet małej wioski) - nasza wyszukiwarka automatycznie znajdzie wszystkie placówki w okolicy. Nie musisz znać struktury administracyjnej powiatów ani gmin.',
      category: 'zaufanie'
    },
    {
      id: 'najblizsze-dps',
      question: 'Jak znaleźć najbliższy DPS od mojego miejsca zamieszkania?',
      answer: 'Użyj funkcji **"Znajdź w okolicy"** - wpisz nazwę swojej miejscowości, a system automatycznie pokaże placówki uporządkowane według odległości. Przy każdej placówce zobaczysz dokładną odległość i możliwość sprawdzenia trasy w Google Maps.',
      category: 'zaufanie'
    },
    {
      id: 'tylko-malopolska',
      question: 'Czy pokazujecie placówki tylko z Małopolski?',
      answer: 'Obecnie skupiamy się na **województwie małopolskim**, zapewniając najdokładniejsze i najbardziej aktualne dane. Planujemy stopniowe rozszerzanie bazy o kolejne regiony Polski - zapisz się do newslettera, aby otrzymać powiadomienie o nowych województwach.',
      category: 'zaufanie'
    },
    {
      id: 'jak-zaczac',
      question: 'Jak zacząć poszukiwania na Waszej stronie?',
      answer: 'Zacznij od wpisania **nazwy miejscowości lub regionu** w pole wyszukiwania na górze strony, lub użyj **Kalkulatora Kosztów**, aby natychmiast oszacować swój udział finansowy w opiece. Możesz też przeglądać wszystkie placówki na mapie.',
      category: 'zaufanie'
    },
  ];
  

// Mini FAQ dla Homepage - 6 najważniejszych pytań
export const miniFAQData: FAQItem[] = [
  allFAQData[0],  // Ile kosztuje DPS
  allFAQData[3],  // Publiczne vs prywatne
  allFAQData[6],  // DPS vs ŚDS
  allFAQData[9],  // Pierwsze kroki
  allFAQData[15], // Wyszukiwanie bez powiatu
  allFAQData[18], // Jak zacząć
];
