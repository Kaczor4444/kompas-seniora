'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Printer, Bookmark, Share2 } from 'lucide-react'

interface TOCHeading {
  id: string
  text: string
  level: number
}

interface Download {
  title: string
  url: string
  icon?: string
}

interface TableOfContentsProps {
  headings: TOCHeading[]
  downloads?: Download[]
  variant?: 'mobile' | 'desktop'
}

export default function TableOfContents({ headings, downloads = [], variant = 'desktop' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  // Action button handlers
  const handlePrint = () => {
    window.print()
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // Could save to localStorage here if needed
    if (!isBookmarked) {
      // Show toast or notification
      console.log('Dodano do zakładek')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link skopiowany do schowka!')
    }
  }

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

  // Auto-scroll TOC to keep active item visible
  useEffect(() => {
    if (!activeId || variant === 'mobile' || isUserScrolling) return

    const tocNav = document.querySelector('nav[aria-label="Table of contents"]')
    const activeLink = tocNav?.querySelector(`a[href="#${activeId}"]`)

    if (activeLink && tocNav) {
      const navRect = tocNav.getBoundingClientRect()
      const linkRect = activeLink.getBoundingClientRect()

      // Check if link is outside viewport
      const isOutOfView = linkRect.top < navRect.top + 50 || linkRect.bottom > navRect.bottom - 50

      if (isOutOfView) {
        activeLink.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }
    }
  }, [activeId, variant, isUserScrolling])

  const handleClick = (id: string) => {
    console.log('========== TOC CLICK DEBUG ==========')

    // Block auto-scroll during user click
    setIsUserScrolling(true)

    console.log('1. Clicked link with ID:', id)

    const element = document.getElementById(id)
    console.log('2. Found element:', element)
    console.log('3. Element tag:', element?.tagName)
    console.log('4. Element text:', element?.textContent?.slice(0, 50))

    if (element) {
      // Calculate scroll position manually for better control
      const navbarHeight = 80
      const additionalOffset = 120

      const rect = element.getBoundingClientRect()
      const currentScrollY = window.scrollY
      const elementTop = rect.top + currentScrollY
      const targetScrollY = elementTop - navbarHeight - additionalOffset

      console.log('5. Current scroll position:', currentScrollY)
      console.log('6. Element top (absolute):', elementTop)
      console.log('7. Target scroll position:', targetScrollY)
      console.log('8. Scroll offset will be:', navbarHeight + additionalOffset, 'px')

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      })

      console.log('9. ✅ Scroll command executed')
      console.log('====================================')

      setActiveId(id)

      if (variant === 'mobile') {
        setIsOpen(false)
      }
    } else {
      console.error('❌ Element NOT found for id:', id)
      console.log('Available IDs on page:', Array.from(document.querySelectorAll('[id]')).map(el => el.id))
      console.log('====================================')
    }

    // Re-enable auto-scroll after 1 second
    setTimeout(() => {
      setIsUserScrolling(false)
    }, 1000)
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
            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b-2 border-gray-200">
              <button
                onClick={handlePrint}
                className="flex flex-col items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors group"
                aria-label="Drukuj artykuł"
              >
                <Printer className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Drukuj</span>
              </button>

              <button
                onClick={handleBookmark}
                className="flex flex-col items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors group"
                aria-label={isBookmarked ? 'Usuń z zakładek' : 'Dodaj do zakładek'}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-emerald-600 text-emerald-600' : 'text-gray-600 group-hover:text-emerald-600'}`} />
                <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Zapisz</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors group"
                aria-label="Udostępnij artykuł"
              >
                <Share2 className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Udostępnij</span>
              </button>
            </div>

            <ul className="space-y-2">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('🖱️ Mobile link clicked:', heading.id, '- Text:', heading.text)
                      handleClick(heading.id)
                    }}
                    className={`block w-full text-left py-2 px-3 rounded transition-colors ${
                      heading.level === 3 ? 'pl-6 text-sm' : ''
                    } ${
                      activeId === heading.id
                        ? 'text-emerald-700 font-semibold bg-emerald-50'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                    }`}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>

            {/* Downloads Section */}
            {downloads && downloads.length > 0 && (
              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-2 px-3 flex items-center gap-2">
                  <span>📥</span>
                  <span>Do pobrania</span>
                </h4>
                <ul className="space-y-2">
                  {downloads.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.url}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        target={item.url.startsWith('http') ? '_blank' : undefined}
                        rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        <span className="text-lg">{item.icon || '📄'}</span>
                        <span className="font-medium">{item.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>
        )}
      </div>
    )
  }

  return (
    <aside className="hidden lg:block space-y-6">
      {/* Action Buttons - sticky, zawsze widoczne */}
      <div className="sticky top-24 bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm z-20">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handlePrint}
            className="flex flex-col items-center gap-1.5 px-3 py-3 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors group"
            aria-label="Drukuj artykuł"
          >
            <Printer className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
            <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Drukuj</span>
          </button>

          <button
            onClick={handleBookmark}
            className="flex flex-col items-center gap-1.5 px-3 py-3 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors group"
            aria-label={isBookmarked ? 'Usuń z zakładek' : 'Dodaj do zakładek'}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-emerald-600 text-emerald-600' : 'text-gray-600 group-hover:text-emerald-600'}`} />
            <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Zapisz</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1.5 px-3 py-3 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors group"
            aria-label="Udostępnij artykuł"
          >
            <Share2 className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
            <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Udostępnij</span>
          </button>
        </div>
      </div>

      {/* TOC - osobny sticky box */}
      <div className="sticky top-[200px] bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        {/* Sticky header z białym tłem */}
        <h3 className="sticky top-0 bg-white z-10 px-6 pt-6 pb-3 border-b-2 border-gray-200 font-bold text-lg text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Spis treści
        </h3>

        {/* Scrollable nav */}
        <nav aria-label="Table of contents" className="max-h-[calc(100vh-400px)] overflow-y-auto px-6 pb-6 pt-4">
          <ul className="space-y-2 text-sm">
            {headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🖱️ Desktop link clicked:', heading.id, '- Text:', heading.text)
                    handleClick(heading.id)
                  }}
                  className={`block w-full text-left py-2 px-3 rounded transition-colors ${
                    heading.level === 3 ? 'pl-6 text-sm' : ''
                  } ${
                    activeId === heading.id
                      ? 'text-emerald-700 font-semibold bg-emerald-50'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>

          {/* Downloads Section */}
          {downloads && downloads.length > 0 && (
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-3 px-3 flex items-center gap-2">
                <span>📥</span>
                <span>Do pobrania</span>
              </h4>
              <ul className="space-y-2">
                {downloads.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.url}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      target={item.url.startsWith('http') ? '_blank' : undefined}
                      rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      <span className="text-lg">{item.icon || '📄'}</span>
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>
    </aside>
  )
}
