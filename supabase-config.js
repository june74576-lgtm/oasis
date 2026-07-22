// Reemplazá estos dos valores con los de tu proyecto de Supabase.
//
// Pasos para crear el proyecto (gratis, SIN tarjeta):
// 1. supabase.com → Start your project → creá cuenta (con GitHub es más rápido)
// 2. "New project" → nombre "oasis" → contraseña de base de datos (guardala,
//    no la vas a necesitar en el código, pero por las dudas) → región más
//    cercana (ej. East US) → Create new project (tarda ~1-2 min en armarse)
//
// 3. Andá a "SQL Editor" (ícono de la izquierda) → "New query" → pegá esto
//    completo y le das Run:
//
//    create table archivos (
//      id bigint generated always as identity primary key,
//      materia text not null,
//      curso text not null,
//      nombre text not null,
//      storage_path text not null,
//      subido_por_id bigint,
//      subido_por_nombre text,
//      fecha timestamptz default now()
//    );
//
//    alter table archivos enable row level security;
//
//    create policy "cualquiera puede leer" on archivos
//      for select using (true);
//
//    create policy "cualquiera puede subir" on archivos
//      for insert with check (true);
//
//    create policy "cualquiera puede borrar" on archivos
//      for delete using (true);
//
// 4. Andá a "Storage" (ícono de la izquierda) → "New bucket" → nombre
//    "archivos" → activá "Public bucket" → Create bucket
//
// 5. Andá a "Project Settings" (ícono de tuerca abajo) → "Data API" →
//    copiá la "Project URL" y pegala en SUPABASE_URL más abajo
//
// 6. En la misma pantalla (o en "API Keys") copiá la "anon public" key
//    y pegala en SUPABASE_ANON_KEY
//
// Nota sobre seguridad: igual que con el login, estas reglas son abiertas
// (cualquiera puede leer/subir/borrar) porque no hay backend real atrás
// verificando quién sos. El botón de borrar solo se MUESTRA si sos el
// que subió el archivo, pero alguien con conocimientos técnicos podría
// saltarse eso. Para este proyecto (un curso de compañeros) es un riesgo
// aceptable — si algún día hay problemas de gente borrando archivos ajenos,
// avisame y cerramos la política de "delete" para que nadie pueda.

const SUPABASE_URL = "https://mupdiqlibvhvckcoqprp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cGRpcWxpYnZodmNrY29xcHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDQ4NDksImV4cCI6MjEwMDMyMDg0OX0.KI1OdPh9dXKk2DGyNwb8Cfmu1usClbzbx8Zoy1X4V8A";

let supabase = null;

if (!SUPABASE_URL.includes("TU_PROYECTO") && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Supabase no está configurado todavía — completá supabase-config.js");
}