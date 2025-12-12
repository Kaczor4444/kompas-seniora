export default function ChecklistaDokumentow() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            Checklista Dokumentów do MOPS
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            Kompletna lista dokumentów potrzebnych do złożenia wniosku o skierowanie do DPS.
          </p>

          {/* Status Badge */}
          <div className="inline-flex items-center justify-center w-full mb-8">
            <span className="px-6 py-3 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
              🚧 Narzędzie w przygotowaniu
            </span>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Wkrótce dostępne!
            </h2>
            <p className="text-blue-800">
              Przygotowujemy interaktywną checklistę, która pomoże Ci:
            </p>
            <ul className="mt-3 space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Sprawdzić które dokumenty już posiadasz</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Dowiedzieć się gdzie uzyskać brakujące dokumenty</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Pobrać gotowy PDF z kompletną listą do wydrukowania</span>
              </li>
            </ul>
          </div>

          {/* Temporary list */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Tymczasowa lista podstawowych dokumentów:
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2 text-emerald-600">□</span>
                <span>Dowód osobisty seniora</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-emerald-600">□</span>
                <span>Informacja o dochodach (decyzja emerytalna/rentowa z ZUS)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-emerald-600">□</span>
                <span>Zaświadczenie lekarskie o stanie zdrowia</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-emerald-600">□</span>
                <span>Orzeczenie o stopniu niepełnosprawności (jeśli dotyczy)</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              💡 Pełna lista dokumentów dostępna w artykule poniżej
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="/poradniki/finanse-prawne/proces-przyjecia-dps"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Wróć do artykułu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
