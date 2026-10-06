const SUPABASE_URL = 'https://myrycsmnbgwxtksmyrub.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cnljc21uYmd3eHRrc215cnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExOTUzNTEsImV4cCI6MjEwNjc3MTM1MX0.eVcA2YEDEuvziVtXBHOxPYr8V-z-EHTZI7ddvQPT3ww'; // Replace with your Anon Key

// We use window.supabase to overwrite the default object rather than using 'const'
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);