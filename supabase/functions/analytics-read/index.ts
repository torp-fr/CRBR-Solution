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

  // Helper : applique le filtre trafic interne si demandé
  function filtered(q: any): any {
    if (!suppressInternal) return q
    return q
      .not('referrer', 'ilike', '%vercel.app%')
      .not('referrer', 'ilike', '%localhost%')
  }

  // 1. Total page views
  const { count: totalViews } = await filtered(
    supabase.from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since)
  )

  // 2. Visiteurs uniques (session_id distincts)
  const { data: sessions } = await filtered(
    supabase.from('page_views')
      .select('session_id')
      .gte('created_at', since)
  )
  const uniqueVisitors = new Set(
    sessions?.map((s: any) => s.session_id) ?? []
  ).size

  // Pages par session
  const pagesPerSession = uniqueVisitors > 0
    ? Math.round(((totalViews ?? 0) / uniqueVisitors) * 10) / 10
    : 0

  // 3. Pages les plus vues
  const { data: allViews } = await filtered(
    supabase.from('page_views')
      .select('page')
      .gte('created_at', since)
  )
  const pageCount: Record<string, number> = {}
  allViews?.forEach((v: any) => {
    pageCount[v.page] = (pageCount[v.page] || 0) + 1
  })
  const topPages = Object.entries(pageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }))

  // 4. Sources de trafic
  const { data: refViews } = await filtered(
    supabase.from('page_views')
      .select('referrer')
      .gte('created_at', since)
  )
  const refCount: Record<string, number> = {}
  refViews?.forEach((v: any) => {
    const ref = v.referrer || 'Direct'
    refCount[ref] = (refCount[ref] || 0) + 1
  })
  const topReferrers = Object.entries(refCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([referrer, views]) => ({ referrer, views }))

  // 5. Devices
  const { data: devViews } = await filtered(
    supabase.from('page_views')
      .select('device')
      .gte('created_at', since)
  )
  const devCount: Record<string, number> = {}
  devViews?.forEach((v: any) => {
    const d = v.device || 'unknown'
    devCount[d] = (devCount[d] || 0) + 1
  })

  // 6. Navigateurs
  const { data: browserViews } = await filtered(
    supabase.from('page_views')
      .select('browser')
      .gte('created_at', since)
  )
  const browserCount: Record<string, number> = {}
  browserViews?.forEach((v: any) => {
    const b = v.browser || 'Other'
    browserCount[b] = (browserCount[b] || 0) + 1
  })

  // 7. Events
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

  // 8. Durée moyenne
  const { data: durData } = await filtered(
    supabase.from('page_views')
      .select('duration_s')
      .gte('created_at', since)
      .not('duration_s', 'is', null)
  )
  const durations = durData?.map((d: any) => d.duration_s) ?? []
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
    : 0

  // 9. Vues par jour (sparkline)
  const { data: dailyData } = await filtered(
    supabase.from('page_views')
      .select('created_at')
      .gte('created_at', since)
      .order('created_at')
  )
  const dailyCount: Record<string, number> = {}
  dailyData?.forEach((v: any) => {
    const day = v.created_at.slice(0, 10)
    dailyCount[day] = (dailyCount[day] || 0) + 1
  })
  const dailyViews = Object.entries(dailyCount)
    .map(([date, views]) => ({ date, views }))

  // 10. Dernières visites
  const { data: recentVisits } = await filtered(
    supabase.from('page_views')
      .select('page, device, browser, os, referrer, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10)
  )

  return new Response(
    JSON.stringify({
      period, totalViews, uniqueVisitors, pagesPerSession,
      avgDuration, topPages, topReferrers,
      devices: devCount, browsers: browserCount,
      topEvents, dailyViews,
      recentVisits: recentVisits ?? []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
