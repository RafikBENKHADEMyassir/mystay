-- =============================================================================
-- MyStay Platform Seed Data
-- =============================================================================
-- This file seeds the database with demo data for development and testing.
-- Run with: npm run db:seed (or psql -f backend/db/seed.sql)
--
-- Demo accounts are documented in demo.md at the project root.
-- =============================================================================

-- =============================================================================
-- PLATFORM ADMINISTRATORS
-- =============================================================================
-- Password for all platform admins: admin123
INSERT INTO platform_admins (id, email, password_hash, display_name)
VALUES 
  (
    'PA-0001',
    'admin@mystay.com',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ==',
    'Platform Admin'
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  display_name = EXCLUDED.display_name;

-- =============================================================================
-- HOTELS
-- =============================================================================
INSERT INTO hotels (
  id, name, description, logo_url, cover_image_url, 
  primary_color, secondary_color, address, city, country, 
  phone, email, website, timezone, currency, star_rating, 
  amenities, is_active
)
VALUES 
  -- Four Seasons Paris (Main demo hotel)
  (
    'H-FOURSEASONS',
    'Four Seasons Hotel George V',
    'An iconic palace hotel in the heart of Paris, steps from the Champs-Élysées. Experience legendary service, Michelin-starred dining, and timeless Parisian elegance.',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&h=1080&fit=crop',
    '#1a1a2e',
    '#c9a962',
    '31 Avenue George V',
    'Paris',
    'France',
    '+33 1 49 52 70 00',
    'reservations.paris@fourseasons.com',
    'https://www.fourseasons.com/paris',
    'Europe/Paris',
    'EUR',
    5,
    ARRAY['spa', 'restaurant', 'concierge', 'room-service', 'valet', 'fitness', 'pool'],
    TRUE
  ),
  -- Four Seasons Geneva
  (
    'H-FSGENEVA',
    'Four Seasons Hotel des Bergues',
    'A refined lakeside sanctuary in the heart of Geneva, offering spectacular views of the Alps and Lake Geneva.',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop',
    '#0d1b2a',
    '#d4af37',
    '33 Quai des Bergues',
    'Geneva',
    'Switzerland',
    '+41 22 908 70 00',
    'reservations.geneva@fourseasons.com',
    'https://www.fourseasons.com/geneva',
    'Europe/Zurich',
    'CHF',
    5,
    ARRAY['spa', 'restaurant', 'concierge', 'room-service', 'lakefront', 'fitness'],
    TRUE
  ),
  -- Bulgari Milan
  (
    'H-BULGARI',
    'Bulgari Hotel Milano',
    'Contemporary luxury in a historic botanical garden setting, blending Italian craftsmanship with modern design in fashionable Milan.',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920&h=1080&fit=crop',
    '#2c2c2c',
    '#b8860b',
    'Via Privata Fratelli Gabba 7b',
    'Milan',
    'Italy',
    '+39 02 8058 051',
    'milano@bulgarihotels.com',
    'https://www.bulgarihotels.com/milan',
    'Europe/Rome',
    'EUR',
    5,
    ARRAY['spa', 'restaurant', 'garden', 'concierge', 'room-service', 'fitness'],
    TRUE
  ),
  -- La Mamounia Marrakech
  (
    'H-MAMOUNIA',
    'La Mamounia',
    'A legendary palace hotel in the heart of Marrakech, surrounded by 8 hectares of enchanting gardens and offering the essence of Moroccan hospitality.',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1920&h=1080&fit=crop',
    '#8b4513',
    '#ffd700',
    'Avenue Bab Jdid',
    'Marrakech',
    'Morocco',
    '+212 5 24 38 86 00',
    'reservations@mamounia.com',
    'https://www.mamounia.com',
    'Africa/Casablanca',
    'MAD',
    5,
    ARRAY['spa', 'restaurant', 'pool', 'garden', 'hammam', 'concierge', 'room-service'],
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  cover_image_url = EXCLUDED.cover_image_url,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  timezone = EXCLUDED.timezone,
  currency = EXCLUDED.currency,
  star_rating = EXCLUDED.star_rating,
  amenities = EXCLUDED.amenities,
  is_active = EXCLUDED.is_active;

-- =============================================================================
-- HOTEL INTEGRATIONS (PMS Configuration)
-- =============================================================================
INSERT INTO hotel_integrations (
  hotel_id,
  pms_provider,
  pms_config,
  digital_key_provider,
  digital_key_config,
  spa_provider,
  spa_config
)
VALUES 
  -- Four Seasons Paris - Connected to Mock PMS
  (
    'H-FOURSEASONS',
    'opera',
    '{
      "baseUrl": "http://localhost:4010",
      "resortId": "FS-PARIS",
      "username": "OPERA",
      "password": "OPERA",
      "syncEnabled": true,
      "syncInterval": 300
    }'::jsonb,
    'alliants',
    '{"propertyId": "FS-PARIS"}'::jsonb,
    'spabooker',
    '{"baseUrl": "http://localhost:4010", "siteId": "FS-PARIS"}'::jsonb
  ),
  -- Four Seasons Geneva
  (
    'H-FSGENEVA',
    'opera',
    '{
      "baseUrl": "http://localhost:4010",
      "resortId": "FS-GENEVA",
      "username": "OPERA",
      "password": "OPERA",
      "syncEnabled": true,
      "syncInterval": 300
    }'::jsonb,
    'none',
    '{}'::jsonb,
    'spabooker',
    '{"baseUrl": "http://localhost:4010", "siteId": "FS-GENEVA"}'::jsonb
  ),
  -- Bulgari Milan
  (
    'H-BULGARI',
    'mews',
    '{
      "baseUrl": "http://localhost:4010",
      "resortId": "BH-MILAN",
      "accessToken": "MOCK_TOKEN",
      "syncEnabled": true
    }'::jsonb,
    'none',
    '{}'::jsonb,
    'none',
    '{}'::jsonb
  ),
  -- La Mamounia Marrakech
  (
    'H-MAMOUNIA',
    'opera',
    '{
      "baseUrl": "http://localhost:4010",
      "resortId": "MN-MARRAKECH",
      "username": "OPERA",
      "password": "OPERA",
      "syncEnabled": true
    }'::jsonb,
    'none',
    '{}'::jsonb,
    'spabooker',
    '{"baseUrl": "http://localhost:4010", "siteId": "MN-MARRAKECH"}'::jsonb
  )
