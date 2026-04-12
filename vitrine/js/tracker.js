(function() {
  // Guard : ne pas tracker en local ni dans l'admin
  if (
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.pathname.startsWith('/admin')
  ) {
    window.CRBRTrack = { event: function() {} };
    return;
  }

  console.log('[DST Track] script chargé sur', window.location.pathname);

  var _SB_URL = 'https://uhpvshugtpmxgsztbovi.supabase.co';
  var _SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHZzaHVndHBteGdzenRib3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzY3NjgsImV4cCI6MjA4OTc1Mjc2OH0.5pQGfqzP4YlzciqGJeMbIn14G6D5wr4fy7tINMVp9xE';

  // Session ID anonyme
  var sid = sessionStorage.getItem('dst_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2)
        + Date.now().toString(36);
    sessionStorage.setItem('dst_sid', sid);
  }

  // Détection device
  function detectDevice() {
    var ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  // Détection OS
  function detectOS() {
    var ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac OS X/i.test(ua)) return 'macOS';
    if (/iPhone|iPad/i.test(ua)) return 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Other';
  }

  // Détection navigateur
  function detectBrowser() {
    var ua = navigator.userAgent;
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Edg/i.test(ua)) return 'Edge';
    if (/Chrome/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua)) return 'Safari';
    return 'Other';
  }

  // UTM
  function getUTM(param) {
    return new URLSearchParams(window.location.search)
      .get(param) || null;
  }

  // Page courante
  var page = window.location.pathname || '/';
  if (page === '/') page = '/index.html';

  // Référent (externe uniquement)
  var ref = document.referrer || null;
  if (ref && ref.indexOf('crbr-solution.fr') !== -1) ref = null;

  // Headers Supabase
  var headers = {
    'Content-Type': 'application/json',
    'apikey': _SB_KEY,
    'Authorization': 'Bearer ' + _SB_KEY
  };

  // POST page_view
  fetch(_SB_URL + '/rest/v1/page_views', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      page: page,
      referrer: ref,
      utm_source: getUTM('utm_source'),
      utm_medium: getUTM('utm_medium'),
      utm_campaign: getUTM('utm_campaign'),
      device: detectDevice(),
      os: detectOS(),
      browser: detectBrowser(),
      session_id: sid,
      duration_s: null
    })
  })
  .then(function(r) {
    if (r.ok || r.status === 201) {
      sessionStorage.setItem('dst_last_pv_id_ts',
        Date.now().toString());
      console.log('[DST Track] OK - status:', r.status);
    } else {
      r.text().then(function(t) {
        console.warn('[DST Track] erreur', r.status, t);
      });
    }
  })
  .catch(function(err) {
    console.warn('[DST Track] erreur fetch:', err);
  });

  // Tracking events exposé globalement
  window.CRBRTrack = {
    event: function(type, label) {
      fetch(_SB_URL + '/rest/v1/page_events', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          event_type: type,
          event_label: label || null,
          page: page,
          session_id: sid
        })
      }).catch(function() {});
    }
  };

})();
