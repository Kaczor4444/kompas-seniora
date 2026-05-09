'use client';

import { useState } from 'react';

export default function WolneMiejscaMonitorButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [force, setForce] = useState(false);

  async function trigger() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/admin/trigger-wolne-miejsca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('ok');
        setMessage('Workflow uruchomiony! Wynik pojawi się za ~1 min jako GitHub Issue (tylko jeśli plik się zmienił).');
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
        Wymuś Issue (nawet jeśli plik się nie zmienił)
      </label>

      <button
        onClick={trigger}
        disabled={status === 'loading'}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {status === 'loading' ? '⏳ Uruchamianie...' : '🏠 Sprawdź wolne miejsca'}
      </button>

      {status === 'ok' && (
        <p className="text-sm text-green-700 bg-green-50 rounded p-2">{message}</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-700 bg-red-50 rounded p-2">❌ {message}</p>
      )}

      <a
        href={`https://github.com/Kaczor4444/kompas-seniora/issues?q=wolne+miejsca`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-emerald-600 hover:underline"
      >
        Zobacz poprzednie raporty na GitHub →
      </a>
    </div>
  );
}
