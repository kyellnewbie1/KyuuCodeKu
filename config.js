// config.js
const SUPABASE_URL = 'https://jfrtkrfffugdcwjphszh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcnRrcmZmZnVnZGN3anBoc3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNjQzNjYsImV4cCI6MjEwMDk0MDM2Nn0.MvXk9SxN29hyJOPmDI1HrEQmOBY_ASIaVzlRDaoKgiY';
const SUPABASE_BUCKET = 'snippets'; // nama bucket untuk menyimpan file

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);