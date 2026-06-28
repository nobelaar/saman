#!/bin/bash
# Crear usuarios de seed para Acopio
# Reemplazá TU_SERVICE_ROLE_KEY con tu clave real (Project Settings > API > service_role)
# Luego ejecutá: bash supabase/seed-users.sh

KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWpjd250eWpkaXp2dmVud21wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU4MTY3MSwiZXhwIjoyMDk4MTU3NjcxfQ.FaVyZN39Kw7GURx725rzoBFSMw4zGalx_ZOBH8pZ8Hw"
URL="https://kfijcwntyjdizvvenwmp.supabase.co"

for email in \
  maria.lopez@gmail.com \
  carlos.martinez@gmail.com \
  diana.rodriguez@gmail.com \
  jose.hernandez@gmail.com \
  ana.gonzalez@gmail.com \
  pedro.ramirez@gmail.com \
  laura.cedeno@gmail.com; do
  echo "Creando $email ..."
  curl -s -X POST "$URL/auth/v1/admin/users" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"seed123456\",\"email_confirm\":true}" |
    python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  OK: {d[\"id\"]}')"
done

echo ""
echo "Ahora copiá los UUIDs de arriba y reemplazalos en supabase/seed.sql"
echo "Despues ejecutá el SQL en el dashboard de Supabase."
