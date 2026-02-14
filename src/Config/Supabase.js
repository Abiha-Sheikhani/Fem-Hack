import  {createClient} from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = "https://tnsixgimsblvbzdyfleh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuc2l4Z2ltc2JsdmJ6ZHlmbGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzQyODUsImV4cCI6MjA4NjY1MDI4NX0.Nl3_ZwAQb8wlltVwT3evzMnAX8-ko2rQB5TG1D0fizQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
