/* ============================================================
   DST-SYSTEM — Tracker analytics maison (Supabase)
   Léger, autonome, sans dépendance externe.
   ============================================================ */
(function () {
  'use strict';

  /* --- Guard : ne rien exécuter sur localhost ou /admin/ --- */
  if (
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.pathname.includes('/admin/')
  ) {
    window.DSTTrack = { event: function () {} };
    return;
  }

  /* --- Config Supabase (hardcodé — indépendant de supabase-config.js) --- */
  const _SB_URL = 'https://uhpvshugtpmxgsztbovi.supabase.co';
  const _SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHZzaHVndHBteGdzenRib3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzY3NjgsImV4cCI6MjA4OTc1Mjc2OH0.5pQGfqzP4YlzciqGJeMbIn14G6D5wr4fy7tINMVp9xE';

  /* --- A. Session ID anonyme --- */
  const sid = sessionStorage.getItem('dst_sid') ||
    (Math.random().toString(36).slice(2) + Date.now().toString(36));
  sessionStorage.setItem('dst_sid', sid);

  /* --- B. Détection device --- */
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  /* --- C. Détection OS --- */
  function detectOS() {
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac OS X/i.test(ua)) return 'macOS';
    if (/iPhone|iPad/i.test(ua)) return 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Other';
  }

  /* --- D. Détection navigateur --- */
  function detectBrowser() {
    const ua = navigator.userAgent;
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Edg/i.test(ua)) return 'Edge';
    if (/Chrome/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua)) return 'Safari';
    return 'Other';
  }

  /* --- E. Lecture UTM --- */
  function getUTM(param) {
    return new URLSearchParams(window.location.search).get(param) || null;
  }

  /* --- F. Page courante --- */
  let page = window.location.pathname;
  if (page === '/') page = '/index.html';

  /* --- G. Référent externe --- */
  let referrer = document.referrer || null;
  if (referrer && referrer.includes('dst-system.fr')) referrer = null;

  /* --- H. Track page view --- */
  const t0 = Date.now();

  const payload = {
    page: page,
    referrer: referrer,
    utm_source:   getUTM('utm_source'),
    utm_medium:   getUTM('utm_medium'),
    utm_campaign: getUTM('utm_campaign'),
    device:    detectDevice(),
    os:        detectOS(),
    browser:   detectBrowser(),
    session_id: sid,
    duration_s: null
  };

  fetch(_SB_URL + '/rest/v1/page_views', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        _SB_KEY,
      'Authorization': 'Bearer ' + _SB_KEY,
      'Prefer':        'return=representation'
    },
    body: JSON.stringify(payload)
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    if (data[0] && data[0].id) {
      sessionStorage.setItem('dst_last_pv_id', data[0].id);
      console.log('[DST Track] pv_id:', data[0].id);
    } else {
      console.warn('[DST Track] pas d\'ID retourné:', data);
    }
  })
  .catch(function (err) {
    console.warn('[DST Track] erreur fetch:', err);
  });

  /* --- I. Track durée de visite --- */
  window.addEventListener('beforeunload', function () {
    const pvId = sessionStorage.getItem('dst_last_pv_id');
    if (!pvId) return;
    const duration = Math.round((Date.now() - t0) / 1000);
    const url = _SB_URL + '/rest/v1/page_views?id=eq.' + pvId;
    navigator.sendBeacon(
      url,
      new Blob(
        [JSON.stringify({ duration_s: duration })],
        { type: 'application/json' }
      )
    );
  });

  /* --- J. DSTTrack exposé globalement --- */
  window.DSTTrack = {
    event: function (type, label) {
      fetch(_SB_URL + '/rest/v1/page_events', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        _SB_KEY,
          'Authorization': 'Bearer ' + _SB_KEY
        },
        body: JSON.stringify({
          event_type:  type,
          event_label: label || null,
          page:        window.location.pathname,
          session_id:  sid
        })
      }).catch(function () {});
    }
  };

})();
