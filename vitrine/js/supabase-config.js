// Configuration Supabase DST System
// Ce fichier est inclus dans les pages qui utilisent Supabase
const SUPABASE_URL = 'https://uhpvshugtpmxgsztbovi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHZzaHVndHBteGdzenRib3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzY3NjgsImV4cCI6MjA4OTc1Mjc2OH0.5pQGfqzP4YlzciqGJeMbIn14G6D5wr4fy7tINMVp9xE';

function sbHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  };
}
