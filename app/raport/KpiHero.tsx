'use client'

import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

type Props = {
  avgDost:          number
  worstValue:       number
  worstPowiat:      string
  emerytura2025:    number
  dpsRatioBrutto:   number
  dpsRatioNetto:    number
}

const card = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0 },
}

export default function KpiHero({ avgDost, worstValue, worstPowiat, emerytura2025, dpsRatioBrutto, dpsRatioNetto }: Props) {
  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
    >
      {/* KPI 1 — średnia */}
      <motion.div variants={card} transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-slate-800 border border-slate-600 rounded-2xl p-5"
      >
        <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Średnia Małopolska
        </div>
        <div className="text-4xl font-black text-white mb-1">
          <AnimatedCounter value={avgDost} duration={1.2} />
        </div>
        <div className="text-slate-300 text-xs mt-2 leading-relaxed">
          miejsc DPS na 10 tys.<br />seniorów 80+
        </div>
      </motion.div>

      {/* KPI 2 — najgorszy */}
      <motion.div variants={card} transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-red-900 border border-red-700 rounded-2xl p-5"
      >
        <div className="text-[10px] font-semibold text-red-200 uppercase tracking-wider mb-3">
          Najgorszy powiat
        </div>
        <div className="text-4xl font-black text-white mb-1">
          <AnimatedCounter value={worstValue} duration={1.4} />
        </div>
        <div className="text-red-200 text-xs mt-2 leading-relaxed">
          miejsc / 10 tys. 80+<br />
          <span className="font-semibold">{worstPowiat}</span>
        </div>
      </motion.div>

      {/* KPI 3 — emerytura */}
      <motion.div variants={card} transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-slate-800 border border-slate-600 rounded-2xl p-5"
      >
        <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Emerytura ZUS 2025
        </div>
        <div className="text-3xl font-black text-white mb-1">
          <AnimatedCounter value={emerytura2025} suffix=" zł" duration={1.3} />
        </div>
        <div className="text-slate-300 text-xs mt-2 leading-relaxed">
          średnia brutto · Małopolska
        </div>
      </motion.div>

      {/* KPI 4 — stosunek DPS do emerytury */}
      <motion.div variants={card} transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-slate-800 border border-slate-600 rounded-2xl p-5"
      >
        <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Najtańszy DPS 2025
        </div>
        <div className="text-4xl font-black text-white mb-1">
          <AnimatedCounter value={dpsRatioBrutto} suffix="%" duration={1.5} />
        </div>
        <div className="text-slate-300 text-xs mt-2 leading-relaxed">
          średniej emerytury brutto<br />
          <span className="text-slate-400">netto: ~{dpsRatioNetto}% (po podatku)</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
