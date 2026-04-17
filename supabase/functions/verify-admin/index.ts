import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://crbr-solution.fr',
  'https://www.crbr-solution.fr',
  'https://dst-system.fr',
  'https://www.dst-system.fr',
]

function getCorsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin)
    || origin.endsWith('.vercel.app')
    || origin === 'http://localhost:3000'
    || origin === 'http://127.0.0.1:3000'

  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed',
      { status: 405, headers: corsHeaders })
  }

  try {
    const { passwordHash } = await req.json()

    if (!passwordHash || typeof passwordHash !== 'string') {
      return new Response(
        JSON.stringify({ success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabase
      .from('admin_config')
      .select('password_hash')
      .single()

    if (error || !data) {
      return new Response(
        JSON.stringify({ success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const match = data.password_hash === passwordHash

    return new Response(
      JSON.stringify({ success: match }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (e) {
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
