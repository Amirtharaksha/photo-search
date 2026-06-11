import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://mmxrzecfdoxjcyysqaxz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1teHJ6ZWNmZG94amN5eXNxYXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDczNzksImV4cCI6MjA5NjM4MzM3OX0.6tndOC0nWMr9vQZtKUpfl4oAB69KqXRto2Bf4QXkr_g',
  {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)