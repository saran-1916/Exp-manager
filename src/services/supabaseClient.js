import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hurfkheambsrlbbxyhhj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cmZraGVhbWJzcmxiYnh5aGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzY5MTUsImV4cCI6MjA4MzExMjkxNX0.Ia5cgI89ZHDjw_nWywCudLEan2ApXK1magRvsFAeBNc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);