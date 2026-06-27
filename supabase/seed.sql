-- =========================================================================
--  Acopio — Seed de datos de ejemplo
-- =========================================================================
--  Cómo usar:
--  1. Conseguí tu user ID desde el dashboard de Supabase:
--     Authentication > Users > copiá el UUID de tu usuario
--  2. Reemplazá 'TU_USER_ID_AQUI' abajo con ese UUID
--  3. Ejecutá este script en el SQL Editor del dashboard de Supabase
-- =========================================================================

DO $$
DECLARE
  v_user_id      uuid := 'TU_USER_ID_AQUI';
  v_centro_id    uuid;
  v_ahora        timestamptz := now();
BEGIN

  -- -----------------------------------------------------------------------
  -- 1. Crear el centro de acopio de ejemplo
  -- -----------------------------------------------------------------------
  v_centro_id := gen_random_uuid();

  INSERT INTO public.centros_acopio (
    id,
    coordinador_id,
    nombre,
    descripcion,
    direccion,
    ciudad,
    contacto,
    foto_portada,
    created_at
  ) VALUES (
    v_centro_id,
    v_user_id,
    'Acopio de Ejemplo — Parroquia La Candelaria',
    'Somos un centro de acopio comunitario que coordina la recepcion y distribucion de ayuda humanitaria en la Parroquia La Candelaria y zonas aledanas. Trabajamos en conjunto con iglesias, consejos comunales y voluntarios de la zona para hacer llegar la ayuda a quien mas la necesita.

Horario de recepcion: lunes a sabado, 8:00 am a 4:00 pm.

Si queres colaborar como voluntario, escribinos por WhatsApp o acercate en el horario indicado. Toda ayuda suma.',
    'Av. Urdaneta, entre Esq. de Candelaria y Esq. de Romualda, Edif. Parroquial, Planta Baja',
    'Caracas',
    '0412-5550101',
    null,
    v_ahora - interval '30 days'
  );

  -- -----------------------------------------------------------------------
  -- 2. Crear varios posts de ejemplo con fechas espaciadas
  --    (del mas reciente al mas antiguo)
  -- -----------------------------------------------------------------------

  -- Día 0 (hoy)
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'ACTUALIZACION IMPORTANTE: Ya no estamos recibiendo ropa por falta de espacio. Seguimos necesitando con urgencia agua potable y medicamentos basicos. Si podes traer acetaminofen, ibuprofeno o antialergicos seria de gran ayuda.',
    ARRAY['Agua', 'Medicamentos'],
    v_ahora
  );

  -- Día 0 (hace 2 horas)
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'Gracias a todos los que donaron panales esta semana. Logramos cubrir 15 familias con bebes. Ahora mismo necesitamos alimentos no perecederos: arroz, pasta, caraotas, harina de maiz, aceite. Cualquier cantidad sirve.',
    ARRAY['Alimentos no perecederos', 'Pañales'],
    v_ahora - interval '2 hours'
  );

  -- Día -1 (ayer)
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'Hoy recibimos una donacion grande de ropa del Liceo Andres Bello. Vamos a estar clasificando durante el fin de semana. Si queres ayudar como voluntario para organizar y armar paquetes, escribinos. Necesitamos manos.',
    ARRAY['Voluntarios', 'Ropa'],
    v_ahora - interval '1 day'
  );

  -- Día -1 (ayer, tarde)
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'IMPORTANTE: Este sabado 29 no abriremos porque el edificio parroquial estara cerrado por mantenimiento. Retomamos actividades el lunes en horario normal (8am a 4pm). Disculpen las molestias.',
    ARRAY['Otros'],
    v_ahora - interval '1 day 6 hours'
  );

  -- Día -3
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'Buenas noticias: conseguimos un camion que nos va a ayudar con la logistica de distribucion a partir de la semana que viene. Esto nos va a permitir llegar a zonas mas alejadas como Petare y el 23 de Enero. Estamos afinando las rutas.',
    ARRAY['Combustible', 'Voluntarios'],
    v_ahora - interval '3 days'
  );

  -- Día -4
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'Agradecemos enormemente a la Fundacion Manos Unidas por la donacion de 500 kg de alimentos no perecederos que recibimos ayer. Con esto podemos armar al menos 80 bolsas de comida para familias de la parroquia. Seguimos necesitando aceite vegetal y leche en polvo.',
    ARRAY['Alimentos no perecederos'],
    v_ahora - interval '4 days'
  );

  -- Día -6
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'ATENCION: Este miercoles estaremos recibiendo donaciones en horario extendido hasta las 7pm. Tambien pueden traer herramientas en buen estado (martillos, destornilladores, palas) que estamos ayudando a unas familias a reparar sus viviendas. Gracias de antemano.',
    ARRAY['Herramientas', 'Voluntarios'],
    v_ahora - interval '6 days'
  );

  -- Día -8
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'Gracias a la campana de recoleccion de esta semana logramos juntar 300 litros de agua potable que ya fueron distribuidos en el sector La Quinta. Seguimos necesitando mas agua embotellada, especialmente ahora que se acerca la temporada de calor.',
    ARRAY['Agua'],
    v_ahora - interval '8 days'
  );

  -- Día -10
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'Les presentamos a nuestro nuevo equipo de voluntarios fijos: Ana, Carlos, Mariangel y Jose. Ellos van a estar ayudando con la recepcion los martes y jueves. Si queres sumarte como voluntario fijo o puntual, escribinos. Toda ayuda es bienvenida.',
    ARRAY['Voluntarios'],
    v_ahora - interval '10 days'
  );

  -- Día -12
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'URGENTE: Necesitamos medicamentos para una senora de 72 anos con hipertension que no ha conseguido su tratamiento. Especificamente: losartan 50mg y amlodipina 5mg. Si alguien puede colaborar con estos medicamentos o similares por favor contactarnos.',
    ARRAY['Medicamentos'],
    v_ahora - interval '12 days'
  );

  -- Día -15
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'Compartimos algunas fotos de la jornada de entrega del sabado pasado. Logramos atender a 45 familias con bolsas de comida, kits de higiene y medicamentos. Sin ustedes esto no seria posible. Gracias a cada persona que dono y a cada voluntario que estuvo presente.',
    ARRAY['Agua', 'Alimentos no perecederos', 'Medicamentos', 'Higiene personal'],
    v_ahora - interval '15 days'
  );

  -- Día -18
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'Estamos haciendo una campana de recoleccion de kits de higiene personal. Lo ideal es: jabon de bano, champu, pasta dental, cepillo de dientes, toallas sanitarias y papel higienico. Pueden traer los articulos sueltos, nosotros armamos los kits aca.',
    ARRAY['Higiene personal'],
    v_ahora - interval '18 days'
  );

  -- Día -21
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'A partir de hoy tenemos un nuevo numero de contacto exclusivo para WhatsApp: 0412-5550101. Por favor usen este numero para coordinar entregas y consultas. El telefono anterior queda solo para emergencias. Compartan para que llegue a mas gente.',
    ARRAY['Otros'],
    v_ahora - interval '21 days'
  );

  -- Día -25
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at)
  VALUES (gen_random_uuid(), v_centro_id,
    'Buen inicio de semana para todos. Les recordamos nuestros horarios: lunes a sabado de 8am a 4pm. Aceptamos donaciones de alimentos no perecederos, agua, medicinas, ropa en buen estado, articulos de higiene y herramientas. Todo lo que traigan se entrega a familias de la comunidad. Gracias por su solidaridad.',
    ARRAY['Agua', 'Ropa', 'Medicamentos', 'Alimentos no perecederos', 'Higiene personal', 'Herramientas'],
    v_ahora - interval '25 days'
  );

  -- -----------------------------------------------------------------------
  -- 3. Confirmacion
  -- -----------------------------------------------------------------------
  RAISE NOTICE 'Seed completado. Centro ID: %, Coordinador: %. Revisa la app en http://localhost:5173', v_centro_id, v_user_id;

END$$;
