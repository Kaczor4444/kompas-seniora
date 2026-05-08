'use client';

import { useState } from 'react';

export default function PdfMonitorButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [force, setForce] = useState(false);

  async function trigger() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/admin/trigger-pdf-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('ok');
        setMessage('Workflow uruchomiony! Wynik pojawi się za ~2 min jako GitHub Issue.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Nieznany błąd');
      }
    } catch {
      setStatus('error');
      setMessage('Błąd połączenia');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={force}
          onChange={e => setForce(e.target.checked)}
          className="rounded"
        />
        Wymuś porównanie (nawet gdy PDF się nie zmienił)
      </label>

      <button
        onClick={trigger}
        disabled={status === 'loading'}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {status === 'loading' ? '⏳ Uruchamianie...' : '🔍 Sprawdź teraz'}
      </button>

      {status === 'ok' && (
        <p className="text-sm text-green-700 bg-green-50 rounded p-2">{message}</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-700 bg-red-50 rounded p-2">❌ {message}</p>
      )}

      <a
        href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO || 'Kaczor4444/kompas-seniora'}/issues?q=DPS+Monitor`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-indigo-600 hover:underline"
      >
        Zobacz poprzednie raporty na GitHub →
      </a>
    </div>
  );
}
