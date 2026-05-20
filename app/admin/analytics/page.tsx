'use client';

import { useState, useEffect } from 'react';
import {
  Eye, Phone, Mail, Globe, TrendingUp, Activity,
  BarChart3, Heart, Loader2, MapPin, Calendar,
} from 'lucide-react';
import ConversionFunnel from './_components/ConversionFunnel';
import GeographicInsights from './_components/GeographicInsights';
import TimePatterns from './_components/TimePatterns';
import LanguageStats from './_components/LanguageStats';
import LocalInsights from './_components/LocalInsights';
import BotStats from './_components/BotStats';

interface AnalyticsData {
  overview: {
    totalEvents: number;
    recentEventsCount: number;
    eventsByType: Array<{ type: string; count: number }>;
  };
  conversionFunnel: {
    totalViews: number;
    totalContacts: number;
    conversionRate: number;
    uniqueFacilitiesViewed: number;
    uniqueFacilitiesContacted: number;
    topConversionFacilities: Array<{
      id: number; nazwa: string; miejscowosc: string; typ_placowki: string;
      views: number; contacts: number; conversionRate: number;
    }>;
  };
  geographicInsights: {
    byCity: Array<{ city: string; wojewodztwo: string; totalEvents: number; views: number; contacts: number; facilitiesCount: number; viewsPerFacility: number; demandLevel: 'high' | 'medium' | 'low' }>;
    topCities: Array<{ city: string; wojewodztwo: string; totalEvents: number; views: number; contacts: number; facilitiesCount: number; viewsPerFacility: number; demandLevel: 'high' | 'medium' | 'low' }>;
    highDemandCities: Array<{ city: string; wojewodztwo: string; totalEvents: number; views: number; contacts: number; facilitiesCount: number; viewsPerFacility: number; demandLevel: 'high' | 'medium' | 'low' }>;
  };
  timePatterns: {
    hourly: Array<{ hour: number; totalEvents: number; views: number; contacts: number }>;
    daily: Array<{ dayOfWeek: number; dayName: string; totalEvents: number; views: number; contacts: number }>;
    peakHours: Array<{ hour: number; totalEvents: number; label: string }>;
  };
  topViewed: Array<{ id: number; nazwa: string; miejscowosc: string; wojewodztwo: string; typ_placowki: string; views: number }>;
  topContacted: Array<{ id: number; nazwa: string; miejscowosc: string; wojewodztwo: string; typ_placowki: string; contacts: number }>;
  recentActivity: Array<{ id: number; eventType: string; timestamp: string; placowka: { id: number; nazwa: string; miejscowosc: string } }>;
  dailyActivity: Array<{ date: string; count: number }>;
  statsByWojewodztwo: Array<{ wojewodztwo: string; views: number; contacts: number }>;
  languageStats: Array<{ language: string; count: number; percent: number }>;
  botStats: { totalBotVisits: number; aiBotVisits: number; searchBotVisits: number; topBots: Array<{ name: string; count: number }>; topPages: Array<{ path: string; count: number }> } | null;
  localInsights: { emptyResults: { topCombos: Array<{ combo: string; count: number }>; total: number }; filterCombos: { topCombos: Array<{ combo: string; count: number }> }; scrollDepth: Array<{ depth: number; percent: number; count: number }>; returnVisitors: { count: number; avgDaysBetween: number }; crossPowiat: { topPaths: Array<{ path: string; count: number }>; rate: number; total: number }; pathToContact: { avgViews: number; distribution: Array<{ views: string; count: number }>; totalContacts: number } } | null;
  dateRange: { from: string; to: string; days: number };
}

const EVENT_LABELS: Record<string, string> = {
  view: 'Wyświetlenie', phone_click: 'Klik telefon', email_click: 'Klik email',
  website_click: 'Klik WWW', favorite_add: 'Ulubione +', favorite_remove: 'Ulubione −',
  compare_add: 'Porównanie', share: 'Udostępnienie',
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  view: <Eye size={13} />, phone_click: <Phone size={13} />, email_click: <Mail size={13} />,
  website_click: <Globe size={13} />, favorite_add: <Heart size={13} />,
  favorite_remove: <Heart size={13} />, compare_add: <BarChart3 size={13} />, share: <TrendingUp size={13} />,
};

const DAY_OPTIONS = [
  { value: 7, label: '7 dni' },
  { value: 30, label: '30 dni' },
  { value: 90, label: '90 dni' },
];

