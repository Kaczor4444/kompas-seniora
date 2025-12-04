'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TOCHeading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  headings: TOCHeading[]
  variant?: 'mobile' | 'desktop'
}

export default function TableOfContents({ headings, variant = 'desktop' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 1,
      }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  const handleClick = (id: string) => {
    console.log('🔍 TOC click:', id) // DEBUG
    const element = document.getElementById(id)
    console.log('📍 Element found:', element) // DEBUG

    if (element) {
      const yOffset = -100
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      console.log('📜 Scrolling to y:', y) // DEBUG

      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveId(id)

      if (variant === 'mobile') {
        setIsOpen(false)
      }
    } else {
      console.error('❌ Element not found for id:', id) // DEBUG
      console.log('Available IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id)) // DEBUG
    }
  }

  if (headings.length === 0) return null

  if (variant === 'mobile') {
    return (
      <div className="lg:hidden mb-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-emerald-500 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-semibold text-gray-900">Spis treści</span>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {isOpen && (
          <nav className="mt-3 p-4 bg-white rounded-lg border border-gray-200 max-h-[400px] overflow-y-auto">
            <ul className="space-y-2">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <button
                    onClick={() => handleClick(heading.id)}
                    className={`block w-full text-left py-2 px-3 rounded transition-colors ${
                      heading.level === 3 ? 'pl-6 text-sm' : ''
                    } ${
                      activeId === heading.id
                        ? 'text-emerald-700 font-semibold bg-emerald-50'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                    }`}
                  >
                    {heading.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    )
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 sticky top-0 bg-white pb-3 border-b border-gray-200 z-10">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Spis treści
          </h3>
          <nav>
            <ul className="space-y-2 text-sm">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <button
                    onClick={() => handleClick(heading.id)}
                    className={`block w-full text-left py-2 px-3 rounded transition-colors ${
                      heading.level === 3 ? 'pl-6 text-sm' : ''
                    } ${
                      activeId === heading.id
                        ? 'text-emerald-700 font-semibold bg-emerald-50'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                    }`}
                  >
                    {heading.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  )
}
