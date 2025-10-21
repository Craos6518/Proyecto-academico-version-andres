Rol:
Director:
- Unhandled Runtime Error
Error: supabaseAdmin is server-only and cannot be used in the browser

Source
lib/supabase-api-client.ts (7:11) @ getAdminClient

   5 |   if (typeof window !== "undefined") {
   6 |     // Prevent accidental use from client-side code
>  7 |     throw new Error("supabaseAdmin is server-only and cannot be used in the browser")
     |           ^
   8 |   }
   9 |   const mod = await import("./supabase-client")
  10 |   return mod.supabaseAdmin

Estudiante:
- No aparecen las materias matriculadas.
- No aparecen las calificaciones 