ON CONFLICT (hotel_id) DO UPDATE SET
  pms_provider = EXCLUDED.pms_provider,
  pms_config = EXCLUDED.pms_config,
  digital_key_provider = EXCLUDED.digital_key_provider,
  digital_key_config = EXCLUDED.digital_key_config,
  spa_provider = EXCLUDED.spa_provider,
  spa_config = EXCLUDED.spa_config;

-- =============================================================================
-- HOTEL NOTIFICATIONS
-- =============================================================================
INSERT INTO hotel_notifications (
  hotel_id,
  email_provider,
  email_config,
  sms_provider,
  sms_config,
  push_provider,
  push_config
)
VALUES 
  ('H-FOURSEASONS', 'mock', '{}'::jsonb, 'mock', '{}'::jsonb, 'none', '{}'::jsonb),
  ('H-FSGENEVA', 'mock', '{}'::jsonb, 'mock', '{}'::jsonb, 'none', '{}'::jsonb),
  ('H-BULGARI', 'mock', '{}'::jsonb, 'mock', '{}'::jsonb, 'none', '{}'::jsonb),
  ('H-MAMOUNIA', 'mock', '{}'::jsonb, 'mock', '{}'::jsonb, 'none', '{}'::jsonb)
ON CONFLICT (hotel_id) DO NOTHING;

