'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Play, RefreshCw, CheckCircle2, XCircle, Clock, Loader2,
  AlertTriangle, ExternalLink, Zap, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Definicje scraperów ──────────────────────────────────────────────────────

interface Scraper {
  workflow: string;
  name: string;
  description: string;
  source: string;
  cron: string;
  hasForce: boolean;
}

const GROUPS: { label: string; color: string; accent: string; scrapers: Scraper[] }[] = [
  {
    label: 'Małopolskie',
    color: 'bg-emerald-50 border-emerald-200',
    accent: 'bg-emerald-600',
    scrapers: [
      {
        workflow: 'dps-pdf-monitor.yml',
        name: 'Rejestr DPS',
        description: 'Wykaz Domów Pomocy Społecznej',
        source: 'MUW Małopolska (PDF)',
        cron: '1. i 15. każdego mies.',
        hasForce: true,
      },
      {
        workflow: 'wolne-miejsca-monitor.yml',
        name: 'Wolne miejsca DPS',
        description: 'Aktualne wolne miejsca w DPS',
        source: 'MUW Małopolska (XLSX)',
        cron: '1., 8., 15. każdego mies.',
        hasForce: true,
      },
      {
        workflow: 'senior-plus-monitor.yml',
        name: 'Ośrodki Senior+',
        description: 'Klub Senior+ i Dzienny Dom Senior+',
        source: 'MUW Małopolska (XLSX)',
        cron: '1. każdego mies.',
        hasForce: true,
      },
      {
        workflow: 'mddps-krakow-monitor.yml',
        name: 'MDDPS Kraków',
        description: 'Miejskie Dzienne Domy Pomocy Społecznej',
        source: 'BIP Kraków (HTML)',
        cron: '5. każdego mies.',
        hasForce: true,
      },
    ],
  },
  {
    label: 'Śląskie',
    color: 'bg-blue-50 border-blue-200',
    accent: 'bg-blue-600',
    scrapers: [
      {
        workflow: 'slaskie-dps-monitor.yml',
        name: 'Rejestr DPS Śląskie',
        description: 'Wykaz Domów Pomocy Społecznej',
        source: 'UW Katowice (PDF)',
        cron: '8. każdego mies.',
        hasForce: true,
      },
      {
        workflow: 'slaskie-mops-monitor.yml',
        name: 'Wykaz OPS Śląskie',
        description: 'MOPS / GOPS / CUS (167 ośrodków)',
        source: 'UW Katowice (PDF)',
        cron: '20. każdego mies.',
        hasForce: true,
      },
    ],
  },
  {
    label: 'Kujawsko-Pomorskie',
    color: 'bg-violet-50 border-violet-200',
    accent: 'bg-violet-600',
    scrapers: [
      {
        workflow: 'kp-wolne-miejsca-monitor.yml',
        name: 'Wolne miejsca DPS',
        description: 'Aktualne wolne miejsca w DPS (~48 placówek)',
        source: 'UW Bydgoszcz (XLS)',
        cron: '5. i 20. każdego mies.',
        hasForce: true,
      },
    ],
  },
  {
    label: 'GUS / Dane zewnętrzne',
    color: 'bg-slate-50 border-slate-200',
    accent: 'bg-slate-600',
    scrapers: [
      {
        workflow: 'gus-bdl-monitor.yml',
        name: 'GUS — Ludność poprodukcyjna',
        description: 'Zmienna 72293 — dane za bieżący rok',
        source: 'GUS BDL API',
        cron: '1. każdego mies.',
        hasForce: false,
      },
      {
        workflow: 'gus-emerytury-monitor.yml',
        name: 'GUS — Emerytury ZUS',
        description: 'Zmienna 155058 — przeciętna emerytura brutto',
        source: 'GUS BDL API',
        cron: '1. każdego mies.',
        hasForce: false,
      },
    ],
  },
];

// ── Status badge ─────────────────────────────────────────────────────────────

interface RunStatus {
  workflow: string;
  status: string | null;
  conclusion: string | null;
  runAt: string | null;
  runUrl: string | null;
}

