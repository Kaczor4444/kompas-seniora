export default function OcenaPotrzeb() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">📄</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            Formularz Oceny Potrzeb Seniora
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            Narzędzie pomoże Ci ocenić poziom wsparcia potrzebny Twojemu bliskiemu i przygotować się do rozmowy z MOPS.
          </p>

          {/* Status Badge */}
          <div className="inline-flex items-center justify-center w-full mb-8">
            <span className="px-6 py-3 bg-warning-100 text-warning-800 rounded-full text-sm font-semibold">
              🚧 Narzędzie w przygotowaniu
            </span>
          </div>

          {/* Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-emerald-900 mb-2">
              Wkrótce dostępne!
            </h2>
            <p className="text-emerald-800">
              Pracujemy nad interaktywnym formularzem, który pomoże Ci określić:
            </p>
            <ul className="mt-3 space-y-2 text-emerald-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Poziom samodzielności seniora w codziennych czynnościach</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Rodzaj opieki najbardziej odpowiedni dla Twojego bliskiego</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Listę dokumentów potrzebnych do złożenia wniosku w MOPS</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="/poradniki/finanse-prawne/proces-przyjecia-dps"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
