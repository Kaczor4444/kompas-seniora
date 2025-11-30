# KOMPAS SENIORA - PLAN IMPLEMENTACJI
**Data:** 30 listopada 2025  
**Launch:** Marzec 2026

## TRACKING SYSTEM (RODO-Safe)
- Prisma: Article, ArticleView, TopArticleCache
- API: /api/track-view, /api/top-articles
- Hook: useTrackView(slug)
- CRON: hourly compute top 10

## CENTRUM POMOCY
- Widget: Najczęściej czytane (top 10)
- Widget: Ostatnio dodane (6 newest)
- Badge: NOWY, Popularny, Reading time

## DEPLOYMENT
- ENV: IP_HASH_SALT, UA_HASH_SALT, CRON_SECRET
- Migrations: npx prisma migrate deploy
- Verify: CRON job in Vercel

## EFFORT
Total: 8-12h
Status: Ready to implement 🚀
