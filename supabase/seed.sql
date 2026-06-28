-- =========================================================================
--  Acopio — Seed SQL (ejecutar en SQL Editor DESPUÉS de crear los usuarios)
-- =========================================================================
--  PASO 1: Creá los usuarios desde la terminal (copiá y pegalo):
--
--   npx supabase functions new noop
--
--  O mejor, crealos con curl. Reemplazá YOUR_SERVICE_ROLE_KEY:
--
--   for email in maria.lopez@gmail.com carlos.martinez@gmail.com diana.rodriguez@gmail.com jose.hernandez@gmail.com ana.gonzalez@gmail.com pedro.ramirez@gmail.com laura.cedeno@gmail.com; do
--     curl -X POST 'https://kfijcwntyjdizvvenwmp.supabase.co/auth/v1/admin/users' \
--       -H "apikey: TU_SERVICE_ROLE_KEY" \
--       -H "Authorization: Bearer TU_SERVICE_ROLE_KEY" \
--       -H "Content-Type: application/json" \
--       -d "{\"email\":\"$email\",\"password\":\"seed123456\",\"email_confirm\":true}"
--   done
--
--  PASO 2: Buscá los UUIDs generados en Authentication > Users y
--          reemplazalos abajo. Después ejecutá este script.
-- =========================================================================

DO $$
DECLARE
  -- REEMPLAZÁ estos UUIDs con los IDs reales de los usuarios creados
  u_maria    uuid := 'db70aba4-c470-4f7e-9c95-7d0d003a4073';
  u_carlos   uuid := 'a93fbc05-43ed-4a7a-aaf7-cdc10e6fdb95';
  u_diana    uuid := '54d7e258-f3e2-4996-8513-8ba7157c9b58';
  u_jose     uuid := '11067aac-157b-4a34-96ba-0fa91ce51a81';
  u_ana      uuid := 'f5642a47-4f1d-4005-84ce-2e15488c8ca9';
  u_pedro    uuid := '07af58db-8a99-486d-9cb8-bd4fa9343199';
  u_laura    uuid := '5ba3afd1-b410-4ae4-b647-175b84f7df63';

  c_caracas  uuid := gen_random_uuid();
  c_valencia uuid := gen_random_uuid();
  c_maracaibo uuid := gen_random_uuid();

  p_id uuid;
  co_id uuid;

  v_ahora timestamptz := now();
