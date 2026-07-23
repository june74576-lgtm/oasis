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
//    OJO: "Public bucket" solo habilita LEER archivos. Para poder SUBIR,
//    hace falta agregar políticas aparte. Andá a "SQL Editor" → "New query"
//    → pegá esto y Run:
//
//    create policy "acceso publico archivos - leer"
//    on storage.objects for select
//    using ( bucket_id = 'archivos' );
//
//    create policy "acceso publico archivos - subir"
//    on storage.objects for insert
//    with check ( bucket_id = 'archivos' );
//
//    create policy "acceso publico archivos - borrar"
//    on storage.objects for delete
//    using ( bucket_id = 'archivos' );
//
// 5. Andá a "Project Settings" (ícono de tuerca abajo) → "Data API" →
//    copiá la "Project URL" y pegala en SUPABASE_URL más abajo
//
// 6. En la misma pantalla (o en "API Keys") copiá la "anon public" key
//    y pegala en SUPABASE_ANON_KEY
//
// Nota sobre seguridad: estas reglas son abiertas (cualquiera puede
// leer/subir/borrar) porque no hay backend real verificando quién sos.
// El botón de borrar solo se MUESTRA si sos el que subió el archivo,
// pero alguien con conocimientos técnicos podría saltarse eso. Para
// este proyecto (compañeros de curso) es un riesgo aceptable.

const SUPABASE_URL = "https://mupdiqlibvhvckcoqprp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cGRpcWxpYnZodmNrY29xcHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDQ4NDksImV4cCI6MjEwMDMyMDg0OX0.KI1OdPh9dXKk2DGyNwb8Cfmu1usClbzbx8Zoy1X4V8A";

// OJO: la librería del CDN se llama a sí misma "supabase" en window.
// Por eso a NUESTRO cliente (ya conectado a tu proyecto) lo llamamos
// distinto: supabaseClient. Todo script.js usa ese nombre, no "supabase"
// a secas, para no pisarse con la librería.

let supabaseClient = null;

if (!SUPABASE_URL.includes("TU_PROYECTO") && window.supabase && typeof window.supabase.createClient === "function") {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("[Oasis] Supabase no está configurado todavía — revisá data/supabase-config.js");
}