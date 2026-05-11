import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oniddekzivbgsayxufka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uaWRkZWt6aXZiZ3NheXh1ZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDMxNTMsImV4cCI6MjA5NDAxOTE1M30.ndGrmZVHobASZE_Xm_PKZmeml7-zeFEze4bU6k3wBMk'

export const supabase = createClient(supabaseUrl, supabaseKey)