function StatusBadge({ info }: { info?: RunStatus }) {
  if (!info || !info.status) {
    return <span className="text-xs text-slate-400">brak danych</span>;
  }
  if (info.status === 'in_progress' || info.status === 'queued') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
        <Loader2 size={11} className="animate-spin" /> w toku
      </span>
    );
  }
  if (info.conclusion === 'success') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
        <CheckCircle2 size={11} /> sukces
      </span>
    );
  }
  if (info.conclusion === 'failure') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
        <XCircle size={11} /> błąd
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <Clock size={11} /> {info.conclusion ?? info.status}
    </span>
  );
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s temu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h temu`;
  return `${Math.floor(diff / 86400)}d temu`;
}

// ── ScraperCard ───────────────────────────────────────────────────────────────

function ScraperCard({
  scraper,
  accent,
  checked,
  onCheck,
  runStatus,
  running,
  onRun,
}: {
  scraper: Scraper;
  accent: string;
  checked: boolean;
  onCheck: () => void;
  runStatus?: RunStatus;
  running: boolean;
  onRun: (force: boolean) => void;
}) {
  const [showForce, setShowForce] = useState(false);

  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden
        ${checked ? 'ring-2 ring-slate-400 shadow-md' : 'hover:shadow-md'}`}
    >
      {/* Accent strip */}
      <div className={`h-1 w-full ${accent}`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={onCheck}
            className="mt-0.5 w-4 h-4 rounded accent-slate-700 cursor-pointer flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{scraper.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{scraper.description}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">Źródło:</span> {scraper.source}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Clock size={10} />
            <span>{scraper.cron}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <StatusBadge info={runStatus} />
            {runStatus?.runAt && (
              <span className="text-slate-400">{timeAgo(runStatus.runAt)}</span>
            )}
            {runStatus?.runUrl && (
              <a
                href={runStatus.runUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 ml-auto"
              >
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onRun(false)}
            disabled={running}
            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            Uruchom
          </button>

          {scraper.hasForce && (
            <div className="relative">
              <button
                onClick={() => setShowForce(v => !v)}
                className="h-full px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                title="Opcje"
              >
                {showForce ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showForce && (
                <div className="absolute right-0 bottom-full mb-1 z-10 bg-white border border-slate-200 rounded-xl shadow-lg p-1 w-44">
                  <button
                    onClick={() => { onRun(true); setShowForce(false); }}
                    disabled={running}
                    className="w-full flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg hover:bg-amber-50 text-amber-700 disabled:opacity-50"
                  >
                    <Zap size={11} /> Uruchom z force
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ScrapersPage() {
  const [statuses, setStatuses] = useState<RunStatus[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [runningBulk, setRunningBulk] = useState(false);

  const allWorkflows = GROUPS.flatMap(g => g.scrapers.map(s => s.workflow));

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStatuses = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/admin/scraper-status');
      if (res.ok) setStatuses(await res.json());
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const statusFor = (workflow: string) => statuses.find(s => s.workflow === workflow);

  const triggerOne = async (workflow: string, force: boolean) => {
    setRunning(p => ({ ...p, [workflow]: true }));
    try {
      const res = await fetch('/api/admin/trigger-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow, force }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ ${workflow} uruchomiony${force ? ' (force)' : ''}`, true);
      } else {
        showToast(`❌ Błąd: ${data.error}`, false);
      }
    } catch {
      showToast('❌ Błąd sieci', false);
    } finally {
      setRunning(p => ({ ...p, [workflow]: false }));
    }
  };

  const triggerBulk = async (workflows: string[]) => {
    if (!workflows.length) return;
    setRunningBulk(true);
    let ok = 0, fail = 0;
    for (const wf of workflows) {
      const res = await fetch('/api/admin/trigger-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: wf, force: false }),
      });
      if (res.ok) ok++; else fail++;
      await new Promise(r => setTimeout(r, 300));
    }
    setRunningBulk(false);
    showToast(`✅ Uruchomiono ${ok}/${workflows.length}${fail ? ` (${fail} błędów)` : ''}`, fail === 0);
    setSelected(new Set());
  };

  const toggleSelect = (wf: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(wf) ? next.delete(wf) : next.add(wf);
      return next;
    });

  const toggleAll = () =>
    setSelected(selected.size === allWorkflows.length ? new Set() : new Set(allWorkflows));

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all
          ${toast.ok ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Monitory danych</h1>
          <p className="text-slate-500 text-sm mt-1">
            GitHub Actions — ręczne uruchamianie i podgląd statusów
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchStatuses}
            disabled={loadingStatus}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={loadingStatus ? 'animate-spin' : ''} />
            Odśwież statusy
          </button>

          {selected.size > 0 && (
            <button
              onClick={() => triggerBulk(Array.from(selected))}
              disabled={runningBulk}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {runningBulk
                ? <><Loader2 size={13} className="animate-spin" /> Uruchamianie…</>
                : <><Play size={13} /> Uruchom zaznaczone ({selected.size})</>}
            </button>
          )}

          <button
            onClick={() => triggerBulk(allWorkflows)}
            disabled={runningBulk}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 transition-colors"
          >
            {runningBulk
              ? <><Loader2 size={13} className="animate-spin" /> Uruchamianie…</>
              : <><Zap size={13} /> Uruchom wszystkie</>}
          </button>
        </div>
      </div>

      {/* Select all toggle */}
      <div className="flex items-center gap-2 mb-6">
        <input
          type="checkbox"
          id="select-all"
          checked={selected.size === allWorkflows.length}
          onChange={toggleAll}
          className="w-4 h-4 rounded accent-slate-700 cursor-pointer"
        />
        <label htmlFor="select-all" className="text-xs text-slate-500 cursor-pointer select-none">
          {selected.size === allWorkflows.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
        </label>
        {selected.size > 0 && (
          <span className="text-xs font-semibold text-slate-700 ml-1">({selected.size} zaznaczone)</span>
        )}
      </div>

      {/* Groups */}
      <div className="space-y-8">
        {GROUPS.map(group => (
          <div key={group.label}>
            {/* Group header */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold text-slate-700 mb-4 ${group.color}`}>
              <span className={`w-2 h-2 rounded-full ${group.accent}`} />
              {group.label}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.scrapers.map(scraper => (
                <ScraperCard
                  key={scraper.workflow}
                  scraper={scraper}
                  accent={group.accent}
                  checked={selected.has(scraper.workflow)}
                  onCheck={() => toggleSelect(scraper.workflow)}
                  runStatus={statusFor(scraper.workflow)}
                  running={!!running[scraper.workflow]}
                  onRun={(force) => triggerOne(scraper.workflow, force)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
        <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-500 space-y-1">
          <p>Uruchomienie wysyła <strong>workflow_dispatch</strong> do GitHub Actions — workflow odpala się na serwerach GitHub, nie lokalnie.</p>
          <p>Wyniki (Issue lub brak zmian) widoczne na GitHub po ~30–120 sekundach. Status odśwież ręcznie.</p>
          <p>Wymagane: zmienna środowiskowa <code className="bg-slate-200 px-1 rounded">GITHUB_PAT</code> z uprawnieniami <em>workflow</em>.</p>
        </div>
      </div>
    </div>
  );
}
