import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isValidAdminCookie } from '@/lib/adminAuth';
import {
  Building2, Heart, GraduationCap, Users, MapPin, ShieldAlert,
  Plus, List, BarChart3, Activity, Radio, ChevronRight, Clock,
  CheckCircle2, XCircle, Lock, Ban,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  if (!isValidAdminCookie(cookieStore.get('admin-auth')?.value)) {
    redirect('/admin/login');
  }

  const [totalPlacowki, totalDPS, totalSDS, totalKlub, totalDD, totalUTW, totalMops, recentLogs] =
    await Promise.all([
      prisma.placowka.count(),
      prisma.placowka.count({ where: { typ_placowki: 'DPS' } }),
      prisma.placowka.count({ where: { typ_placowki: 'ŚDS' } }),
      prisma.placowka.count({ where: { typ_placowki: 'Klub Senior+' } }),
      prisma.placowka.count({ where: { typ_placowki: 'Dzienny Dom Senior+' } }),
      prisma.placowka.count({ where: { typ_placowki: 'UTW' } }),
      prisma.mopsContact.count(),
      prisma.adminSecurityLog.findMany({ take: 8, orderBy: { timestamp: 'desc' } }),
    ]);

  const stats = [
    { label: 'Wszystkie placówki', value: totalPlacowki, icon: Building2, color: 'text-slate-700', bg: 'bg-slate-50' },
    { label: 'DPS', value: totalDPS, icon: Building2, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Klub Senior+', value: totalKlub, icon: Heart, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'DD Senior+', value: totalDD, icon: Heart, color: 'text-orange-700', bg: 'bg-orange-50' },
    { label: 'UTW', value: totalUTW, icon: GraduationCap, color: 'text-violet-700', bg: 'bg-violet-50' },
    { label: 'MOPS / GOPS / CUS', value: totalMops, icon: Users, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ];

  const quickLinks = [
    { href: '/admin/placowki/dodaj', label: 'Dodaj placówkę', desc: 'Nowy DPS, Klub Senior+, UTW…', icon: Plus, color: 'hover:border-slate-400' },
    { href: '/admin/placowki', label: 'Lista placówek', desc: 'Przeglądaj i edytuj', icon: List, color: 'hover:border-slate-400' },
    { href: '/admin/mops', label: 'MOPS / GOPS', desc: `${totalMops} ośrodków w bazie`, icon: MapPin, color: 'hover:border-slate-400' },
    { href: '/admin/analytics', label: 'Analytics', desc: 'Aktywność użytkowników', icon: BarChart3, color: 'hover:border-slate-400' },
    { href: '/admin/wolne-miejsca', label: 'Wolne miejsca DPS', desc: 'Tracker zmian — Małopolska', icon: Activity, color: 'hover:border-emerald-400' },
    { href: '/admin/scrapers', label: 'Monitory danych', desc: '8 GitHub Actions scraperów', icon: Radio, color: 'hover:border-emerald-400' },
    { href: '/admin/security-log', label: 'Security Log', desc: 'Logi logowań i blokad', icon: ShieldAlert, color: 'hover:border-slate-400' },
  ];

  const logIcon: Record<string, React.ReactNode> = {
    login_success: <CheckCircle2 size={14} className="text-emerald-500" />,
    login_failed:  <XCircle     size={14} className="text-red-500" />,
    logout:        <Lock        size={14} className="text-slate-400" />,
    rate_limit:    <Ban         size={14} className="text-orange-500" />,
  };
  const logLabel: Record<string, string> = {
    login_success: 'Zalogowano',
    login_failed:  'Nieudane logowanie',
    logout:        'Wylogowano',
    rate_limit:    'Rate limit',
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Panel admina</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={15} className={color} />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Szybkie akcje</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map(({ href, label, desc, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={`group bg-white rounded-2xl border border-stone-100 p-5 shadow-sm flex items-center gap-4 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 ${color}`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center shrink-0 transition-colors">
                <Icon size={18} className="text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm">{label}</div>
                <div className="text-xs text-slate-400 truncate">{desc}</div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900">Ostatnia aktywność</h2>
          </div>
          <Link href="/admin/security-log" className="text-xs font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
            Wszystkie <ChevronRight size={12} />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-sm text-slate-400">Brak aktywności</p>
        ) : (
          <div className="space-y-1">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                <div className="shrink-0">{logIcon[log.eventType] ?? <Clock size={14} className="text-slate-300" />}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-700">
                    {logLabel[log.eventType] ?? log.eventType}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">{log.ipAddress}</span>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
