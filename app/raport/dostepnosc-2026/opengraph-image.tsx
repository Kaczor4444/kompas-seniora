import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Raport: Dostępność DPS w Małopolsce 2026 — Kompas Seniora'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Emerald accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />

        {/* Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.4)',
            color: '#34d399',
            fontSize: 13,
            fontWeight: 700,
            padding: '6px 16px',
            borderRadius: 100,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            Edycja 2026
          </div>
          <div style={{ color: '#64748b', fontSize: 13 }}>kompas-seniora.pl/raport</div>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
          Dostępność DPS
          <span style={{ color: '#10b981' }}> w Małopolsce</span>
        </div>

        <div style={{ fontSize: 22, color: '#94a3b8', marginBottom: 48, maxWidth: 700 }}>
          Analiza 22 powiatów — wskaźniki nasycenia, luka finansowa i trendy cenowe.
        </div>

        {/* KPI row */}
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Najgorszy powiat', value: '171/10k', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            { label: 'Emerytura ZUS 2025', value: '4 085 zł', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Luka finansowa (rok)', value: '54 tys. zł', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{
              background: bg,
              border: `1px solid ${color}40`,
              borderRadius: 16,
              padding: '20px 28px',
              flex: 1,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Logo/brand bottom right */}
        <div style={{ position: 'absolute', bottom: 48, right: 60, color: '#334155', fontSize: 16, fontWeight: 700 }}>
          🧭 Kompas Seniora
        </div>
      </div>
    ),
    { ...size }
  )
}
