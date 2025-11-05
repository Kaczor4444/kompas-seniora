'use client';

import { useState } from 'react';

interface FacilityErrorButtonProps {
  facilityId: number;
  facilityName: string;
}

export default function FacilityErrorButton({ 
  facilityId, 
  facilityName 
}: FacilityErrorButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Auto-close modal po 3 sekundach
    setTimeout(() => {
      setShowModal(false);
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full sm:w-auto px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-accent-500 hover:text-accent-700 hover:bg-accent-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
      >
        <span>✏️</span>
        <span>Widzisz błąd w danych?</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Zgłoś błąd w danych
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>

            {/* Success Message */}
            {showSuccess ? (
              <div className="p-6">
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Dziękujemy za zgłoszenie!
                  </h3>
                  <p className="text-green-800 text-sm">
                    Otrzymaliśmy Twoją wiadomość i wkrótce się z nią zapoznamy.
                  </p>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Pre-filled facility name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placówka
                  </label>
                  <input
                    type="text"
                    value={facilityName}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                {/* What's wrong */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Co jest błędne? *
                  </label>
                  <div className="space-y-2">
                    {['Telefon', 'Adres', 'Cena', 'Email', 'Strona WWW', 'Inne'].map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-accent-600 border-gray-300 rounded focus:ring-accent-500"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Correct data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prawidłowe dane *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Wpisz poprawne dane..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twój email (opcjonalnie)
                  </label>
                  <input
                    type="email"
                    placeholder="twoj@email.pl"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Podaj jeśli chcesz otrzymać odpowiedź
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Wysyłanie...' : 'Wyślij'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}