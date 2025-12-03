'use client'

import { useEffect } from 'react'
import { useReadingHistory } from '@/hooks/useReadingHistory'

interface ArticleTrackerProps {
  slug: string
  sectionId: string
  title: string
  category: string
}

export default function ArticleTracker({
  slug,
  sectionId,
  title,
  category,
}: ArticleTrackerProps) {
  const { addToHistory } = useReadingHistory()

  useEffect(() => {
    addToHistory({
      slug,
      sectionId,
      title,
      category,
    })
  }, [slug, sectionId, title, category, addToHistory])

  // This component renders nothing, it only tracks reading history
  return null
}