-- =============================================================================
-- STAFF USERS
-- =============================================================================
-- Password for all staff: admin123
INSERT INTO staff_users (
  id,
  hotel_id,
  email,
  display_name,
  role,
  departments,
  password_hash
)
VALUES
  -- Four Seasons Paris Staff
  (
    'SU-0001',
    'H-FOURSEASONS',
    'manager@fourseasons.demo',
    'Jean-Pierre Dupont',
    'manager',
    ARRAY['reception', 'concierge', 'housekeeping', 'spa-gym', 'restaurants', 'room-service'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'SU-0002',
    'H-FOURSEASONS',
    'concierge@fourseasons.demo',
    'Marie Laurent',
    'staff',
    ARRAY['concierge'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'SU-0003',
    'H-FOURSEASONS',
    'reception@fourseasons.demo',
    'Thomas Bernard',
    'staff',
    ARRAY['reception'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'SU-0004',
    'H-FOURSEASONS',
    'housekeeping@fourseasons.demo',
    'Claire Moreau',
    'staff',
    ARRAY['housekeeping'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'SU-0005',
    'H-FOURSEASONS',
    'spa@fourseasons.demo',
    'Sophie Martin',
    'staff',
    ARRAY['spa-gym'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'SU-0006',
    'H-FOURSEASONS',
    'roomservice@fourseasons.demo',
    'Pierre Lefebvre',
    'staff',
    ARRAY['room-service', 'restaurants'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  -- Four Seasons Geneva Staff
  (
    'SU-0010',
    'H-FSGENEVA',
    'manager@geneva.demo',
    'Hans Mueller',
    'manager',
    ARRAY['reception', 'concierge', 'housekeeping', 'spa-gym', 'restaurants', 'room-service'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'SU-0011',
    'H-FSGENEVA',
    'concierge@geneva.demo',
    'Anna Schmidt',
    'staff',
    ARRAY['concierge'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  -- Bulgari Milan Staff
  (
    'SU-0020',
    'H-BULGARI',
    'manager@bulgari.demo',
    'Marco Rossi',
    'manager',
    ARRAY['reception', 'concierge', 'housekeeping', 'spa-gym', 'restaurants', 'room-service'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'SU-0021',
    'H-BULGARI',
    'concierge@bulgari.demo',
    'Giulia Bianchi',
    'staff',
    ARRAY['concierge'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  -- La Mamounia Marrakech Staff
  (
    'SU-0030',
    'H-MAMOUNIA',
    'manager@mamounia.demo',
    'Youssef El Fassi',
    'manager',
    ARRAY['reception', 'concierge', 'housekeeping', 'spa-gym', 'restaurants', 'room-service'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'SU-0031',
    'H-MAMOUNIA',
    'concierge@mamounia.demo',
    'Fatima Bennani',
    'staff',
    ARRAY['concierge'],
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  departments = EXCLUDED.departments,
  password_hash = EXCLUDED.password_hash;

-- =============================================================================
-- GUESTS (Registered App Users)
-- =============================================================================
-- Password for all guests: admin123
INSERT INTO guests (
  id,
  email,
  first_name,
  last_name,
  phone,
  password_hash
)
VALUES
  (
    'G-0001',
    'sophie.martin@email.com',
    'Sophie',
    'Martin',
    '+33 6 12 34 56 78',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'G-0002',
    'james.wilson@corp.com',
    'James',
    'Wilson',
    '+1 212 555 0123',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'G-0003',
    'yuki.tanaka@example.jp',
    'Yuki',
    'Tanaka',
    '+81 90 1234 5678',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'G-0004',
    'emma.dubois@gmail.com',
    'Emma',
    'Dubois',
    '+33 6 98 76 54 32',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  (
    'G-0005',
    'm.alrashid@business.ae',
    'Mohammed',
    'Al-Rashid',
    '+971 50 123 4567',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  )
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  password_hash = EXCLUDED.password_hash;

-- =============================================================================
-- STAYS (Active reservations linked to guests)
-- =============================================================================
-- These stays match the PMS mock data for seamless integration testing
INSERT INTO stays (
  id,
  hotel_id,
  guest_id,
  confirmation_number,
  room_number,
  check_in,
  check_out,
  adults,
  children
)
VALUES 
  -- Sophie Martin at Four Seasons Paris (currently checked in)
  (
    'S-0001',
    'H-FOURSEASONS',
    'G-0001',
    'FSGV2025A1B2C',
    '701',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 days',
    2,
    0
  ),
  -- James Wilson arriving tomorrow at Four Seasons Paris
  (
    'S-0002',
    'H-FOURSEASONS',
    'G-0002',
    'FSGV2025D3E4F',
    NULL,
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '4 days',
    1,
    0
  ),
  -- Yuki Tanaka checking in today
  (
    'S-0003',
    'H-FOURSEASONS',
    'G-0003',
    'FSGV2025G5H6I',
    NULL,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '5 days',
    2,
    0
  ),
  -- Emma Dubois arriving in 2 days
  (
    'S-0004',
    'H-FOURSEASONS',
    'G-0004',
    'FSGV2025M9N0P',
    NULL,
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '4 days',
    1,
    0
  ),
  -- Mohammed Al-Rashid at La Mamounia (future booking)
  (
    'S-0005',
    'H-MAMOUNIA',
    'G-0005',
    'LAMM2025H1H2H',
    NULL,
    CURRENT_DATE + INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '17 days',
    4,
    3
  ),
  -- Demo stay for testing (no guest linked - for anonymous demo)
  (
    'S-DEMO',
    'H-FOURSEASONS',
    NULL,
    '0123456789',
    '227',
    '2025-11-03',
    '2025-11-12',
    2,
    1
  )
ON CONFLICT (id) DO UPDATE SET
  guest_id = EXCLUDED.guest_id,
  confirmation_number = EXCLUDED.confirmation_number,
  room_number = EXCLUDED.room_number,
  check_in = EXCLUDED.check_in,
  check_out = EXCLUDED.check_out,
  adults = EXCLUDED.adults,
  children = EXCLUDED.children;

-- =============================================================================
-- TICKETS (Service Requests)
-- =============================================================================
INSERT INTO tickets (
  id,
  hotel_id,
  stay_id,
  room_number,
  department,
  status,
  title,
  assigned_staff_user_id,
  payload
)
VALUES
  -- Sophie Martin's requests
  (
    'T-1001',
    'H-FOURSEASONS',
    'S-0001',
    '701',
    'concierge',
    'pending',
    'Restaurant reservation at Le Cinq',
    'SU-0002',
    '{"type":"restaurant_booking","restaurant":"Le Cinq","date":"2025-01-22","time":"20:00","guests":2}'::jsonb
  ),
  (
    'T-1002',
    'H-FOURSEASONS',
    'S-0001',
    '701',
    'spa-gym',
    'in_progress',
    'Couples massage appointment',
    'SU-0005',
    '{"type":"spa_booking","service":"Couples Massage","date":"2025-01-21","time":"15:00"}'::jsonb
  ),
  (
    'T-1003',
    'H-FOURSEASONS',
    'S-0001',
    '701',
    'housekeeping',
    'completed',
    'Extra pillows requested',
    'SU-0004',
    '{"type":"item_request","item":"pillows","quantity":2}'::jsonb
  ),
  -- Demo stay tickets
  (
    'T-2001',
    'H-FOURSEASONS',
    'S-DEMO',
    '227',
    'concierge',
    'pending',
    'Airport transfer for 15:30',
    'SU-0002',
    '{"type":"transfer_airport","time":"15:30"}'::jsonb
  ),
  (
    'T-2002',
    'H-FOURSEASONS',
    'S-DEMO',
    '227',
    'housekeeping',
    'in_progress',
    '2 towels requested',
    NULL,
    '{"type":"item_request","item":"towels","quantity":2}'::jsonb
  ),
  (
    'T-2003',
    'H-FOURSEASONS',
    'S-DEMO',
    '227',
    'room-service',
    'pending',
    'Breakfast order for tomorrow 8:00',
    'SU-0006',
    '{"type":"room_service","items":["Continental Breakfast x2"],"deliveryTime":"08:00"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  title = EXCLUDED.title,
  assigned_staff_user_id = EXCLUDED.assigned_staff_user_id,
  payload = EXCLUDED.payload;

-- =============================================================================
-- THREADS (Conversations)
-- =============================================================================
INSERT INTO threads (
  id,
  hotel_id,
  stay_id,
  department,
  status,
  title,
  assigned_staff_user_id
)
VALUES
  (
    'TH-1001',
    'H-FOURSEASONS',
    'S-0001',
    'concierge',
    'pending',
    'Restaurant recommendation',
    'SU-0002'
  ),
  (
    'TH-1002',
    'H-FOURSEASONS',
    'S-0001',
    'spa-gym',
    'in_progress',
    'Spa appointment inquiry',
    'SU-0005'
  ),
  (
    'TH-2001',
    'H-FOURSEASONS',
    'S-DEMO',
    'concierge',
    'pending',
    'Airport transfer',
    'SU-0002'
  ),
  (
    'TH-2002',
    'H-FOURSEASONS',
    'S-DEMO',
    'housekeeping',
    'in_progress',
    'Extra towels',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  title = EXCLUDED.title,
  assigned_staff_user_id = EXCLUDED.assigned_staff_user_id;

-- =============================================================================
-- MESSAGES
-- =============================================================================
INSERT INTO messages (
  id,
  thread_id,
  sender_type,
  sender_name,
  body_text,
  payload
)
VALUES
  -- Sophie's restaurant conversation
  (
    'M-1001',
    'TH-1001',
    'guest',
    'Sophie Martin',
    'Bonjour, pouvez-vous me recommander un bon restaurant pour ce soir ?',
    '{}'::jsonb
  ),
  (
    'M-1002',
    'TH-1001',
    'staff',
    'Marie Laurent',
    'Bonjour Madame Martin ! Je vous recommande Le Cinq, notre restaurant 3 étoiles Michelin. Souhaitez-vous que je fasse une réservation ?',
    '{}'::jsonb
  ),
  (
    'M-1003',
    'TH-1001',
    'guest',
    'Sophie Martin',
    'Oui, pour 2 personnes à 20h si possible.',
    '{}'::jsonb
  ),
  -- Sophie's spa conversation
  (
    'M-1010',
    'TH-1002',
    'guest',
    'Sophie Martin',
    'Bonjour, avez-vous des disponibilités pour un massage en couple demain ?',
    '{}'::jsonb
  ),
  (
    'M-1011',
    'TH-1002',
    'staff',
    'Sophie Martin (Spa)',
    'Bonjour ! Oui, nous avons des créneaux disponibles à 15h ou 17h. Quelle heure vous conviendrait ?',
    '{}'::jsonb
  ),
  -- Demo stay conversations
  (
    'M-2001',
    'TH-2001',
    'guest',
    'Guest',
    'Bonjour, pouvez-vous organiser un transfert aéroport pour ce soir ?',
    '{}'::jsonb
  ),
  (
    'M-2002',
    'TH-2001',
    'staff',
    'Marie Laurent',
    'Bien sûr. À quelle heure souhaitez-vous partir ?',
    '{}'::jsonb
  ),
  (
    'M-2003',
    'TH-2002',
    'guest',
    'Guest',
    'Bonjour, je voudrais 2 serviettes supplémentaires.',
    '{"type":"item_request","item":"towels","quantity":2}'::jsonb
  ),
  (
    'M-2004',
    'TH-2002',
    'staff',
    'Claire Moreau',
    'C''est noté. Nous arrivons dans 10 minutes.',
    '{}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  body_text = EXCLUDED.body_text,
  payload = EXCLUDED.payload;

-- =============================================================================
-- INTERNAL NOTES
-- =============================================================================
INSERT INTO internal_notes (
  id,
  hotel_id,
  target_type,
  target_id,
  department,
  author_staff_user_id,
  author_name,
  body_text
)
VALUES
  (
    'IN-1001',
    'H-FOURSEASONS',
    'ticket',
    'T-1001',
    'concierge',
    'SU-0002',
    'Marie Laurent',
    'VIP guest - Gold member, ensure best table.'
  ),
  (
    'IN-1002',
    'H-FOURSEASONS',
    'thread',
    'TH-1001',
    'concierge',
    'SU-0001',
    'Jean-Pierre Dupont',
    'Offer complimentary champagne as welcome gesture.'
  ),
  (
    'IN-2001',
    'H-FOURSEASONS',
    'ticket',
    'T-2001',
    'concierge',
    'SU-0002',
    'Marie Laurent',
    'Guest requested pickup at 15:30, confirm car category.'
  ),
  (
    'IN-2002',
    'H-FOURSEASONS',
    'thread',
    'TH-2001',
    'concierge',
    'SU-0001',
    'Jean-Pierre Dupont',
    'Escalate to reception if transfer changes after 18:00.'
  )
ON CONFLICT (id) DO UPDATE SET
  body_text = EXCLUDED.body_text;

-- =============================================================================
-- EVENTS (Scheduled Activities)
-- =============================================================================
INSERT INTO events (
  id,
  hotel_id,
  stay_id,
  type,
  title,
  start_at,
  end_at,
  status,
  metadata
)
VALUES
  -- Sophie's events
  (
    'E-1001',
    'H-FOURSEASONS',
    'S-0001',
    'spa',
    'Couples Massage - Deep Relaxation',
    (CURRENT_DATE + INTERVAL '1 day' + TIME '15:00')::timestamp,
    (CURRENT_DATE + INTERVAL '1 day' + TIME '16:30')::timestamp,
    'scheduled',
    '{"department":"spa-gym","service":"Couples Massage","price":380}'::jsonb
  ),
  (
    'E-1002',
    'H-FOURSEASONS',
    'S-0001',
    'restaurant',
    'Dinner at Le Cinq',
    (CURRENT_DATE + INTERVAL '2 days' + TIME '20:00')::timestamp,
    NULL,
    'scheduled',
    '{"department":"restaurants","restaurant":"Le Cinq","guests":2}'::jsonb
  ),
  -- Demo stay events
  (
    'E-2001',
    'H-FOURSEASONS',
    'S-DEMO',
    'spa',
    'Massage 2h – Instant relaxation',
    '2025-11-07T15:00:00Z',
    '2025-11-07T17:00:00Z',
    'scheduled',
    '{"department":"spa-gym"}'::jsonb
  ),
  (
    'E-2002',
    'H-FOURSEASONS',
    'S-DEMO',
    'restaurant',
    'Table réservée – Brasserie',
    '2025-11-08T19:30:00Z',
    NULL,
    'scheduled',
    '{"department":"restaurants"}'::jsonb
  ),
  (
    'E-2003',
    'H-FOURSEASONS',
    'S-DEMO',
    'transfer',
    'Transfert aéroport',
    '2025-11-12T12:00:00Z',
    NULL,
    'scheduled',
    '{"department":"concierge"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  start_at = EXCLUDED.start_at,
  end_at = EXCLUDED.end_at,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata;

-- =============================================================================
-- INVOICES
-- =============================================================================
INSERT INTO invoices (
  id,
  hotel_id,
  stay_id,
  title,
  department,
  amount_cents,
  currency,
  points_earned,
  issued_at,
  download_url
)
VALUES
  -- Sophie's charges
  (
    'I-1001',
    'H-FOURSEASONS',
    'S-0001',
    'Mini Bar',
    'room-service',
    4500,
    'EUR',
    45,
    CURRENT_DATE,
    NULL
  ),
  (
    'I-1002',
    'H-FOURSEASONS',
    'S-0001',
    'Breakfast - Le Cinq',
    'restaurants',
    9500,
    'EUR',
    95,
    CURRENT_DATE,
    NULL
  ),
  -- Demo stay invoices
  (
    'I-2001',
    'H-FOURSEASONS',
    'S-DEMO',
    'Forfait 1 h au spa privé',
    'spa-gym',
    5500,
    'EUR',
    55,
    '2025-11-08',
    NULL
  ),
  (
    'I-2002',
    'H-FOURSEASONS',
    'S-DEMO',
    'Forfait 2 h massage et instant relaxation',
    'spa-gym',
    13500,
    'EUR',
    135,
    '2025-11-07',
    NULL
  ),
  (
    'I-2003',
    'H-FOURSEASONS',
    'S-DEMO',
    'Forfait 1 h au spa privé',
    'spa-gym',
    5500,
    'EUR',
    55,
    '2025-11-06',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  amount_cents = EXCLUDED.amount_cents,
  points_earned = EXCLUDED.points_earned;

-- =============================================================================
-- DONE
-- =============================================================================
-- Seed data has been loaded successfully!
-- See demo.md in the project root for login credentials and testing instructions.
