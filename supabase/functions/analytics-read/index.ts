import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://dst-system.fr',
  'https://www.dst-system.fr',
]

function getCorsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin)
    || origin.endsWith('.vercel.app')
    || origin === 'http://localhost:3000'
  return {
    'Access-Control-Allow-Origin': allowed
      ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers':
      'authorization, content-type, x-admin-token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}

// Retourne true si la ligne vient de Vercel preview ou localhost
function isInternal(referrer: string | null | undefined): boolean {
  if (!referrer) return false
  return referrer.includes('vercel.app') || referrer.includes('localhost')
}

// Filtre JS post-fetch : préserve les referrer null (trafic direct)
function applyFilter<T extends { referrer?: string | null }>(
  data: T[] | null,
  suppress: boolean
): T[] {
  if (!suppress || !data) return data ?? []
  return data.filter((row) => !isInternal(row.referrer))
}

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Vérification token admin
  const adminToken = req.headers.get('x-admin-token')
  if (adminToken !== Deno.env.get('ANALYTICS_TOKEN')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const url = new URL(req.url)
  const period = url.searchParams.get('period') || '30d'
  const suppressInternal = url.searchParams.get('suppress_internal') === 'true'

  // Date de début
  const now = new Date()
  const periodMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const days = periodMap[period] || 30
  const since = new Date(now.getTime() - days * 86400000).toISOString()

  // 1. Total page views + visiteurs uniques
  //    On fetch referrer pour pouvoir filtrer en JS
  const { data: sessionData } = await supabase
    .from('page_views')
    .select('session_id, referrer')
    .gte('created_at', since)

  const filteredSessionData = applyFilter(sessionData, suppressInternal)
  const totalViews = filteredSessionData.length
  const uniqueVisitors = new Set(
    filteredSessionData.map((s) => s.session_id)
  ).size

  // Pages par session
  const pagesPerSession = uniqueVisitors > 0
    ? Math.round((totalViews / uniqueVisitors) * 10) / 10
    : 0

  // 2. Pages les plus vues
  const { data: allViewsRaw } = await supabase
    .from('page_views')
    .select('page, referrer')
    .gte('created_at', since)

  const allViews = applyFilter(allViewsRaw, suppressInternal)
  const pageCount: Record<string, number> = {}
  allViews.forEach((v) => {
    pageCount[v.page] = (pageCount[v.page] || 0) + 1
  })
  const topPages = Object.entries(pageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }))

  // 3. Sources de trafic
  const { data: refViewsRaw } = await supabase
    .from('page_views')
    .select('referrer')
    .gte('created_at', since)

  const refViews = applyFilter(refViewsRaw, suppressInternal)
  const refCount: Record<string, number> = {}
  refViews.forEach((v) => {
    const ref = v.referrer || 'Direct'
    refCount[ref] = (refCount[ref] || 0) + 1
  })
  const topReferrers = Object.entries(refCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([referrer, views]) => ({ referrer, views }))

  // 4. Devices
  const { data: devViewsRaw } = await supabase
    .from('page_views')
    .select('device, referrer')
    .gte('created_at', since)

  const devViews = applyFilter(devViewsRaw, suppressInternal)
  const devCount: Record<string, number> = {}
  devViews.forEach((v: any) => {
    const d = v.device || 'unknown'
    devCount[d] = (devCount[d] || 0) + 1
  })

  // 5. Navigateurs
  const { data: browserViewsRaw } = await supabase
    .from('page_views')
    .select('browser, referrer')
    .gte('created_at', since)

  const browserViews = applyFilter(browserViewsRaw, suppressInternal)
  const browserCount: Record<string, number> = {}
  browserViews.forEach((v: any) => {
    const b = v.browser || 'Other'
    browserCount[b] = (browserCount[b] || 0) + 1
  })

  // 6. Events (pas de referrer sur page_events, pas de filtrage)
  const { data: events } = await supabase
    .from('page_events')
    .select('event_type, event_label')
    .gte('created_at', since)

  const eventCount: Record<string, number> = {}
  events?.forEach((e: any) => {
    const k = e.event_type + ':' + (e.event_label || '')
    eventCount[k] = (eventCount[k] || 0) + 1
  })
  const topEvents = Object.entries(eventCount)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => {
      const [type, label] = key.split(':')
      return { type, label, count }
    })

  // 7. Durée moyenne
  const { data: durDataRaw } = await supabase
    .from('page_views')
    .select('duration_s, referrer')
    .gte('created_at', since)
    .not('duration_s', 'is', null)

  const durData = applyFilter(durDataRaw, suppressInternal)
  const durations = durData.map((d: any) => d.duration_s)
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
    : 0

  // 8. Vues par jour (sparkline)
  const { data: dailyDataRaw } = await supabase
    .from('page_views')
    .select('created_at, referrer')
    .gte('created_at', since)
    .order('created_at')

  const dailyData = applyFilter(dailyDataRaw, suppressInternal)
  const dailyCount: Record<string, number> = {}
  dailyData.forEach((v: any) => {
    const day = v.created_at.slice(0, 10)
    dailyCount[day] = (dailyCount[day] || 0) + 1
  })
  const dailyViews = Object.entries(dailyCount)
    .map(([date, views]) => ({ date, views }))

  // 9. Dernières visites
  const { data: recentRaw } = await supabase
    .from('page_views')
    .select('page, device, browser, os, referrer, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(suppressInternal ? 50 : 10) // marge pour filtrage JS

  const recentVisits = applyFilter(recentRaw, suppressInternal).slice(0, 10)

  return new Response(
    JSON.stringify({
      period, totalViews, uniqueVisitors, pagesPerSession,
      avgDuration, topPages, topReferrers,
      devices: devCount, browsers: browserCount,
      topEvents, dailyViews,
      recentVisits
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
