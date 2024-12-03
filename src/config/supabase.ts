import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqyvgindwcrmcagoxvqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xeXZnaW5kd2NybWNhZ294dnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MzU5OTQsImV4cCI6MjA0ODMxMTk5NH0.Q0i2y8trDmkeuxcpzanMjqG_XEDOHw8MYHRKuV60dHw';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);