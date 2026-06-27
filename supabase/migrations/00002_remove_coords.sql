-- 00002_remove_coords.sql
-- Elimina columnas de coordenadas y la función RPC de distancia
-- Aplicar con: supabase db push

drop function if exists public.centros_cercanos;

drop index if exists idx_centros_geom;

alter table public.centros_acopio
  drop column if exists geom,
  drop column if exists lat,
  drop column if exists lng;
