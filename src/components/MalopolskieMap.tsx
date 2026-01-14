"use client";
import React, { useState } from 'react';
import { MALOPOLSKIE_COUNTIES, MAP_META } from '@/data/malopolskie-counties';

export default function MalopolskieMap() {
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">
          Mapa Powiatów Małopolski
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          {hoveredCounty ? (
            <span>Wybrany powiat: <strong className="text-blue-600 uppercase">{hoveredCounty}</strong></span>
          ) : (
            "Najedź na powiat, aby zobaczyć nazwę"
          )}
        </p>

        {/* Kontener SVG korzystający z MAP_META */}
        <svg
          viewBox={MAP_META.viewBox}
          className="w-full h-auto drop-shadow-md"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}
        >
          {MALOPOLSKIE_COUNTIES.map((county) => (
            <path
              key={county.id}
              d={county.d}
              fill={hoveredCounty === county.name ? "#3b82f6" : "#f8fafc"}
              stroke={hoveredCounty === county.name ? "#2563eb" : "#cbd5e1"}
              strokeWidth={hoveredCounty === county.name ? "1.5" : "0.5"}
              className="transition-all duration-200 cursor-pointer hover:z-10"
              onMouseEnter={() => setHoveredCounty(county.name)}
              onMouseLeave={() => setHoveredCounty(null)}
              onClick={() => alert(`Wybrano powiat: ${county.name}`)}
            />
          ))}

          {/* Opcjonalne: Nazwy powiatów pojawiające się po najechaniu (w punkcie centroid) */}
          {MALOPOLSKIE_COUNTIES.map((county) => (
            hoveredCounty === county.name && (
              <g key={`label-${county.id}`} pointerEvents="none">
                <text
                  x={county.centroid.x}
                  y={county.centroid.y}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-white pointer-events-none shadow-sm"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {county.name}
                </text>
              </g>
            )
          ))}
        </svg>
      </div>
    </div>
  );
}