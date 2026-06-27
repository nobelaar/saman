# PRD — Acopio

## 1. Resumen ejecutivo

**Acopio** es una plataforma web de respuesta rápida para registrar, trazar y
actualizar centros de acopio de ayuda humanitaria en Venezuela, activada en el
contexto del terremoto de 2025. Su objetivo es conectar a la ciudadanía que
quiere ayudar con los centros que operan en el terreno, dándoles visibilidad en
tiempo real sobre qué necesitan y dónde están.

El producto se diseñó bajo tres premias: **funcionar ya** (sin overengineering),
**ser público por defecto** (cualquiera puede ver sin barreras) y **mobile
first** (la mayoría accederá desde el teléfono). La trilogía de UX es: familiar
en consumo (estilo Instagram feed), simple en publicación (form corto + posteo
de necesidades).

## 2. Problema

En situaciones de emergencia como un terremoto, la información sobre centros de
acopio es dispersa, desactualizada y descoordinada:

- **Quién dona no sabe a dónde ir ni qué llevar** — los requerimientos cambian
  hora a hora.
- **Quién coordina no tiene canal propio** para publicar necesidades masivamente.
- **La información se vuelve stale en minutos** — un centro que esta mañana
  necesitaba agua ahora necesita pañales.
- **No hay trazabilidad** — no se sabe cuándo se actualizó por última vez cada
  centro.

El resultado: donaciones mal dirigidas, centros saturados de lo que no
necesitan, y centros vacíos de lo que sí necesitan.

## 3. Usuarios objetivo

| Usuario | Descripción | Necesidad |
|---------|-------------|-----------|
| **Donante / ciudadano** (lectura) | Cualquier persona con smartphone o computadora. Sin registro. | Encontrar centros cercanos y saber qué necesitan ahora. |
| **Coordinador de centro** (escritura) | Persona o voluntario a cargo de un centro de acopio. Se registra y publica. | Tener un canal propio y en tiempo real para comunicar necesidades. |

## 4. User stories

### US-01 — Descubrir centros cercanos
**Como** ciudadano sin login,
**quiero** ver una grilla de centros de acopio ordenados por distancia a mi
ubicación,
**para** decidir a cuál llevar mi ayuda.

### US-02 — Previsualizar necesidades desde la grilla
**Como** ciudadano,
**quiero** ver en cada card el preview de la última necesidad publicada,
**para** no tener que entrar a cada centro para saber qué necesitan.

### US-03 — Ver el perfil de un centro
**Como** ciudadano,
**quiero** ver nombre, descripción, dirección, contacto y un feed de
actualizaciones del centro,
**para** entender el contexto y decidir mi donación.

### US-04 — Navegar al centro
**Como** ciudadano,
**quiero** un botón directo a Google Maps desde el perfil del centro,
**para** llegar físicamente sin fricción.

### US-05 — Recibir actualizaciones en tiempo real
**Como** ciudadano viendo un perfil de centro,
**quiero** que las nuevas necesidades aparezcan sin recargar,
**para** estar al día mientras decido o mientras viajo.

### US-06 — Crearme una cuenta
**Como** coordinador potencial,
**quiero** registrarme con email y password,
**para** poder dar de alta mi centro.

### US-07 — Registrar mi centro de acopio
**Como** usuario logueado,
**quiero** completar un formulario con datos de mi centro y que la dirección se
geocodifique automáticamente,
**para** que aparezca en el mapa público sin esfuerzo manual.

### US-08 — Publicar una actualización de necesidades
**Como** coordinador,
**quiero** postear texto, opcionalmente foto, y una lista de necesidades (agua,
ropa, medicamentos, pañales…),
**para** que los donantes lo vean al instante.

### US-09 — Editar los datos de mi centro
**Como** coordinador,
**quiero** editar nombre, descripción, dirección, contacto y foto de portada de
mi centro,
**para** mantener la información correcta.

## 5. Criterios de aceptación

### Home pública (US-01, US-02)
- **AC-1.1** Al entrar, se solicita permiso de geolocalización. Si el usuario
  rechaza, se muestra igual la grilla ordenada por `ciudad` (fallback: sin
  distancia o "distancia no disponible").
- **AC-1.2** Cada card cuadrada muestra: foto de portada (o placeholder),
  nombre del centro, ciudad, distancia aproximada en km si hay geolocalización,
  y preview truncado de la última necesidad del campo `contenido` del último
  post.
- **AC-1.3** El orden es ascendente por distancia calculada vía PostGIS
  (`centro.lat`, `centro.lng` vs user lat/lng).
- **AC-1.4** La grilla es responsive: 2 columnas en mobile, 3-4 en desktop.
- **AC-1.5** Funciona sin login.

### Perfil del centro (US-03, US-04, US-05)
- **AC-2.1** Muestra todos los campos del centro: nombre, descripción,
  dirección, ciudad, contacto, foto.
- **AC-2.2** Botón "Cómo llegar" abre Google Maps en una nueva pestaña con las
  coordenadas del centro.
- **AC-2.3** Feed de posts ordenado por `created_at DESC`.
- **AC-2.4** Suscripción Supabase Realtime al canal `posts` filtrado por
  `centro_id`; nuevos posts se prependean al feed sin recarga.
- **AC-2.5** Cada post renderiza: contenido, foto (si existe), y chips/tags de
  `necesidades[]`.

### Auth y registro (US-06, US-07, US-09)
- **AC-3.1** Registro y login con email/password nativo de Supabase Auth.
- **AC-3.2** Formulario de registro de centro valida: nombre (no vacío),
  dirección (no vacío), ciudad (no vacío), lat/lng (autocompletados vía
  Nominatim).
- **AC-3.3** Si Nominatim no resuelve la dirección, se permite entrada manual de
  lat/lng (toggle "Ingresar coordenadas manualmente").
- **AC-3.4** `coordinador_id` se setea automáticamente a `auth.uid()`, no
  editable.
- **AC-3.5** El coordinador solo puede editar centros donde `coordinador_id =
  auth.uid()` (forzado por RLS).

### Posteo (US-08)
- **AC-4.1** Formulario de post: contenido (requerido, textarea), foto
  (opcional, file input), necesidades (multi-select de categorías predefinidas +
  input de texto libre para nuevas).
- **AC-4.2** La foto se sube a Supabase Storage bucket `centros-fotos` y se
  guarda la URL pública en `posts.foto_url`.
- **AC-4.3** En submit exitoso, el post aparece en el feed del centro en tiempo
  real (via Realtime) tanto para el coordinador como para visitantes.

## 6. Métricas de éxito

| Métrica | Objetivo primera semana | Objetivo primer mes |
|---------|------------------------|--------------------|
| Centros registrados | 50+ | 500+ |
| Posts publicados | 200+ | 5.000+ |
| Visitantes únicos (sesiones) | 10.000 | 200.000 |
| Centros con actualización en últimas 24h | 60% | 80% |
| Tasa de rebote en home | <40% | <25% |
| Share de acceso mobile | >70% | >75% |
| Tiempo desde registro de centro a primer post | <10 min mediana | <5 min mediana |
| Latencia P95 home → cards renderizadas | <2s | <1.5s |