BEGIN

  -- =======================================================================
  -- Centros de acopio
  -- =======================================================================

  INSERT INTO public.centros_acopio (id, coordinador_id, nombre, descripcion, direccion, ciudad, contacto, created_at)
  VALUES (c_caracas, u_maria,
    'Acopio La Candelaria',
    'Centro de acopio comunitario en el corazon de Caracas. Recibimos donaciones de lunes a sabado de 8am a 4pm. Coordinamos con 12 consejos comunales de la parroquia para distribuir la ayuda.',
    'Av. Urdaneta, entre Esq. de Candelaria y Esq. de Romualda, Edif. Parroquial, PB',
    'Caracas',
    '0412-5550101',
    v_ahora - interval '45 days');

  INSERT INTO public.centros_acopio (id, coordinador_id, nombre, descripcion, direccion, ciudad, contacto, created_at)
  VALUES (c_valencia, u_carlos,
    'Acopio Valencia Norte — Grupo Scout',
    'Operamos desde la sede del Grupo Scout Valencia Norte. Contamos con espacio de bodega y un equipo de 25 voluntarios fijos. Jornadas de entrega todos los sabados.',
    'Av. Bolivar Norte, CC Las Chimeneas, Local 3, Naguanagua',
    'Valencia',
    '0414-3332020',
    v_ahora - interval '30 days');

  INSERT INTO public.centros_acopio (id, coordinador_id, nombre, descripcion, direccion, ciudad, contacto, created_at)
  VALUES (c_maracaibo, u_diana,
    'Acopio Maracaibo — Parroquia Santa Lucia',
    'Centro de acopio en el oeste de Maracaibo. Trabajamos con la red de iglesias de la zona. Necesitamos especialmente medicamentos y agua.',
    'Calle 72 con Av. 14, Parroquia Santa Lucia, Casa Parroquial',
    'Maracaibo',
    '0261-7773344',
    v_ahora - interval '20 days');

  -- =======================================================================
  -- Posts de centros
  -- =======================================================================

  -- CARACAS
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_caracas,
    'URGENTE: Necesitamos agua potable para distribuir manana. Tenemos 30 familias en lista de espera y solo alcanzo para 12. Si alguien puede traer botellones o bidones de agua hoy antes de las 4pm, seria de enorme ayuda.',
    ARRAY['Agua'], v_ahora - interval '2 hours', u_maria);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_caracas,
    'GRACIAS a todos los que donaron medicamentos la semana pasada. Logramos cubrir a 18 adultos mayores con sus tratamientos. Ahora necesitamos: acetaminofen infantil, ibuprofeno, antialergicos y cremas para quemaduras.',
    ARRAY['Medicamentos'], v_ahora - interval '1 day', u_maria);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_caracas,
    'Este sabado tendremos jornada especial de entrega de ropa y alimentos en la cancha de La Candelaria de 9am a 1pm. Necesitamos voluntarios para ayudar a organizar.',
    ARRAY['Voluntarios', 'Ropa', 'Alimentos no perecederos'], v_ahora - interval '3 days', u_maria);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_caracas,
    'Recibimos una donacion de 200 panales de la Fundacion Manos Unidas. Ya empezamos a distribuirlos entre madres de la comunidad. Si conoces a alguien que necesite, que se acerque con su cedula del bebe.',
    ARRAY['Pañales'], v_ahora - interval '5 days', u_maria);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_caracas,
    'Actualizacion: ampliamos horario de recepcion. Ahora de lunes a sabado de 7am a 5pm. Tambien aceptamos herramientas en buen estado y articulos de higiene personal.',
    ARRAY['Herramientas', 'Higiene personal'], v_ahora - interval '8 days', u_maria);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_caracas,
    'Fin de semana exitoso. 47 familias recibieron bolsas de comida y kits de higiene. Sin ustedes esto no seria posible. Vamos por mas.',
    ARRAY['Alimentos no perecederos', 'Higiene personal'], v_ahora - interval '12 days', u_maria);

  -- VALENCIA
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_valencia,
    'Manana jornada de recoleccion en el CC Las Chimeneas de 10am a 3pm. Traigan alimentos no perecederos, ropa en buen estado y medicinas. Estacionamiento nivel 1.',
    ARRAY['Alimentos no perecederos', 'Ropa', 'Medicamentos'], v_ahora - interval '1 day', u_carlos);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_valencia,
    'Necesitamos combustible para el camion de distribucion. Este viernes tenemos pautada una entrega en tres comunidades alejadas y no tenemos como llegar.',
    ARRAY['Combustible'], v_ahora - interval '4 days', u_carlos);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_valencia,
    'Nuestros voluntarios armaron 65 bolsas de comida. Aun nos falta arroz, harina de maiz y aceite para completar otras 20.',
    ARRAY['Alimentos no perecederos', 'Voluntarios'], v_ahora - interval '6 days', u_carlos);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_valencia,
    'ATENCION: este miercoles NO abriremos por inventario. Retomamos el jueves en horario normal.',
    ARRAY['Otros'], v_ahora - interval '9 days', u_carlos);

  -- MARACAIBO
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_maracaibo,
    'URGENTE: se nos acabo el agua embotellada. Con el calor en Maracaibo la demanda se triplico. Si alguien puede donar botellones, por favor acerquense.',
    ARRAY['Agua'], v_ahora - interval '6 hours', u_diana);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_maracaibo,
    'Donacion enorme de ropa y zapatos del Colegio Gonzaga. Estamos clasificando por tallas. Si necesitas ropa para ninos o adultos, acercate de 9am a 3pm.',
    ARRAY['Ropa'], v_ahora - interval '2 days', u_diana);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_maracaibo,
    'Conseguimos un proveedor que dona 100 kg de alimentos al mes. Esto nos da mas estabilidad. Seguimos necesitando medicinas e higiene personal.',
    ARRAY['Alimentos no perecederos', 'Medicamentos', 'Higiene personal'], v_ahora - interval '7 days', u_diana);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), c_maracaibo,
    'Llamado a voluntarios: necesitamos gente para logistica los viernes. Si tenes carro o camioneta, mejor. Escribinos al 0261-7773344.',
    ARRAY['Voluntarios', 'Combustible'], v_ahora - interval '10 days', u_diana);

  -- COMUNITARIOS (sin centro)
  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), null,
    'Hola comunidad. Soy estudiante de medicina organizando recolecta de medicinas vencidas para desecho correcto. Si tenes en casa no las botes, escribime.',
    ARRAY['Medicamentos', 'Otros'], v_ahora - interval '1 day', u_jose);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), null,
    'Alguien sabe de algun centro recibiendo ropa de bebe en Caracas? Tengo bolsas en buen estado para donar.',
    ARRAY['Ropa', 'Pañales'], v_ahora - interval '3 days', u_ana);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), null,
    'Manana voy a La Candelaria a dejar agua y alimentos. Si alguien de la zona quiere coordinar para ir juntos, me avisa.',
    ARRAY['Agua', 'Alimentos no perecederos'], v_ahora - interval '12 hours', u_pedro);

  INSERT INTO public.posts (id, centro_id, contenido, necesidades, created_at, user_id)
  VALUES (gen_random_uuid(), null,
    'Reflexion: a veces pensamos que uno solo no hace diferencia. Pero si cada uno dona un kilo de arroz o un panal, entre todos logramos un monton. Animate.',
    ARRAY['Otros'], v_ahora - interval '5 days', u_laura);

  -- =======================================================================
  -- Comentarios
  -- =======================================================================

  DECLARE
    p_ids uuid[];
  BEGIN
    SELECT array_agg(id ORDER BY created_at DESC) INTO p_ids FROM public.posts;

    -- Comentarios en posts de Caracas (indices 0-5)
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[1], u_carlos, 'Yo puedo llevar dos bidones de 5 litros manana. A que hora abren?', v_ahora - interval '1 hour');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[1], u_ana, 'Tengo botellones. Paso tipo 10am.', v_ahora - interval '30 minutes');

    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[2], u_jose, 'Que bueno. Tengo acetaminofen infantil, paso manana.', v_ahora - interval '5 hours');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[2], u_laura, 'Mi mama necesita antialergicos. Tienen aun?', v_ahora - interval '3 hours');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[2], u_maria, 'Laura si, todavia nos quedan. Acercate de 8 a 4!', v_ahora - interval '2 hours');

    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[3], u_pedro, 'Me anoto de voluntario. A que hora llego?', v_ahora - interval '1 day');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[3], u_diana, 'Desde Maracaibo les mando un abrazo. Sigan asi.', v_ahora - interval '20 hours');

    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[4], u_ana, 'MI HERMANA NECESITA PAÑALES TALLA M. TIENEN?', v_ahora - interval '2 days');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[4], u_maria, 'Ana si tenemos! Acercate con cedula del bebe.', v_ahora - interval '2 days');

    -- Valencia (indices 7-10)
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[7], u_ana, 'Voy a llevar ropa y latas de atun. Nos vemos alla.', v_ahora - interval '5 hours');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[7], u_jose, 'A que hora es? En la manana o tarde?', v_ahora - interval '4 hours');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[7], u_carlos, 'Jose, de 10am a 3pm. Te esperamos.', v_ahora - interval '3 hours');

    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[8], u_pedro, 'Tengo un contacto que puede ayudar. Te paso el numero.', v_ahora - interval '2 days');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[8], u_maria, 'En Caracas tambien necesitamos. Si conseguis dato compartan.', v_ahora - interval '1 day');

    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[9], u_laura, 'Que buen trabajo. Puedo donar dos kilos de arroz manana.', v_ahora - interval '3 days');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[9], u_diana, 'Excelente labor. Desde Maracaibo los felicito.', v_ahora - interval '2 days');

    -- Maracaibo (indices 11-14)
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[11], u_pedro, 'Tengo un botellon de 20 litros. Donde los dejo?', v_ahora - interval '3 hours');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[11], u_diana, 'Pedro, en Parroquia Santa Lucia, C 72 con Av 14. Gracias!', v_ahora - interval '2 hours');

    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[12], u_ana, 'Tienen ropa para ninos de 4 anos?', v_ahora - interval '1 day');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[12], u_jose, 'Necesito zapatos talla 42. Tienen?', v_ahora - interval '20 hours');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[12], u_diana, 'Ana y Jose, vengan que estamos clasificando justo esas tallas.', v_ahora - interval '18 hours');

    -- Comunitarios (indices 15-18)
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[15], u_ana, 'Buena iniciativa. Tengo cajas de medicinas vencidas. Como hago?', v_ahora - interval '5 hours');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[15], u_laura, 'Me sumo. Tambien soy estudiante de medicina.', v_ahora - interval '3 hours');

    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[16], u_maria, 'Ana, en La Candelaria recibimos ropa de bebe. Acercate de 8 a 4.', v_ahora - interval '1 day');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[16], u_carlos, 'En Valencia Norte tambien recibimos. Escribime.', v_ahora - interval '20 hours');

    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[18], u_pedro, 'Totalmente de acuerdo. Empece donando un kilo de arroz y ahora soy voluntario. Todo suma.', v_ahora - interval '2 days');
    INSERT INTO public.post_comentario (id, post_id, user_id, contenido, created_at) VALUES (gen_random_uuid(), p_ids[18], u_jose, 'Que bonito mensaje. Gracias por recordarlo.', v_ahora - interval '1 day');
  END;

  -- =======================================================================
  -- Utiles en posts
  -- =======================================================================
  FOR p_id IN SELECT id FROM public.posts LIMIT 18 LOOP
    INSERT INTO public.post_util (id, post_id, user_id, created_at)
    VALUES
      (gen_random_uuid(), p_id, u_ana,   v_ahora - interval '1 day'),
      (gen_random_uuid(), p_id, u_jose,  v_ahora - interval '2 days'),
      (gen_random_uuid(), p_id, u_laura, v_ahora - interval '3 days')
    ON CONFLICT (post_id, user_id) DO NOTHING;
  END LOOP;

  -- =======================================================================
  -- Utiles en comentarios
  -- =======================================================================
  FOR co_id IN SELECT id FROM public.post_comentario WHERE user_id != u_maria AND user_id != u_carlos AND user_id != u_diana LIMIT 12 LOOP
    INSERT INTO public.comentario_util (id, comentario_id, user_id, created_at)
    VALUES (gen_random_uuid(), co_id, u_maria, v_ahora - interval '1 day')
    ON CONFLICT (comentario_id, user_id) DO NOTHING;
  END LOOP;

  FOR co_id IN SELECT id FROM public.post_comentario WHERE user_id != u_pedro AND user_id != u_ana LIMIT 8 LOOP
    INSERT INTO public.comentario_util (id, comentario_id, user_id, created_at)
    VALUES (gen_random_uuid(), co_id, u_pedro, v_ahora - interval '2 days')
    ON CONFLICT (comentario_id, user_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Seed listo. 3 centros, 18 posts, 30+ comentarios, likes incluidos.';
END$$;
