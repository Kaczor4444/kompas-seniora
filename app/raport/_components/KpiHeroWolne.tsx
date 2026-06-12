'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

type Props = {
  totalWolne: number;
  totalOczek: number;
  withWolne: number;
  totalPowiaty: number;
  diffWolne: number | null;
};

export default function KpiHeroWolne({ totalWolne, totalOczek, withWolne, totalPowiaty, diffWolne }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-5 max-w-xl">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Wolne miejsca</div>
        <div className="text-4xl font-black text-emerald-400">
          <AnimatedCounter value={totalWolne} duration={1.2} />
        </div>
        {diffWolne !== null && diffWolne !== 0 && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${diffWolne > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {diffWolne > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {diffWolne > 0 ? '+' : ''}{diffWolne} vs poprzedni miesiąc
          </div>
        )}
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Oczekujących</div>
        <div className="text-4xl font-black text-amber-400">
          <AnimatedCounter value={totalOczek} duration={1.4} />
        </div>
        <div className="text-xs text-slate-500 mt-1">na miejsce w DPS</div>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Powiaty z miejscami</div>
        <div className="text-4xl font-black text-white">
          <AnimatedCounter value={withWolne} duration={1.0} />
          <span className="text-2xl text-slate-500">/{totalPowiaty}</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">powiatów Małopolski</div>
      </div>
    </div>
  );
}