// ── Wrapped section card ──────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-sm font-bold text-slate-900">{children}</h2>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 size={28} className="animate-spin text-slate-300" />
        <p className="text-sm text-slate-400 font-medium">Ładowanie statystyk…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-400 text-sm">Brak danych analitycznych</p>
      </div>
    );
  }

  const ev = (type: string) => data.overview?.eventsByType?.find(e => e.type === type)?.count ?? 0;
  const totalViews         = ev('view');
  const totalPhoneClicks   = ev('phone_click');
  const totalEmailClicks   = ev('email_click');
  const totalWebsiteClicks = ev('website_click');

  const maxDaily = Math.max(...(data.dailyActivity ?? []).map(d => d.count), 1);

  const overviewStats = [
    { label: 'Wyświetlenia',    value: totalViews,         icon: Eye,   bg: 'bg-blue-50',    color: 'text-blue-600' },
    { label: 'Klik telefon',    value: totalPhoneClicks,   icon: Phone, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Klik email',      value: totalEmailClicks,   icon: Mail,  bg: 'bg-violet-50',  color: 'text-violet-600' },
    { label: 'Klik WWW',        value: totalWebsiteClicks, icon: Globe, bg: 'bg-amber-50',   color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Panel admina</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics</h1>
        </div>

        {/* Days pill selector */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          {DAY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                days === opt.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {overviewStats.map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="p-5">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value.toLocaleString('pl-PL')}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Sub-components — each wrapped in consistent card */}
      {data.conversionFunnel && (
        <Card className="p-6"><ConversionFunnel data={data.conversionFunnel} /></Card>
      )}
      {data.geographicInsights && (
        <Card className="p-6"><GeographicInsights data={data.geographicInsights} /></Card>
      )}
      {data.timePatterns && (
        <Card className="p-6"><TimePatterns data={data.timePatterns} /></Card>
      )}
      <Card className="p-6"><LanguageStats data={data.languageStats || []} /></Card>
      <Card className="p-6"><BotStats data={data.botStats || null} /></Card>
      <Card className="p-6"><LocalInsights data={data.localInsights || null} /></Card>

      {/* Daily activity */}
      <Card className="p-6">
        <SectionTitle icon={<Activity size={15} />}>Aktywność dzienna</SectionTitle>
        {data.dailyActivity.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Brak aktywności w tym okresie</p>
        ) : (
          <div className="space-y-2">
            {data.dailyActivity.map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-400 w-16 shrink-0 text-right">
                  {new Date(day.date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden relative">
                  <div
                    className="h-6 bg-slate-800 rounded-full flex items-center justify-end px-2.5 transition-all duration-500"
                    style={{ width: `${Math.max((day.count / maxDaily) * 100, day.count > 0 ? 4 : 0)}%` }}
                  >
                    {day.count > 0 && (
                      <span className="text-[10px] font-bold text-white">{day.count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Top viewed + top contacted */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <SectionTitle icon={<Eye size={15} />}>Najpopularniejsze placówki</SectionTitle>
          {data.topViewed.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Brak danych</p>
          ) : (
            <div className="space-y-1">
              {data.topViewed.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                  <span className="text-xs font-black text-slate-300 w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.nazwa}</p>
                    <p className="text-[11px] text-slate-400">{p.miejscowosc} · {p.typ_placowki}</p>
                  </div>
                  <span className="text-sm font-black text-emerald-600 shrink-0">{p.views}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <SectionTitle icon={<Phone size={15} />}>Najczęściej kontaktowane</SectionTitle>
          {data.topContacted.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Brak danych</p>
          ) : (
            <div className="space-y-1">
              {data.topContacted.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                  <span className="text-xs font-black text-slate-300 w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.nazwa}</p>
                    <p className="text-[11px] text-slate-400">{p.miejscowosc} · {p.typ_placowki}</p>
                  </div>
                  <span className="text-sm font-black text-blue-600 shrink-0">{p.contacts}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Stats by województwo */}
      <Card className="p-6">
        <SectionTitle icon={<MapPin size={15} />}>Województwa</SectionTitle>
        {data.statsByWojewodztwo.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Brak danych</p>
        ) : (
          <div className="space-y-2">
            {data.statsByWojewodztwo.map((s) => (
              <div key={s.wojewodztwo} className="flex items-center gap-4 py-2 border-b border-stone-50 last:border-0">
                <span className="text-sm font-semibold text-slate-700 flex-1 capitalize">{s.wojewodztwo}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  <Eye size={10} /> {s.views}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <Phone size={10} /> {s.contacts}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent activity */}
      <Card className="p-6">
        <SectionTitle icon={<Calendar size={15} />}>Ostatnia aktywność</SectionTitle>
        {data.recentActivity.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Brak aktywności</p>
        ) : (
          <div className="space-y-1">
            {data.recentActivity.map((event) => (
              <div key={event.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                <span className="text-slate-400 shrink-0">{EVENT_ICONS[event.eventType] ?? <Activity size={13} />}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-700">{EVENT_LABELS[event.eventType] ?? event.eventType}</span>
                  <span className="text-xs text-slate-400 ml-1.5 truncate">{event.placowka.nazwa} · {event.placowka.miejscowosc}</span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(event.timestamp).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}
