Cómo aplicar el esquema y el seed en Supabase / Postgres

1) Usando la consola SQL de Supabase (recomendado)
- Abre tu proyecto en app.supabase.com
- Ve a la sección SQL Editor -> New query
- Copia el contenido de `scripts/03-supabase-schema.sql` y ejecútalo
- Luego copia y ejecuta `scripts/04-supabase-seed.sql`

2) Usando psql (local o conexión remota)
- Si tienes acceso psql al Postgres usado por Supabase (clave de servicio), puedes ejecutar:

PowerShell / cmd:
```powershell
psql "postgresql://<username>:<password>@<host>:5432/<database>?sslmode=require" -f scripts/03-supabase-schema.sql
psql "postgresql://<username>:<password>@<host>:5432/<database>?sslmode=require" -f scripts/04-supabase-seed.sql
```

Reemplaza <username>, <password>, <host>, <database> por los datos de conexión (puedes obtener la connection string desde Supabase -> Settings -> Database -> Connection info).

3) Notas
- Las tablas creadas usan columnas compatibles con `lib/mock-data.ts`.
- Si ya existen tablas con nombres distintos, adapta los nombres en los scripts o en `lib/supabase-api-client.ts`.
