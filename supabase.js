import { createClient } from "@supabase/supabase-js";

// 🔧 Sostituisci con i tuoi dati Supabase
const supabaseUrl = "https://dffxarqdkylliipuqxlr.supabase.co"; // <-- controlla che sia corretto
const supabaseKey = "INSERISCI_LA_TUA_ANON_PUBLIC_KEY_QUI";     // chiave pubblica anon da Supabase

export const supabase = createClient(supabaseUrl, supabaseKey);
