-- =============================================================================
-- MyStay Platform Seed Data
-- =============================================================================
-- This file seeds the database with demo data for development and testing.
-- Run with: npm run db:seed (or psql -f backend/db/seed.sql)
--
-- Demo accounts are documented in demo.md at the project root.
-- =============================================================================

-- Schema update for room numbers (quick fix for seed compatibility)
ALTER TABLE room_images ADD COLUMN IF NOT EXISTS room_numbers TEXT[];

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
      -- 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop',

  (
    'H-FOURSEASONS',
    'Four Seasons Hotel George V',
    'An iconic palace hotel in the heart of Paris, steps from the Champs-Élysées. Experience legendary service, Michelin-starred dining, and timeless Parisian elegance.',
    '',
    '/uploads/1770225734698-header.png',
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
  -- Four Seasons Paris - Connected to Mock PMS (Opera style)
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
    '{"baseUrl": "http://localhost:4011", "siteId": "FS-PARIS"}'::jsonb
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
    '{"baseUrl": "http://localhost:4011", "siteId": "FS-GENEVA"}'::jsonb
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
    '{"baseUrl": "http://localhost:4011", "siteId": "MN-MARRAKECH"}'::jsonb
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
  -- Four Seasons Paris Staff (Complete team)
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
  -- Restaurant Manager (dedicated)
  (
    'SU-0007',
    'H-FOURSEASONS',
    'restaurant@fourseasons.demo',
    'Chef Antoine Dubois',
    'staff',
    ARRAY['restaurants'],
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
-- Password for all guests: guest123
INSERT INTO guests (
  id,
  email,
  first_name,
  last_name,
  phone,
  password_hash
)
VALUES
  -- VIP Gold member
  (
    'G-0001',
    'sophie.martin@email.com',
    'Sophie',
    'Martin',
    '+33 6 12 34 56 78',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  -- VIP Platinum member (Business traveler)
  (
    'G-0002',
    'james.wilson@corp.com',
    'James',
    'Wilson',
    '+1 212 555 0123',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  -- VIP Silver (Japanese guest)
  (
    'G-0003',
    'yuki.tanaka@example.jp',
    'Yuki',
    'Tanaka',
    '+81 90 1234 5678',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  -- First time guest (French)
  (
    'G-0004',
    'emma.dubois@gmail.com',
    'Emma',
    'Dubois',
    '+33 6 98 76 54 32',
    'scrypt$8EedSiBiqAYyVxV/ipnNYw==$8997a+RkLshzu1PHSL7XFplb973ySksGoYANPNkHek9CQHkwAufeSPAnGaqU4jX+yB7QdHsCSCPrgOYnd/S4pQ=='
  ),
  -- VIP Platinum (Middle East)
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
    '502',
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
    '305',
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '4 days',
    1,
    0
  ),
  -- Mohammed Al-Rashid at Four Seasons Paris (VIP, checked in yesterday)
  (
    'S-0006',
    'H-FOURSEASONS',
    'G-0005',
    'FSGV2025J7K8L',
    'PH1',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '2 days',
    2,
    2
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
  -- Demo stay for testing (anonymous guest for quick demo)
  (
    'S-DEMO',
    'H-FOURSEASONS',
    NULL,
    'DEMO123456',
    '227',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '5 days',
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

UPDATE stays SET pms_reservation_id = 'RES-DEMO', guest_id = 'G-0001' WHERE id = 'S-DEMO';

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
    '{"type":"restaurant_booking","restaurant":"Le Cinq","time":"20:00","guests":2}'::jsonb
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
    '{"type":"spa_booking","service":"Couples Massage","time":"15:00"}'::jsonb
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
    'Airport transfer for departure',
    'SU-0002',
    '{"type":"transfer_airport","direction":"to_airport","time":"12:00"}'::jsonb
  ),
  (
    'T-2002',
    'H-FOURSEASONS',
    'S-DEMO',
    '227',
    'housekeeping',
    'in_progress',
    '2 extra towels requested',
    'SU-0004',
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
  ),
  -- VIP Mohammed Al-Rashid tickets
  (
    'T-3001',
    'H-FOURSEASONS',
    'S-0006',
    'PH1',
    'concierge',
    'completed',
    'Private limousine to Louvre',
    'SU-0002',
    '{"type":"limousine","destination":"Louvre Museum","duration":"half-day"}'::jsonb
  ),
  (
    'T-3002',
    'H-FOURSEASONS',
    'S-0006',
    'PH1',
    'room-service',
    'completed',
    'Private dinner for 6 guests',
    'SU-0006',
    '{"type":"private_dining","guests":6,"dietary":["halal"]}'::jsonb
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
    'Extra towels request',
    'SU-0004'
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
    'Bonjour, pouvez-vous organiser un transfert aéroport pour mon départ ?',
    '{}'::jsonb
  ),
  (
    'M-2002',
    'TH-2001',
    'staff',
    'Marie Laurent',
    'Bien sûr ! À quelle heure est votre vol ?',
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
    'C''est noté ! Notre équipe arrive dans 10 minutes.',
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
    'VIP Gold member - ensure best table with view.'
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
    'Confirm car category with guest before booking.'
  ),
  (
    'IN-3001',
    'H-FOURSEASONS',
    'ticket',
    'T-3001',
    'concierge',
    'SU-0001',
    'Jean-Pierre Dupont',
    'VIP Platinum - Presidential Suite guest. Priority handling.'
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
    (CURRENT_DATE + INTERVAL '1 day' + TIME '20:00')::timestamp,
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
    'Une heure de relaxation au Spa',
    (CURRENT_DATE + TIME '14:00')::timestamp,
    (CURRENT_DATE + TIME '15:00')::timestamp,
    'scheduled',
    '{"department":"spa-gym","service":"Relaxation"}'::jsonb
  ),
  (
    'E-2002',
    'H-FOURSEASONS',
    'S-DEMO',
    'invite',
    'Soirée de lancement',
    (CURRENT_DATE + TIME '19:00')::timestamp,
    (CURRENT_DATE + TIME '21:00')::timestamp,
    'scheduled',
    '{"variant":"invite","linkUrl":"/agenda"}'::jsonb
  ),
  (
    'E-2003',
    'H-FOURSEASONS',
    'S-DEMO',
    'transfer',
    'Airport Transfer - Departure',
    (CURRENT_DATE + INTERVAL '5 days' + TIME '12:00')::timestamp,
    NULL,
    'scheduled',
    '{"department":"concierge","type":"airport","direction":"to_airport"}'::jsonb
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
  (
    'I-1003',
    'H-FOURSEASONS',
    'S-0001',
    'Deep Tissue Massage',
    'spa-gym',
    22000,
    'EUR',
    220,
    CURRENT_DATE,
    NULL
  ),
  -- Demo stay invoices
  (
    'I-2001',
    'H-FOURSEASONS',
    'S-DEMO',
    'Spa Treatment - Swedish Massage',
    'spa-gym',
    18000,
    'EUR',
    180,
    CURRENT_DATE - INTERVAL '1 day',
    NULL
  ),
  (
    'I-2002',
    'H-FOURSEASONS',
    'S-DEMO',
    'Room Service - Dinner',
    'room-service',
    8500,
    'EUR',
    85,
    CURRENT_DATE - INTERVAL '1 day',
    NULL
  ),
  -- VIP Mohammed charges
  (
    'I-3001',
    'H-FOURSEASONS',
    'S-0006',
    'Private Dining - 6 guests',
    'restaurants',
    180000,
    'EUR',
    1800,
    CURRENT_DATE - INTERVAL '1 day',
    NULL
  ),
  (
    'I-3002',
    'H-FOURSEASONS',
    'S-0006',
    'Limousine Service - Half Day',
    'concierge',
    75000,
    'EUR',
    750,
    CURRENT_DATE,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  amount_cents = EXCLUDED.amount_cents,
  points_earned = EXCLUDED.points_earned;

-- =============================================================================
-- PAYMENT LINKS (Pay by Link)
-- =============================================================================
INSERT INTO payment_links (
  id,
  hotel_id,
  stay_id,
  guest_id,
  payer_type,
  payer_name,
  payer_email,
  payer_phone,
  amount_cents,
  currency,
  reason_category,
  reason_text,
  pms_status,
  payment_status,
  public_token,
  public_url,
  created_by_staff_user_id,
  paid_at,
  expires_at,
  created_at,
  updated_at
)
VALUES
  (
    'PL-1001',
    'H-FOURSEASONS',
    'S-0002',
    'G-0002',
    'guest',
    NULL,
    NULL,
    NULL,
    120000,
    'EUR',
    'deposit',
    'Deposit',
    'configured',
    'created',
    'pl_demo_1001',
    'http://localhost:3000/pay/pl_demo_1001',
    'SU-0001',
    NULL,
    NULL,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'PL-1002',
    'H-FOURSEASONS',
    'S-0001',
    'G-0001',
    'guest',
    NULL,
    NULL,
    NULL,
    60000,
    'EUR',
    'food_beverage',
    'Food & Beverages',
    'posted',
    'paid',
    'pl_demo_1002',
    'http://localhost:3000/pay/pl_demo_1002',
    'SU-0001',
    NOW() - INTERVAL '2 days',
    NULL,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'PL-1003',
    'H-FOURSEASONS',
    NULL,
    NULL,
    'visitor',
    'Miracle Rosser',
    'miracle.rosser@example.com',
    '+45 12 34 56 78',
    880000,
    'EUR',
    'other',
    'Other',
    'not_configured',
    'failed',
    'pl_demo_1003',
    'http://localhost:3000/pay/pl_demo_1003',
    'SU-0001',
    NULL,
    NULL,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    'PL-1004',
    'H-FOURSEASONS',
    'S-DEMO',
    NULL,
    'guest',
    NULL,
    NULL,
    NULL,
    220000,
    'EUR',
    'spa',
    'SPA',
    'configured',
    'expired',
    'pl_demo_1004',
    'http://localhost:3000/pay/pl_demo_1004',
    'SU-0001',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  amount_cents = EXCLUDED.amount_cents,
  currency = EXCLUDED.currency,
  reason_category = EXCLUDED.reason_category,
  reason_text = EXCLUDED.reason_text,
  pms_status = EXCLUDED.pms_status,
  payment_status = EXCLUDED.payment_status,
  public_token = EXCLUDED.public_token,
  public_url = EXCLUDED.public_url,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- PMS SYNC RUNS (for synced timestamp)
-- =============================================================================
INSERT INTO pms_sync_runs (
  id,
  hotel_id,
  status,
  started_at,
  finished_at,
  summary,
  error_message,
  error_details
)
VALUES
  (
    'PS-DEMO-0001',
    'H-FOURSEASONS',
    'ok',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '2 minutes',
    '{"demo": true, "provider": "opera"}'::jsonb,
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  started_at = EXCLUDED.started_at,
  finished_at = EXCLUDED.finished_at,
  summary = EXCLUDED.summary,
  error_message = EXCLUDED.error_message,
  error_details = EXCLUDED.error_details;

-- =============================================================================
-- AUDIENCE CONTACTS (CRM)
-- =============================================================================
INSERT INTO audience_contacts (
  id,
  hotel_id,
  guest_id,
  status,
  status_at,
  name,
  email,
  phone,
  channel,
  synced_with_pms,
  created_at,
  updated_at
)
VALUES
  (
    'AC-1001',
    'H-FOURSEASONS',
    'G-0001',
    'opted_in',
    NOW() - INTERVAL '1 day',
    'Ethan Evans',
    'ethan.evans@example.com',
    '+33 6 12 34 56 70',
    'app',
    TRUE,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    'AC-1002',
    'H-FOURSEASONS',
    'G-0002',
    'opted_in',
    NOW() - INTERVAL '3 days',
    'Sophia Bennett',
    'sophia.bennett@example.com',
    '+33 6 12 34 56 71',
    'manual_import',
    FALSE,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    'AC-1003',
    'H-FOURSEASONS',
    NULL,
    'opted_in',
    NOW() - INTERVAL '10 days',
    'Ava Foster',
    'ava.foster@example.com',
    NULL,
    'app',
    TRUE,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    'AC-1004',
    'H-FOURSEASONS',
    NULL,
    'opted_in',
    NOW() - INTERVAL '18 days',
    'Liam Anderson',
    'liam.anderson@example.com',
    NULL,
    'manual_import',
    FALSE,
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '18 days'
  ),
  (
    'AC-1005',
    'H-FOURSEASONS',
    NULL,
    'opted_in',
    NOW() - INTERVAL '25 days',
    'Olivia Davis',
    'olivia.davis@example.com',
    NULL,
    'manual_import',
    FALSE,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  ),
  (
    'AC-2001',
    'H-FOURSEASONS',
    NULL,
    'skipped',
    NOW() - INTERVAL '2 hours',
    'Noah Carter',
    NULL,
    NULL,
    'app',
    FALSE,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  status_at = EXCLUDED.status_at,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  channel = EXCLUDED.channel,
  synced_with_pms = EXCLUDED.synced_with_pms,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- SIGN-UP FORMS (CRM)
-- =============================================================================
INSERT INTO signup_forms (
  id,
  hotel_id,
  name,
  description,
  channel,
  status,
  config,
  created_by_staff_user_id,
  created_at,
  updated_at
)
VALUES
  (
    'SF-1001',
    'H-FOURSEASONS',
    '10% off your next stay',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'check_in',
    'active',
    '{}'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'SF-1002',
    'H-FOURSEASONS',
    'Join our VIP list',
    'Receive exclusive offers and updates.',
    'stay',
    'active',
    '{}'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'SF-1003',
    'H-FOURSEASONS',
    'Late checkout offers',
    'Get notified about late checkout availability.',
    'check_out',
    'active',
    '{}'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  channel = EXCLUDED.channel,
  status = EXCLUDED.status,
  config = EXCLUDED.config,
  created_by_staff_user_id = EXCLUDED.created_by_staff_user_id,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- HOTEL DIRECTORY (Content builder)
-- =============================================================================
INSERT INTO hotel_directory_pages (
  hotel_id,
  draft,
  published,
  draft_saved_at,
  published_at,
  created_at,
  updated_at
)
VALUES
  (
    'H-FOURSEASONS',
    '{
      "version": 1,
      "defaultLocale": "en",
      "locales": {
        "en": {
          "blocks": [
            { "id": "blk-welcome-h1", "type": "heading", "level": 2, "text": "Hotel Directory" },
            {
              "id": "blk-welcome-p1",
              "type": "paragraph",
              "text": "Welcome! On behalf of the entire team, we would like to welcome you to our hotel. Please do not hesitate to contact a team member if there is anything we can do for you during your stay."
            },
            { "id": "blk-signature", "type": "paragraph", "text": "Yours sincerely\\nThe MyStay team" },
            { "id": "blk-divider-1", "type": "divider" },
            { "id": "blk-btn-1", "type": "button", "label": "Contact reception", "href": "/messages" }
          ]
        },
        "fr": {
          "blocks": [
            { "id": "blk-welcome-h1-fr", "type": "heading", "level": 2, "text": "Répertoire de l’hôtel" },
            {
              "id": "blk-welcome-p1-fr",
              "type": "paragraph",
              "text": "Bienvenue ! Au nom de toute l’équipe, nous vous souhaitons un excellent séjour. N’hésitez pas à contacter un membre de l’équipe si nous pouvons vous aider."
            },
            { "id": "blk-signature-fr", "type": "paragraph", "text": "Bien cordialement\\nL’équipe MyStay" },
            { "id": "blk-divider-1-fr", "type": "divider" },
            { "id": "blk-btn-1-fr", "type": "button", "label": "Contacter la réception", "href": "/messages" }
          ]
        }
      }
    }'::jsonb,
    '{
      "version": 1,
      "defaultLocale": "en",
      "locales": {
        "en": {
          "blocks": [
            { "id": "blk-welcome-h1", "type": "heading", "level": 2, "text": "Hotel Directory" },
            {
              "id": "blk-welcome-p1",
              "type": "paragraph",
              "text": "Welcome! On behalf of the entire team, we would like to welcome you to our hotel. Please do not hesitate to contact a team member if there is anything we can do for you during your stay."
            },
            { "id": "blk-signature", "type": "paragraph", "text": "Yours sincerely\\nThe MyStay team" },
            { "id": "blk-divider-1", "type": "divider" },
            { "id": "blk-btn-1", "type": "button", "label": "Contact reception", "href": "/messages" }
          ]
        },
        "fr": {
          "blocks": [
            { "id": "blk-welcome-h1-fr", "type": "heading", "level": 2, "text": "Répertoire de l’hôtel" },
            {
              "id": "blk-welcome-p1-fr",
              "type": "paragraph",
              "text": "Bienvenue ! Au nom de toute l’équipe, nous vous souhaitons un excellent séjour. N’hésitez pas à contacter un membre de l’équipe si nous pouvons vous aider."
            },
            { "id": "blk-signature-fr", "type": "paragraph", "text": "Bien cordialement\\nL’équipe MyStay" },
            { "id": "blk-divider-1-fr", "type": "divider" },
            { "id": "blk-btn-1-fr", "type": "button", "label": "Contacter la réception", "href": "/messages" }
          ]
        }
      }
    }'::jsonb,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (hotel_id) DO UPDATE SET
  draft = EXCLUDED.draft,
  published = EXCLUDED.published,
  draft_saved_at = EXCLUDED.draft_saved_at,
  published_at = EXCLUDED.published_at,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- MESSAGE TEMPLATES (Automations + manual messages)
-- =============================================================================
INSERT INTO message_templates (
  id,
  hotel_id,
  name,
  description,
  channel,
  status,
  content,
  created_by_staff_user_id,
  created_at,
  updated_at
)
VALUES
  (
    'MT-1001',
    'H-FOURSEASONS',
    'Check in now',
    'Invite guests to complete check-in online.',
    'email',
    'published',
    '{
      "defaultLocale": "en",
      "locales": {
        "en": {
          "subject": "Check in now",
          "bodyText": "Hi {{guestName}},\\n\\nYou can start your check-in now to save time on arrival.\\n\\nTap the link to continue: {{checkInUrl}}\\n\\nSee you soon,\\n{{hotelName}}"
        },
        "fr": {
          "subject": "Enregistrez-vous dès maintenant",
          "bodyText": "Bonjour {{guestName}},\\n\\nVous pouvez commencer l’enregistrement dès maintenant pour gagner du temps à l’arrivée.\\n\\nCliquez ici : {{checkInUrl}}\\n\\nÀ bientôt,\\n{{hotelName}}"
        }
      }
    }'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'MT-1002',
    'H-FOURSEASONS',
    'Reservation confirmed',
    'Confirmation message sent after booking.',
    'app',
    'published',
    '{
      "defaultLocale": "en",
      "locales": {
        "en": { "subject": "Reservation confirmed", "bodyText": "Thanks {{guestName}} — your stay is confirmed for {{arrivalDate}} to {{departureDate}}." },
        "fr": { "subject": "Réservation confirmée", "bodyText": "Merci {{guestName}} — votre séjour est confirmé du {{arrivalDate}} au {{departureDate}}." }
      }
    }'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '9 days'
  ),
  (
    'MT-1003',
    'H-FOURSEASONS',
    'Unlocked room',
    'Short SMS for digital key availability.',
    'sms',
    'draft',
    '{
      "defaultLocale": "en",
      "locales": {
        "en": { "bodyText": "{{hotelName}}: Your room is ready. Digital key is now available in the app." },
        "fr": { "bodyText": "{{hotelName}} : votre chambre est prête. La clé digitale est disponible dans l’app." }
      }
    }'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '1 days'
  ),
  (
    'MT-1004',
    'H-FOURSEASONS',
    'Order room service in app',
    'Archived template kept for history.',
    'app',
    'archived',
    '{
      "defaultLocale": "en",
      "locales": {
        "en": { "subject": "Order room service", "bodyText": "Browse the menu and order directly from the app." },
        "fr": { "subject": "Room service", "bodyText": "Consultez le menu et commandez directement depuis l’app." }
      }
    }'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '120 days'
  )
ON CONFLICT (id) DO UPDATE SET
  hotel_id = EXCLUDED.hotel_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  channel = EXCLUDED.channel,
  status = EXCLUDED.status,
  content = EXCLUDED.content,
  created_by_staff_user_id = EXCLUDED.created_by_staff_user_id,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- AUTOMATIONS (Communication rules)
-- =============================================================================
INSERT INTO automations (
  id,
  hotel_id,
  name,
  description,
  trigger,
  status,
  config,
  created_by_staff_user_id,
  created_at,
  updated_at
)
VALUES
  (
    'AUTO-1001',
    'H-FOURSEASONS',
    'Check-in invitation',
    'Send a check-in invite 24 hours before arrival.',
    'check_in_invitation',
    'active',
    '{
      "templateId": "MT-1001",
      "channel": "email",
      "offset": { "type": "before_arrival", "hours": 24 }
    }'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    'AUTO-1002',
    'H-FOURSEASONS',
    'Reservation confirmed',
    'Send confirmation after booking is created.',
    'reservation_confirmed',
    'paused',
    '{
      "templateId": "MT-1002",
      "channel": "app",
      "when": "immediate"
    }'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '80 days',
    NOW() - INTERVAL '14 days'
  ),
  (
    'AUTO-1003',
    'H-FOURSEASONS',
    'Unlocked room',
    'Notify guest when the room is ready.',
    'unlocked_room',
    'active',
    '{
      "templateId": "MT-1003",
      "channel": "sms",
      "when": "on_room_ready"
    }'::jsonb,
    'SU-0001',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '8 days'
  )
ON CONFLICT (id) DO UPDATE SET
  hotel_id = EXCLUDED.hotel_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger = EXCLUDED.trigger,
  status = EXCLUDED.status,
  config = EXCLUDED.config,
  created_by_staff_user_id = EXCLUDED.created_by_staff_user_id,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- UPSELL SERVICES (Hotel upselling catalog)
-- =============================================================================
INSERT INTO upsell_services (
  id,
  hotel_id,
  category,
  name,
  touchpoint,
  price_cents,
  currency,
  availability_weekdays,
  enabled,
  sort_order,
  created_by_staff_user_id,
  created_at,
  updated_at
)
VALUES
  (
    'UP-1001',
    'H-FOURSEASONS',
    'Category 1',
    'Parking',
    'before_and_during',
    15000,
    'EUR',
    ARRAY['mon','tue','wed','thu','fri','sat','sun'],
    TRUE,
    10,
    'SU-0001',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    'UP-1002',
    'H-FOURSEASONS',
    'Category 1',
    'Champagne on arrival',
    'during_stay',
    10000,
    'EUR',
    ARRAY['fri','sat'],
    FALSE,
    20,
    'SU-0001',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'UP-1003',
    'H-FOURSEASONS',
    'Category 1',
    'Airport transfer',
    'before_stay',
    9000,
    'EUR',
    ARRAY['mon','tue','wed','thu','fri','sat','sun'],
    TRUE,
    30,
    'SU-0001',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    'UP-2001',
    'H-FOURSEASONS',
    'Sports & recreation',
    'Private yoga session',
    'during_stay',
    12000,
    'EUR',
    ARRAY['mon','wed','fri'],
    TRUE,
    10,
    'SU-0001',
    NOW() - INTERVAL '22 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'UP-2002',
    'H-FOURSEASONS',
    'Sports & recreation',
    'Tennis court booking',
    'during_stay',
    8000,
    'EUR',
    ARRAY['tue','thu','sat','sun'],
    TRUE,
    20,
    'SU-0001',
    NOW() - INTERVAL '22 days',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO UPDATE SET
  hotel_id = EXCLUDED.hotel_id,
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  touchpoint = EXCLUDED.touchpoint,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  availability_weekdays = EXCLUDED.availability_weekdays,
  enabled = EXCLUDED.enabled,
  sort_order = EXCLUDED.sort_order,
  created_by_staff_user_id = EXCLUDED.created_by_staff_user_id,
  updated_at = EXCLUDED.updated_at;

-- Nettoyage (cleaning) bookable upsell service
INSERT INTO upsell_services (
  id, hotel_id, category, name, touchpoint,
  price_cents, currency, availability_weekdays, enabled, sort_order,
  description, image_url, time_slots, bookable,
  created_by_staff_user_id, created_at, updated_at
)
VALUES (
  'UP-CLEANING-01',
  'H-FOURSEASONS',
  'Housekeeping',
  'Nettoyage',
  'during_stay',
  5000,
  'EUR',
  ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  TRUE,
  1,
  'Description de la réservation de créneau pour un nettoyage.',
  '/images/room/nettoyage.png',
  ARRAY['10:00 - 11:00','12:00 - 13:00','15:00 - 16:00','17:00 - 18:00'],
  TRUE,
  'SU-0001',
  NOW() - INTERVAL '10 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  time_slots = EXCLUDED.time_slots,
  bookable = EXCLUDED.bookable,
  price_cents = EXCLUDED.price_cents,
  availability_weekdays = EXCLUDED.availability_weekdays,
  enabled = EXCLUDED.enabled,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- ROOM IMAGES (Room photo carousels)
-- =============================================================================
INSERT INTO room_images (
  id,
  hotel_id,
  category,
  title,
  description,
  image_url,
  sort_order,
  is_active,
  created_by_staff_user_id,
  room_numbers,
  created_at,
  updated_at
)
VALUES
  -- Four Seasons Paris room images (Room 701 - Suite)
  (
    'RI-1001',
    'H-FOURSEASONS',
    'room',
    'Bedroom',
    'Luxurious bedroom with king-size bed',
    '/uploads/roomi3.png',
    1,
    TRUE,
    'SU-0001',
    ARRAY['701'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'RI-1002',
    'H-FOURSEASONS',
    'room',
    'Living Area',
    'Spacious living area with city views',
    '/uploads/roomi4.png',
    2,
    TRUE,
    'SU-0001',
    ARRAY['701'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'RI-1003',
    'H-FOURSEASONS',
    'room',
    'Bathroom',
    'Marble bathroom with soaking tub',
    '/uploads/roomi2.png',
    3,
    TRUE,
    'SU-0001',
    ARRAY['701'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'RI-1004',
    'H-FOURSEASONS',
    'room',
    'Terrace',
    'Private terrace overlooking Paris',
    '/uploads/roomi1.png',
    4,
    TRUE,
    'SU-0001',
    ARRAY['701'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  -- Four Seasons Paris room images (Room 502 - Standard)
  (
    'RI-1005',
    'H-FOURSEASONS',
    'room',
    'Standard Bedroom',
    'Cozy standard room',
    '/uploads/roomi1.png',
    1,
    TRUE,
    'SU-0001',
    ARRAY['502'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'RI-1006',
    'H-FOURSEASONS',
    'room',
    'Standard Bathroom',
    'Modern bathroom with shower',
    '/uploads/roomi2.png',
    2,
    TRUE,
    'SU-0001',
    ARRAY['502'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'RI-1007',
    'H-FOURSEASONS',
    'room',
    'Room View',
    'Beautiful room interior',
    '/uploads/roomi3.png',
    3,
    TRUE,
    'SU-0001',
    ARRAY['502'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'RI-1008',
    'H-FOURSEASONS',
    'room',
    'Room Amenities',
    'Premium room amenities',
    '/uploads/roomi4.png',
    4,
    TRUE,
    'SU-0001',
    ARRAY['502'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  -- Four Seasons Geneva room images
  (
    'RI-2001',
    'H-FSGENEVA',
    'room',
    'Lake View Suite',
    'Suite with panoramic lake views',
    '/uploads/roomi1.png',
    1,
    TRUE,
    'SU-0010',
    ARRAY['SU-0010'],
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  ),
  (
    'RI-2002',
    'H-FSGENEVA',
    'room',
    'Alpine Suite',
    'Suite with mountain views',
    '/uploads/roomi2.png',
    2,
    TRUE,
    'SU-0010',
    ARRAY['SU-0010'],
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  ),
  -- Bulgari Milan room images
  (
    'RI-3001',
    'H-BULGARI',
    'room',
    'Garden Suite',
    'Suite overlooking private garden',
    '/uploads/roomi3.png',
    1,
    TRUE,
    'SU-0020',
    ARRAY['SU-0020'],
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  ),
  (
    'RI-3002',
    'H-BULGARI',
    'room',
    'Design Suite',
    'Contemporary Italian design suite',
    '/uploads/roomi4.png',
    2,
    TRUE,
    'SU-0020',
    ARRAY['SU-0020'],
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  ),
  -- La Mamounia Marrakech room images
  (
    'RI-4001',
    'H-MAMOUNIA',
    'room',
    'Royal Suite',
    'Traditional Moroccan royal suite',
    '/uploads/roomi1.png',
    1,
    TRUE,
    'SU-0030',
    ARRAY['SU-0030'],
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    'RI-4002',
    'H-MAMOUNIA',
    'room',
    'Garden View',
    'Room with garden and pool views',
    '/uploads/roomi2.png',
    2,
    TRUE,
    'SU-0030',
    ARRAY['SU-0030'],
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO UPDATE SET
  hotel_id = EXCLUDED.hotel_id,
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  room_numbers = EXCLUDED.room_numbers,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- EXPERIENCE SECTIONS (Configurable home page carousels)
-- =============================================================================
INSERT INTO experience_sections (
  id,
  hotel_id,
  slug,
  title_fr,
  title_en,
  sort_order,
  is_active,
  created_at,
  updated_at
) VALUES
  -- Four Seasons Paris
  ('ES-1001', 'H-FOURSEASONS', 'tailored', 'Plaisirs sur mesure', 'Tailored experiences', 1, TRUE, NOW(), NOW()),
  ('ES-1002', 'H-FOURSEASONS', 'culinary', 'Expériences culinaires', 'Culinary experiences', 2, TRUE, NOW(), NOW()),
  ('ES-1003', 'H-FOURSEASONS', 'activities', 'Moments à vivre', 'Things to do', 3, TRUE, NOW(), NOW()),
  -- Four Seasons Geneva
  ('ES-2001', 'H-FSGENEVA', 'tailored', 'Plaisirs sur mesure', 'Tailored experiences', 1, TRUE, NOW(), NOW()),
  ('ES-2002', 'H-FSGENEVA', 'culinary', 'Expériences culinaires', 'Culinary experiences', 2, TRUE, NOW(), NOW()),
  ('ES-2003', 'H-FSGENEVA', 'activities', 'Moments à vivre', 'Things to do', 3, TRUE, NOW(), NOW()),
  -- La Mamounia
  ('ES-3001', 'H-MAMOUNIA', 'tailored', 'Plaisirs sur mesure', 'Tailored experiences', 1, TRUE, NOW(), NOW()),
  ('ES-3002', 'H-MAMOUNIA', 'culinary', 'Expériences culinaires', 'Culinary experiences', 2, TRUE, NOW(), NOW()),
  ('ES-3003', 'H-MAMOUNIA', 'activities', 'Moments à vivre', 'Things to do', 3, TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title_fr = EXCLUDED.title_fr,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- EXPERIENCE ITEMS (Items within experience sections)
-- =============================================================================
INSERT INTO experience_items (
  id,
  section_id,
  hotel_id,
  label,
  image_url,
  link_url,
  type,
  restaurant_config,
  sort_order,
  is_active,
  created_at,
  updated_at
) VALUES
  -- Four Seasons Paris - Tailored (Plaisirs sur mesure)
  ('EI-1001', 'ES-1001', 'H-FOURSEASONS', 'FLEURS', '/uploads/1770222745347-fleurs.png', '/services', 'default', '{}'::jsonb, 1, TRUE, NOW(), NOW()),
  ('EI-1002', 'ES-1001', 'H-FOURSEASONS', 'CHAMPAGNE', '/uploads/1770222760416-champagne.png', '/services', 'default', '{}'::jsonb, 2, TRUE, NOW(), NOW()),
  ('EI-1003', 'ES-1001', 'H-FOURSEASONS', 'LETTRE', '/uploads/1770222762080-lettre.png', '/services', 'default', '{}'::jsonb, 3, TRUE, NOW(), NOW()),
  ('EI-1004', 'ES-1001', 'H-FOURSEASONS', 'MAGAZINE', '/uploads/1770222764066-magazine.png', '/services', 'default', '{}'::jsonb, 4, TRUE, NOW(), NOW()),
  
  -- Four Seasons Paris - Culinary (Expériences culinaires)
  ('EI-1101', 'ES-1002', 'H-FOURSEASONS', 'SEA FU', '/uploads/1770222872379-seafu.png', '/restaurants', 'restaurant', '{
    "description": "Our fine dining seafood restaurant in Jumeirah Beach offers a menu with Asian flavours and happy hour drinks by the beach with sunset views.",
    "hours": "Ouvert tous les jours,\nde 11 h à 14 h et de 19 h à 23 h.",
    "dishes": [
      {"id": "d1", "image": "/uploads/1770222872379-seafu.png", "caption": "Grilled salmon"},
      {"id": "d2", "image": "/uploads/1770222878430-coya.png", "caption": "Sushi platter"},
      {"id": "d3", "image": "/uploads/1770222879743-minikakushi.png", "caption": "Seafood tower"}
    ],
    "menuSections": [
      {
        "id": "menu-du-jour",
        "title": "Menu du jour",
        "price": "32,99 €",
        "subsections": [
          {
            "id": "entrees-au-choix",
            "title": "Entrées au choix",
            "items": [
              {"name": "Toast au chèvre et son assortiment de fruits rouges"},
              {"name": "Salade césar du chef"}
            ]
          },
          {
            "id": "plats-au-choix",
            "title": "Plats au choix",
            "items": [
              {"name": "Magret de canard"},
              {"name": "Burger à la pistache"}
            ]
          },
          {
            "id": "desserts-au-choix",
            "title": "Desserts au choix",
            "linkText": "Voir la carte des desserts"
          }
        ]
      },
      {
        "id": "entrees",
        "title": "Entrées",
        "items": [
          {"name": "Toast au chèvre et son assortiment de fruits rouges", "price": "8,00 €"},
          {"name": "Salade césar du chef", "price": "10,00 €"}
        ]
      },
      {
        "id": "plats",
        "title": "Plats",
        "items": [
          {"name": "Magret de canard", "price": "17,50 €"},
          {"name": "Burger à la pistache", "price": "15,50 €"}
        ]
      },
      {
        "id": "desserts",
        "title": "Desserts",
        "items": [
          {"name": "Fondant au chocolat", "price": "3,00 €"},
          {"name": "Café gourmand", "price": "2,50 €"}
        ]
      },
      {
        "id": "alcools",
        "title": "Alcools",
        "items": [
          {"name": "Verre de vin rouge", "price": "8,00 €"},
          {"name": "Verre de vin blanc", "price": "8,00 €"},
          {"name": "Coupe de champagne", "price": "15,00 €"},
          {"name": "Cocktail signature", "price": "18,00 €"}
        ]
      },
      {
        "id": "softs",
        "title": "Softs",
        "items": [
          {"name": "Eau minérale", "price": "4,00 €"},
          {"name": "Jus de fruits frais", "price": "6,00 €"},
          {"name": "Café / Thé", "price": "3,50 €"}
        ]
      }
    ]
  }'::jsonb, 1, TRUE, NOW(), NOW()),
  ('EI-1102', 'ES-1002', 'H-FOURSEASONS', 'COYA', '/uploads/1770222878430-coya.png', '/restaurants', 'restaurant', '{
    "description": "Contemporary Peruvian cuisine blending Latin American flavours with Japanese precision in an elegant setting.",
    "hours": "Ouvert du mardi au dimanche,\nde 12 h à 15 h et de 19 h à 23 h 30.",
    "menuSections": [
      {
        "id": "signature",
        "title": "Plats signature",
        "items": [
          {"name": "Ceviche classique", "price": "22,00 €"},
          {"name": "Anticuchos de boeuf", "price": "28,00 €"},
          {"name": "Poisson grillé Nikkei", "price": "34,00 €"}
        ]
      }
    ]
  }'::jsonb, 2, TRUE, NOW(), NOW()),
  ('EI-1103', 'ES-1002', 'H-FOURSEASONS', 'MIMI KAKUSHI', '/uploads/1770222879743-minikakushi.png', '/restaurants', 'restaurant', '{
    "description": "A vibrant Japanese restaurant celebrating the spirit of 1920s Tokyo with inventive dishes and craft cocktails.",
    "hours": "Ouvert tous les jours,\nde 18 h à 1 h.",
    "menuSections": [
      {
        "id": "sushi",
        "title": "Sushi & Sashimi",
        "items": [
          {"name": "Assortiment 12 pièces", "price": "45,00 €"},
          {"name": "Sashimi premium", "price": "38,00 €"}
        ]
      }
    ]
  }'::jsonb, 3, TRUE, NOW(), NOW()),
  ('EI-1104', 'ES-1002', 'H-FOURSEASONS', 'SCALINI', '/uploads/1770222880978-scalini.png', '/restaurants', 'restaurant', '{
    "description": "Authentic Italian cuisine with handmade pastas, wood-fired pizzas, and an extensive wine list.",
    "hours": "Ouvert tous les jours,\nde 12 h à 23 h.",
    "menuSections": [
      {
        "id": "pasta",
        "title": "Pasta",
        "items": [
          {"name": "Truffle tagliatelle", "price": "32,00 €"},
          {"name": "Lobster linguine", "price": "42,00 €"}
        ]
      }
    ]
  }'::jsonb, 4, TRUE, NOW(), NOW()),
  ('EI-1105', 'ES-1002', 'H-FOURSEASONS', 'VERDE', '/uploads/1770222882276-verde.png', '/restaurants', 'restaurant', '{
    "description": "Fresh Mediterranean flavours by the pool with a focus on healthy, locally sourced ingredients.",
    "hours": "Ouvert tous les jours,\nde 10 h à 18 h.",
    "menuSections": [
      {
        "id": "bowls",
        "title": "Bowls & Salades",
        "items": [
          {"name": "Poke bowl saumon", "price": "22,00 €"},
          {"name": "Salade méditerranéenne", "price": "18,00 €"}
        ]
      }
    ]
  }'::jsonb, 5, TRUE, NOW(), NOW()),
  ('EI-1106', 'ES-1002', 'H-FOURSEASONS', 'PASTRIES', '/uploads/1770224008752-pastries.png', '/restaurants', 'default', '{}'::jsonb, 6, TRUE, NOW(), NOW()),
  ('EI-1107', 'ES-1002', 'H-FOURSEASONS', 'NUSR-ET', '/uploads/1770223994670-nusret.png', '/restaurants', 'restaurant', '{
    "description": "The world-famous steakhouse by Salt Bae, offering premium cuts and an unforgettable dining experience.",
    "hours": "Ouvert tous les jours,\nde 12 h à 0 h.",
    "menuSections": [
      {
        "id": "steaks",
        "title": "Steaks",
        "items": [
          {"name": "Golden Tomahawk", "price": "250,00 €"},
          {"name": "Filet mignon", "price": "85,00 €"},
          {"name": "Côte de boeuf", "price": "120,00 €"}
        ]
      }
    ]
  }'::jsonb, 7, TRUE, NOW(), NOW()),
  ('EI-1108', 'ES-1002', 'H-FOURSEASONS', 'NAMMOS', '/uploads/1770223997009-nammos.png', '/restaurants', 'restaurant', '{
    "description": "The iconic Mykonos beach club restaurant, bringing Greek coastal cuisine and sunset vibes to Dubai.",
    "hours": "Ouvert tous les jours,\nde 11 h à 22 h.",
    "menuSections": [
      {
        "id": "seafood",
        "title": "Fruits de mer",
        "items": [
          {"name": "Grilled octopus", "price": "35,00 €"},
          {"name": "Seafood platter for 2", "price": "120,00 €"}
        ]
      }
    ]
  }'::jsonb, 8, TRUE, NOW(), NOW()),
  
  -- Four Seasons Paris - Activities (Moments à vivre)
  ('EI-1201', 'ES-1003', 'H-FOURSEASONS', 'SAFARI', '/uploads/1770224020259-safari.png', '/services', 'default', '{}'::jsonb, 1, TRUE, NOW(), NOW()),
  ('EI-1202', 'ES-1003', 'H-FOURSEASONS', 'BURJ AL ARAB TOUR', '/uploads/1770224174219-burdjalarab.png', '/services', 'default', '{}'::jsonb, 2, TRUE, NOW(), NOW()),
  ('EI-1203', 'ES-1003', 'H-FOURSEASONS', 'PADEL', '/uploads/1770224175269-padel.png', '/services', 'default', '{}'::jsonb, 3, TRUE, NOW(), NOW()),
  ('EI-1204', 'ES-1003', 'H-FOURSEASONS', 'JET SKI', '/uploads/1770224194933-jetski.png', '/services', 'default', '{}'::jsonb, 4, TRUE, NOW(), NOW()),
  ('EI-1205', 'ES-1003', 'H-FOURSEASONS', 'SURF', '/uploads/1770224196654-surf.png', '/services', 'default', '{}'::jsonb, 5, TRUE, NOW(), NOW()),
  ('EI-1206', 'ES-1003', 'H-FOURSEASONS', 'HELICOPTER TOUR', '/uploads/1770224198234-helicoptertour.png', '/services', 'default', '{}'::jsonb, 6, TRUE, NOW(), NOW()),
  ('EI-1207', 'ES-1003', 'H-FOURSEASONS', 'SUNRISE BALLOON', '/uploads/1770224199611-sunriseballoon.png', '/services', 'default', '{}'::jsonb, 7, TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  image_url = EXCLUDED.image_url,
  link_url = EXCLUDED.link_url,
  type = EXCLUDED.type,
  restaurant_config = EXCLUDED.restaurant_config,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- USEFUL INFORMATIONS
-- =============================================================================

INSERT INTO useful_info_categories (id, hotel_id, title, icon, sort_order, is_active, created_at, updated_at)
VALUES
  ('UIC-WIFI',       'H-FOURSEASONS', 'Connexion Wi-Fi',       'wifi',     1, TRUE, NOW(), NOW()),
  ('UIC-BREAKFAST',  'H-FOURSEASONS', 'Petit-déjeuner',        'coffee',   2, TRUE, NOW(), NOW()),
  ('UIC-GYM',        'H-FOURSEASONS', 'Salle de sport',        'dumbbell', 3, TRUE, NOW(), NOW()),
  ('UIC-POOL',       'H-FOURSEASONS', 'Piscine',               'waves',    4, TRUE, NOW(), NOW()),
  ('UIC-NOSMOKING',  'H-FOURSEASONS', 'Politique non-fumeur',  NULL,       5, TRUE, NOW(), NOW()),
  ('UIC-OTHER',      'H-FOURSEASONS', 'Autres informations',   NULL,       6, TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- Delete old items that no longer exist
DELETE FROM useful_info_items WHERE id IN (
  'UII-WIFI-03', 'UII-WIFI-04',
  'UII-BRK-02', 'UII-BRK-03', 'UII-BRK-04',
  'UII-GYM-03', 'UII-GYM-04', 'UII-GYM-05',
  'UII-POOL-03', 'UII-POOL-04',
  'UII-PARK-01', 'UII-PARK-02', 'UII-PARK-03', 'UII-PARK-04'
);
DELETE FROM useful_info_categories WHERE id = 'UIC-PARKING';

INSERT INTO useful_info_items (id, category_id, hotel_id, title, content, sort_order, is_active, created_at, updated_at)
VALUES
  -- Connexion Wi-Fi
  ('UII-WIFI-01', 'UIC-WIFI', 'H-FOURSEASONS', 'Réseau',     '**Réseau : FourSeasons_Guest**', 1, TRUE, NOW(), NOW()),
  ('UII-WIFI-02', 'UIC-WIFI', 'H-FOURSEASONS', 'Mot de passe', '**Mot de passe : Welcome2025!**', 2, TRUE, NOW(), NOW()),
  ('UII-WIFI-05', 'UIC-WIFI', 'H-FOURSEASONS', 'Note',       'Connexion gratuite et illimitée dans tout l''établissement.', 3, TRUE, NOW(), NOW()),

  -- Petit-déjeuner
  ('UII-BRK-01', 'UIC-BREAKFAST', 'H-FOURSEASONS', 'Horaires',  'Servi tous les jours de **6 h 30** à **10 h 00**.', 1, TRUE, NOW(), NOW()),
  ('UII-BRK-05', 'UIC-BREAKFAST', 'H-FOURSEASONS', 'Formule',   'Petit-déjeuner continental et buffet chaud disponibles.', 2, TRUE, NOW(), NOW()),

  -- Salle de sport
  ('UII-GYM-01', 'UIC-GYM', 'H-FOURSEASONS', 'Horaires',       'Ouverte tous les jours **24 h / 24**.', 1, TRUE, NOW(), NOW()),
  ('UII-GYM-02', 'UIC-GYM', 'H-FOURSEASONS', 'Localisation',   'Située au **Niveau -1**.', 2, TRUE, NOW(), NOW()),
  ('UII-GYM-06', 'UIC-GYM', 'H-FOURSEASONS', 'Note',           'Chaussures de sport propres obligatoires.', 3, TRUE, NOW(), NOW()),

  -- Piscine
  ('UII-POOL-01', 'UIC-POOL', 'H-FOURSEASONS', 'Horaires',     'Ouverte tous les jours de **8 h 00** à **21 h 00**.', 1, TRUE, NOW(), NOW()),
  ('UII-POOL-02', 'UIC-POOL', 'H-FOURSEASONS', 'Localisation', 'Située au **Niveau -1**.', 2, TRUE, NOW(), NOW()),
  ('UII-POOL-05', 'UIC-POOL', 'H-FOURSEASONS', 'Note',         'Serviettes fournies sur place. Douche obligatoire avant l''accès.', 3, TRUE, NOW(), NOW()),

  -- Politique non-fumeur
  ('UII-NOSMK-01', 'UIC-NOSMOKING', 'H-FOURSEASONS', 'Règle',  'L''établissement est **100 % non-fumeur**, y compris les balcons et parties communes.', 1, TRUE, NOW(), NOW()),

  -- Autres informations
  ('UII-OTHER-01', 'UIC-OTHER', 'H-FOURSEASONS', 'Contact',    '**Pour toute question complémentaire ou besoin spécifique, la réception reste à votre disposition.**', 1, TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- DONE
-- =============================================================================
-- Seed data has been loaded successfully!
-- See demo.md in the project root for login credentials and testing instructions.


-- =============================================================================
-- LIVE SNAPSHOT OVERRIDES (generated from local DB on 2026-02-28)
-- =============================================================================

-- Keep operational/history tables aligned with the current live demo dataset.
DELETE FROM service_bookings;
DELETE FROM notification_outbox;
DELETE FROM messages;
DELETE FROM threads;
DELETE FROM tickets;
DELETE FROM events;
DELETE FROM invoices;

INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-653700AC', 'H-FOURSEASONS', 'S-DEMO', '227', 'housekeeping', 'pending', 'Nettoyage - 2026-02-25 15:00 - 16:00 - Room 227', '{"type": "cleaning_booking", "eventId": "EV-155EEB98", "currency": "EUR", "timeSlot": "15:00 - 16:00", "bookingId": "SB-0F4BAA0F", "guestName": "Guest", "priceCents": 5000, "bookingDate": "2026-02-25", "serviceName": "Nettoyage"}', '2026-02-23 01:04:13.785743+01', '2026-02-23 01:04:13.785743+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-0D5BDB7D', 'H-FOURSEASONS', 'S-DEMO', '227', 'housekeeping', 'pending', 'Nettoyage - 2026-02-24 10:00 - 11:00 - Room 227', '{"type": "cleaning_booking", "eventId": "EV-F980C96D", "currency": "EUR", "timeSlot": "10:00 - 11:00", "bookingId": "SB-B743DF42", "guestName": "Guest", "priceCents": 5000, "bookingDate": "2026-02-24", "serviceName": "Nettoyage"}', '2026-02-24 02:23:26.909004+01', '2026-02-24 02:23:26.909004+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-CB28A005', 'H-FOURSEASONS', 'S-0004', '305', 'housekeeping', 'pending', 'Oreillers', '{"itemId": "pillows", "quantity": 1}', '2026-02-08 13:28:53.172345+01', '2026-02-08 13:28:53.172345+01', NULL, NULL, 'normal', 'service_form');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-E106E542', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 03:54:32.309277+01', '2026-02-16 03:54:32.309277+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-1503B8D6', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 03:54:34.397215+01', '2026-02-16 03:54:34.397215+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-08F7C76F', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 04:08:46.000725+01', '2026-02-16 04:08:46.000725+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-EFB0FBBF', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 05:05:45.38511+01', '2026-02-16 05:05:45.38511+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-A53B6350', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 05:06:03.460563+01', '2026-02-16 05:06:03.460563+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-F81850A7', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-16 11:00 - 3 guests', '{"date": "2026-02-16", "time": "11:00", "type": "restaurant_booking", "guests": 3, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 05:17:05.176041+01', '2026-02-16 05:17:05.176041+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-442D2C1A', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-16 11:00 - 3 guests', '{"date": "2026-02-16", "time": "11:00", "type": "restaurant_booking", "guests": 3, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 05:18:06.352147+01', '2026-02-16 05:18:06.352147+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-D52629FD', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-16 11:00 - 3 guests', '{"date": "2026-02-16", "time": "11:00", "type": "restaurant_booking", "guests": 3, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 05:19:20.574615+01', '2026-02-16 05:19:20.574615+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-5D6DB741', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-16 11:00 - 3 guests', '{"date": "2026-02-16", "time": "11:00", "type": "restaurant_booking", "guests": 3, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 05:20:10.402664+01', '2026-02-16 05:20:10.402664+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-BB1980CE', 'H-FOURSEASONS', 'S-0003', '502', 'reception', 'pending', 'Demande de renseignement', '{"formData": {}, "serviceItem": null}', '2026-02-06 00:26:26.39283+01', '2026-02-06 00:26:26.39283+01', NULL, NULL, 'normal', 'service_form');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-63A4EC39', 'H-FOURSEASONS', 'S-0003', '502', 'reception', 'pending', 'Demande de renseignement', '{"formData": {}, "serviceItem": null}', '2026-02-06 00:26:30.466175+01', '2026-02-06 00:26:30.466175+01', NULL, NULL, 'normal', 'service_form');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-478D05A8', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-54C19E7F", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 05:52:54.250522+01', '2026-02-16 05:52:54.403094+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-92421CFF', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation COYA - 2026-02-28 21:00 - 2 guests', '{"date": "2026-02-28", "time": "21:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-B03CB676", "guestName": "Guest", "restaurantName": "COYA", "specialRequests": "Anniversary dinner", "experienceItemId": "EI-1102"}', '2026-02-16 05:55:22.123161+01', '2026-02-16 05:59:07.67749+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-7645E534', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation COYA - 2026-02-28 21:00 - 2 guests', '{"date": "2026-02-28", "time": "21:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-D5C0FBBD", "guestName": "Guest", "restaurantName": "COYA", "specialRequests": "Anniversary dinner", "experienceItemId": "EI-1102"}', '2026-02-16 05:54:04.678962+01', '2026-02-16 05:59:49.776426+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-DF079382', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation TEST - 2026-03-01 19:00 - 2 guests', '{"date": "2026-03-01", "time": "19:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-A4AA4530", "guestName": "Guest", "restaurantName": "TEST", "specialRequests": "", "experienceItemId": ""}', '2026-02-16 06:02:38.512219+01', '2026-02-16 06:02:38.715798+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-75B2B9CB', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-16 11:00 - 3 guests', '{"date": "2026-02-16", "time": "11:00", "type": "restaurant_booking", "guests": 3, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 05:25:22.527935+01', '2026-02-16 06:04:18.095447+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-FCE7B25A', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-16 11:00 - 3 guests', '{"date": "2026-02-16", "time": "11:00", "type": "restaurant_booking", "guests": 3, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 05:24:28.103961+01', '2026-02-16 06:06:14.777831+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-94DABED0', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-0677E36D", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 06:07:59.907028+01', '2026-02-16 06:07:59.907028+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-A2C5B54B', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-16 11:30 - 3 guests', '{"date": "2026-02-16", "time": "11:30", "type": "restaurant_booking", "guests": 3, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 03:58:32.455483+01', '2026-02-16 03:58:32.455483+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-052C4D9B', 'H-FOURSEASONS', 'S-0003', '502', 'housekeeping', 'pending', 'Nettoyage - 2026-02-23 12:00 - 13:00 - Room 502', '{"type": "cleaning_booking", "eventId": "EV-E35D79BA", "currency": "EUR", "timeSlot": "12:00 - 13:00", "bookingId": "SB-C0E33CA2", "guestName": "Yuki Tanaka", "priceCents": 5000, "bookingDate": "2026-02-23", "serviceName": "Nettoyage"}', '2026-02-23 01:12:43.402783+01', '2026-02-23 01:12:43.402783+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-B5FFA092', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-16 11:00 - 3 guests', '{"date": "2026-02-16", "time": "11:00", "type": "restaurant_booking", "guests": 3, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 04:08:59.70856+01', '2026-02-16 04:08:59.70856+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-F7F145A4', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-16 11:00 - 3 guests', '{"date": "2026-02-16", "time": "11:00", "type": "restaurant_booking", "guests": 3, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 05:05:57.479563+01', '2026-02-16 05:05:57.479563+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-73A7BDDE', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 05:16:49.000043+01', '2026-02-16 05:16:49.000043+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-2001', 'H-FOURSEASONS', 'S-DEMO', '227', 'concierge', 'pending', 'Airport transfer for departure', '{"time": "12:00", "type": "transfer_airport", "direction": "to_airport"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0002', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-2002', 'H-FOURSEASONS', 'S-DEMO', '227', 'housekeeping', 'in_progress', '2 extra towels requested', '{"item": "towels", "type": "item_request", "quantity": 2}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0004', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-90F9F3FD', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 05:17:47.160722+01', '2026-02-16 05:17:47.160722+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-8BC7F9D0', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 05:19:04.726854+01', '2026-02-16 05:19:04.726854+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-E4AC2E13', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 05:19:51.950806+01', '2026-02-16 05:19:51.950806+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-30E48181', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 05:24:09.204345+01', '2026-02-16 05:24:09.204345+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-7316E507', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "eventId": "EV-F38A3D40", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-24 02:18:55.70061+01', '2026-02-24 02:18:55.70061+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-89E76D7A', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-E85F7D8C", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 05:55:19.351343+01', '2026-02-16 05:55:19.501416+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-470820A5', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation COYA - 2026-02-28 21:00 - 2 guests', '{"date": "2026-02-28", "time": "21:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-E51A1E18", "guestName": "Guest", "restaurantName": "COYA", "specialRequests": "Anniversary dinner", "experienceItemId": "EI-1102"}', '2026-02-16 05:52:57.452666+01', '2026-02-16 06:00:28.005491+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-94B505B4', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation COYA - 2026-02-28 21:00 - 2 guests', '{"date": "2026-02-28", "time": "21:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-B001DF32", "guestName": "Guest", "restaurantName": "COYA", "specialRequests": "Anniversary dinner", "experienceItemId": "EI-1102"}', '2026-02-16 05:55:40.673142+01', '2026-02-16 06:01:44.790979+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-78470E1E', 'H-FOURSEASONS', 'S-0003', '502', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-16 11:30 - 1 guest', '{"date": "2026-02-16", "time": "11:30", "type": "restaurant_booking", "guests": 1, "guestName": "Yuki Tanaka", "restaurantName": "SEA FU", "specialRequests": "rien", "experienceItemId": "EI-1101"}', '2026-02-16 05:37:23.717668+01', '2026-02-16 06:03:25.004885+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-F451DBE0', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 05:25:03.45321+01', '2026-02-16 06:05:03.278097+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-1A8D3B01', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-F6433F33", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 06:07:55.239851+01', '2026-02-16 06:07:55.239851+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-8CF0F508', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-A1EA22EB", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 06:07:57.34838+01', '2026-02-16 06:07:57.44685+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-E2EB51DC', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-180E66F4", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 06:09:07.599811+01', '2026-02-16 06:09:07.778173+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-A7A408C4', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-7D69CFBF", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 06:09:27.499924+01', '2026-02-16 06:09:27.628938+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-893CED7E', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-43E4BFA1", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 06:10:23.978691+01', '2026-02-16 06:10:24.443411+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-14F7BB96', 'H-FOURSEASONS', 'S-0003', '502', 'room_service', 'pending', 'Commande: 1x Chocolatine, 1x Toast au chevre et son assortim', '{"items": [{"id": "chocolatine", "name": "Chocolatine", "price": 1.5, "quantity": 1}, {"id": "goat_toast", "name": "Toast au chevre et son assortiment de fruits rouges", "price": 8, "quantity": 1}, {"id": "caesar_salad", "name": "Salade cesar du chef", "price": 10, "quantity": 1}], "total": 19.5}', '2026-02-23 20:47:50.487018+01', '2026-02-23 20:47:50.487018+01', NULL, NULL, 'normal', 'service_form');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-ECD1DBA7', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-E83B5D1C", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 06:10:32.243645+01', '2026-02-16 06:10:32.40181+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-26FBEBD5', 'H-FOURSEASONS', 'S-DEMO', '227', 'housekeeping', 'pending', 'Nettoyage - 2026-02-25 10:00 - 11:00 - Room 227', '{"type": "cleaning_booking", "eventId": "EV-606B21DB", "currency": "EUR", "timeSlot": "10:00 - 11:00", "bookingId": "SB-615B4E16", "guestName": "Guest", "priceCents": 5000, "bookingDate": "2026-02-25", "serviceName": "Nettoyage"}', '2026-02-24 02:19:10.56277+01', '2026-02-24 02:19:10.56277+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-66CB4A96', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-F0D1C0F1", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-24 02:23:35.7634+01', '2026-02-24 02:23:36.234065+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-CCCC0502', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "eventId": "EV-19CCDD8A", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 18:25:56.187134+01', '2026-02-16 18:25:56.187134+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-2D939BB3', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-4EDC2328", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 18:25:56.417138+01', '2026-02-16 18:25:56.483729+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-5ACAA962', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-16 18:00 - 3 guests', '{"date": "2026-02-16", "time": "18:00", "type": "restaurant_booking", "guests": 3, "eventId": "EV-ADE7D644", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 18:26:27.368091+01', '2026-02-16 18:26:27.368091+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-96AE7F06', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-20 19:30 - 2 guests', '{"date": "2026-02-20", "time": "19:30", "type": "restaurant_booking", "guests": 2, "eventId": "EV-B6C42542", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Window seat please", "experienceItemId": "EI-1101"}', '2026-02-16 18:27:02.816757+01', '2026-02-16 18:27:02.816757+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-9B6B2F99', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-25 20:00 - 4 guests', '{"date": "2026-02-25", "time": "20:00", "type": "restaurant_booking", "guests": 4, "eventId": "EV-8100EECE", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Birthday celebration, quiet table please", "experienceItemId": "EI-1101"}', '2026-02-16 18:27:02.968288+01', '2026-02-16 18:27:03.082749+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-E41CBDEA', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-16 18:00 - 3 guests', '{"date": "2026-02-16", "time": "18:00", "type": "restaurant_booking", "guests": 3, "eventId": "EV-8E6FA4D0", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-16 18:27:27.418444+01', '2026-02-16 18:27:27.418444+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-895E1193', 'H-FOURSEASONS', 'S-0003', '502', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-16 19:00 - 3 guests', '{"date": "2026-02-16", "time": "19:00", "type": "restaurant_booking", "guests": 3, "eventId": "EV-4CD607EE", "guestName": "Yuki Tanaka", "restaurantName": "SEA FU", "specialRequests": "", "experienceItemId": "EI-1101"}', '2026-02-16 18:34:10.310347+01', '2026-02-16 18:50:55.83227+01', 'SU-0001', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-C04F5E5E', 'H-FOURSEASONS', 'S-0003', '502', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-19 11:30 - 6 guests', '{"date": "2026-02-19", "time": "11:30", "type": "restaurant_booking", "guests": 6, "eventId": "EV-CFA2C581", "guestName": "Yuki Tanaka", "restaurantName": "SEA FU", "specialRequests": "", "experienceItemId": "EI-1101"}', '2026-02-16 20:14:47.762484+01', '2026-02-16 21:03:02.496413+01', 'SU-0001', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-06D1F7AD', 'H-FOURSEASONS', 'S-0003', '502', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-02-20 23:00 - 2 guests', '{"date": "2026-02-20", "time": "23:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-B5932298", "guestName": "Yuki Tanaka", "restaurantName": "SEA FU", "specialRequests": "", "experienceItemId": "EI-1101"}', '2026-02-16 23:29:09.184412+01', '2026-02-16 23:39:22.926188+01', 'SU-0001', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-BE140857', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-03-01 20:00 - 2 guests', '{"date": "2026-03-01", "time": "20:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-6F04D948", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Regression test 1771896356002", "experienceItemId": "EI-1101"}', '2026-02-24 02:25:56.030027+01', '2026-02-24 02:25:56.223266+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-3C1AA2F7', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-03-01 20:00 - 2 guests', '{"date": "2026-03-01", "time": "20:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-1A19E99C", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Regression test 1771896537689", "experienceItemId": "EI-1101"}', '2026-02-24 02:28:57.737294+01', '2026-02-24 02:28:57.984201+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-0FD5C68D', 'H-FOURSEASONS', 'S-0003', '502', 'room_service', 'pending', 'Commande: 1x Magret de canard, 1x Burger a la pistache', '{"items": [{"id": "duck_breast", "name": "Magret de canard", "price": 17.5, "quantity": 1}, {"id": "pistachio_burger", "name": "Burger a la pistache", "price": 15.5, "quantity": 1}], "total": 33}', '2026-02-23 20:48:09.879977+01', '2026-02-23 20:48:09.879977+01', NULL, NULL, 'normal', 'service_form');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-BF0CF2CD', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-03-05 19:00 - 1 guest', '{"date": "2026-03-05", "time": "19:00", "type": "restaurant_booking", "guests": 1, "eventId": "EV-6D1D4508", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Pagination test", "experienceItemId": "EI-1101"}', '2026-02-24 02:30:50.464236+01', '2026-02-24 02:30:50.464236+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-E69D1520', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-03-06 20:00 - 2 guests', '{"date": "2026-03-06", "time": "20:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-1D454424", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Cursor pagination test", "experienceItemId": "EI-1101"}', '2026-02-24 02:30:50.881185+01', '2026-02-24 02:30:50.881185+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-4635B3C3', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-03-07 21:00 - 3 guests', '{"date": "2026-03-07", "time": "21:00", "type": "restaurant_booking", "guests": 3, "eventId": "EV-C64F3158", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Default limit test", "experienceItemId": "EI-1101"}', '2026-02-24 02:30:51.16444+01', '2026-02-24 02:30:51.16444+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-C80A13A2', 'H-FOURSEASONS', 'S-DEMO', '227', 'concierge', 'pending', 'Organiser un transport', '{"date": "2026-02-25", "time": "10:00", "type": "transport", "pickup": "Hotel George V", "dropoff": "Tour Eiffel, Paris", "vehicle": "suv", "passengers": 1}', '2026-02-24 15:34:50.999525+01', '2026-02-24 15:34:50.999525+01', NULL, NULL, 'normal', 'service_form');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-9A9EDBAD', 'H-FOURSEASONS', 'S-DEMO', '227', 'concierge', 'pending', 'Organiser un transport', '{"type": "transport", "adults": 1, "timing": "asap", "children": 0, "destination": "Tour Eiffel, Paris", "wantsReturn": false}', '2026-02-24 16:07:35.393022+01', '2026-02-24 16:07:35.393022+01', NULL, NULL, 'normal', 'service_form');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-8080A958', 'H-FOURSEASONS', 'S-DEMO', '227', 'concierge', 'pending', 'Organiser un transport', '{"type": "transport", "adults": 1, "timing": "asap", "children": 0, "coordinates": {"lat": 48.8566, "lng": 2.3522}, "destination": "Aeroport Charles de Gaulle", "wantsReturn": false}', '2026-02-24 23:25:55.251096+01', '2026-02-24 23:25:55.251096+01', NULL, NULL, 'normal', 'service_form');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-1001', 'H-FOURSEASONS', 'S-0001', '701', 'concierge', 'pending', 'Restaurant reservation at Le Cinq', '{"time": "20:00", "type": "restaurant_booking", "guests": 2, "restaurant": "Le Cinq"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0002', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-9BF461C3', 'H-FOURSEASONS', 'S-DEMO', '227', 'housekeeping', 'pending', 'Nettoyage - 2026-02-24 10:00 - 11:00 - Room 227', '{"type": "cleaning_booking", "eventId": "EV-8F10EDE6", "currency": "EUR", "timeSlot": "10:00 - 11:00", "bookingId": "SB-D0A7C7F7", "guestName": "Guest", "priceCents": 5000, "bookingDate": "2026-02-24", "serviceName": "Nettoyage"}', '2026-02-24 02:23:19.760988+01', '2026-02-24 02:23:19.760988+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-FC02C79F', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-24 11:00 - 3 guests', '{"date": "2026-02-24", "time": "11:00", "type": "restaurant_booking", "guests": 3, "eventId": "EV-0BF62512", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire", "experienceItemId": "EI-1101"}', '2026-02-24 02:24:40.121405+01', '2026-02-24 02:24:40.121405+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-4809BA61', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-03-01 20:00 - 2 guests', '{"date": "2026-03-01", "time": "20:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-AB36118D", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Regression test 1771896297653", "experienceItemId": "EI-1101"}', '2026-02-24 02:24:57.660442+01', '2026-02-24 02:24:57.934543+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-31DE9320', 'H-FOURSEASONS', 'S-DEMO', '227', 'restaurants', 'resolved', 'Reservation SEA FU - 2026-03-01 20:00 - 2 guests', '{"date": "2026-03-01", "time": "20:00", "type": "restaurant_booking", "guests": 2, "eventId": "EV-9810A3B8", "guestName": "Guest", "restaurantName": "SEA FU", "specialRequests": "Regression test 1771896326346", "experienceItemId": "EI-1101"}', '2026-02-24 02:25:26.387284+01', '2026-02-24 02:25:27.01086+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-1002', 'H-FOURSEASONS', 'S-0001', '701', 'spa-gym', 'in_progress', 'Couples massage appointment', '{"time": "15:00", "type": "spa_booking", "service": "Couples Massage"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0005', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-1003', 'H-FOURSEASONS', 'S-0001', '701', 'housekeeping', 'completed', 'Extra pillows requested', '{"item": "pillows", "type": "item_request", "quantity": 2}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0004', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-2003', 'H-FOURSEASONS', 'S-DEMO', '227', 'room-service', 'pending', 'Breakfast order for tomorrow 8:00', '{"type": "room_service", "items": ["Continental Breakfast x2"], "deliveryTime": "08:00"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0006', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-3001', 'H-FOURSEASONS', 'S-0006', 'PH1', 'concierge', 'completed', 'Private limousine to Louvre', '{"type": "limousine", "duration": "half-day", "destination": "Louvre Museum"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0002', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-3002', 'H-FOURSEASONS', 'S-0006', 'PH1', 'room-service', 'completed', 'Private dinner for 6 guests', '{"type": "private_dining", "guests": 6, "dietary": ["halal"]}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0006', NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-EFCC9C6D', 'H-FOURSEASONS', 'S-0003', '502', 'restaurants', 'pending', 'Reservation SEA FU - 2026-02-28 14:00 - 1 guest', '{"date": "2026-02-28", "time": "14:00", "type": "restaurant_booking", "guests": 1, "eventId": "EV-0F5F5E80", "guestName": "Yuki Tanaka", "restaurantName": "SEA FU", "specialRequests": "", "experienceItemId": "EI-1101"}', '2026-02-28 13:32:06.564093+01', '2026-02-28 13:32:06.564093+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-06486B93', 'H-FOURSEASONS', 'S-0003', '502', 'restaurants', 'pending', 'Reservation SEA FU - 2026-03-01 14:00 - 1 guest', '{"date": "2026-03-01", "time": "14:00", "type": "restaurant_booking", "guests": 1, "eventId": "EV-11E19230", "guestName": "Yuki Tanaka", "restaurantName": "SEA FU", "specialRequests": "", "experienceItemId": "EI-1101"}', '2026-02-28 13:33:21.666797+01', '2026-02-28 13:33:21.666797+01', NULL, NULL, 'normal', 'manual');
INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at, assigned_staff_user_id, service_item_id, priority, source) VALUES ('T-63B5B930', 'H-FOURSEASONS', 'S-0003', '502', 'concierge', 'pending', 'Organiser un transport', '{"type": "transport", "adults": 1, "timing": "asap", "children": 0, "coordinates": {"lat": 48.8566, "lng": 2.3522}, "destination": "home", "wantsReturn": true}', '2026-02-28 13:35:37.778611+01', '2026-02-28 13:35:37.778611+01', NULL, NULL, 'normal', 'service_form');

INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-E107F74C', 'H-FOURSEASONS', 'S-0004', 'spa-gym', 'pending', 'Spa & Gym', '2026-02-08 13:31:08.875988+01', '2026-02-08 13:33:10.239821+01', 'SU-0005', '2026-02-08 13:33:10.378053+01');
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-2001', 'H-FOURSEASONS', 'S-DEMO', 'concierge', 'pending', 'Airport transfer', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0002', '2026-02-28 13:16:17.790577+01');
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-1D0B40F8', 'H-FOURSEASONS', 'S-0004', 'housekeeping', 'pending', 'Housekeeping', '2026-02-08 13:30:04.230795+01', '2026-02-08 13:34:22.170182+01', 'SU-0004', '2026-02-08 13:34:22.242864+01');
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-478C3CF9', 'H-FOURSEASONS', 'S-0003', 'restaurants', 'pending', 'Restaurants - Room 502', '2026-02-16 05:37:23.731941+01', '2026-02-28 13:33:21.674316+01', 'SU-0006', '2026-02-28 13:36:10.747026+01');
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-BC7D47F1', 'H-FOURSEASONS', 'S-0003', 'reception', 'pending', 'Reception', '2026-02-24 15:01:17.09114+01', '2026-02-24 15:01:17.09114+01', 'SU-0003', '2026-02-28 13:36:59.080161+01');
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-3FE97D91', 'H-FOURSEASONS', 'S-0003', 'housekeeping', 'pending', 'Housekeeping - Room 502', '2026-02-23 01:12:43.407465+01', '2026-02-23 13:56:46.861932+01', 'SU-0004', '2026-02-28 13:37:08.007498+01');
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-03554585', 'H-FOURSEASONS', 'S-0003', 'concierge', 'pending', 'Concierge', '2026-02-07 19:12:47.988033+01', '2026-02-28 13:32:46.458996+01', 'SU-0002', '2026-02-28 13:37:14.85709+01');
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-2EE1728A', 'H-FOURSEASONS', 'S-0004', 'concierge', 'pending', 'Concierge', '2026-02-07 19:37:57.889741+01', '2026-02-07 19:38:53.622639+01', NULL, '2026-02-07 19:39:32.780487+01');
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-32240424', 'H-FOURSEASONS', 'S-DEMO', 'restaurants', 'pending', 'Restaurants - Room 227', '2026-02-16 03:54:32.370218+01', '2026-02-24 02:30:51.171029+01', 'SU-0006', '2026-02-24 02:30:51.216862+01');
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-1001', 'H-FOURSEASONS', 'S-0001', 'concierge', 'pending', 'Restaurant recommendation', '2026-01-28 20:27:18.406532+01', '2026-02-04 19:59:14.654298+01', 'SU-0002', NULL);
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-1002', 'H-FOURSEASONS', 'S-0001', 'spa-gym', 'in_progress', 'Spa appointment inquiry', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01', 'SU-0005', NULL);
INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at, assigned_staff_user_id, guest_last_read_at) VALUES ('TH-2002', 'H-FOURSEASONS', 'S-DEMO', 'housekeeping', 'in_progress', 'Extra towels request', '2026-01-28 20:27:18.406532+01', '2026-02-24 02:23:27.031676+01', 'SU-0004', NULL);

INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-EA3004E5', 'TH-03554585', 'guest', 'Guest', 'Bonjour', '{}', '2026-02-07 19:12:48.142724+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-D4F01FFA', 'TH-03554585', 'guest', 'Guest', 'aaa', '{}', '2026-02-07 19:24:34.368365+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-72F8CBE5', 'TH-2EE1728A', 'guest', 'Guest', 'bonjour', '{}', '2026-02-07 19:38:11.096809+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2A28A68D', 'TH-2EE1728A', 'staff', 'Jean-Pierre Dupont', 'Bonjour', '{}', '2026-02-07 19:38:29.816123+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-6F4EBD32', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-E106E542"}', '2026-02-16 03:54:32.376984+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-4A8D8E52', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-1503B8D6"}', '2026-02-16 03:54:34.401033+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-7E052837', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-08F7C76F"}', '2026-02-16 04:08:46.005699+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-6EF5ECFB', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-EFB0FBBF"}', '2026-02-16 05:05:45.39174+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-8C89B4D0', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-A53B6350"}', '2026-02-16 05:06:03.465194+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-3EF26ECF', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 11:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-F81850A7"}', '2026-02-16 05:17:05.182181+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-548A9F2E', 'TH-E107F74C', 'guest', 'Emma Dubois', 'bonjour spa gym', '{}', '2026-02-08 13:32:00.935903+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-FAA8D15A', 'TH-1D0B40F8', 'staff', 'Claire Moreau', 'hello', '{}', '2026-02-08 13:33:18.769866+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-B6B212C8', 'TH-1D0B40F8', 'staff', 'Claire Moreau', 'hello', '{}', '2026-02-08 13:33:21.269645+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-EC423C5E', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 11:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-442D2C1A"}', '2026-02-16 05:18:06.357858+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-6DA17C16', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 11:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-D52629FD"}', '2026-02-16 05:19:20.578921+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1E7E972D', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 11:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-5D6DB741"}', '2026-02-16 05:20:10.407143+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-43790CC5', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 11:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-FCE7B25A"}', '2026-02-16 05:24:28.154158+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-ADEFCA3B', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 11:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-75B2B9CB"}', '2026-02-16 05:25:22.531424+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-27733C6C', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-478D05A8"}', '2026-02-16 05:52:54.27998+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-05AF6792', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-478D05A8"}', '2026-02-16 05:52:54.426074+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-492098CE', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at COYA on 2026-02-28 at 21:00 for 2 guests.

Special requests: Anniversary dinner', '{"type": "restaurant_booking", "ticketId": "T-7645E534"}', '2026-02-16 05:54:04.688153+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1E9D9E37', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at COYA on 2026-02-28 at 21:00 for 2 guests.

Special requests: Anniversary dinner', '{"type": "restaurant_booking", "ticketId": "T-92421CFF"}', '2026-02-16 05:55:22.125612+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-141A3C92', 'TH-32240424', 'staff', 'Jean-Pierre Dupont', 'Your reservation at COYA on 2026-02-28 at 21:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-92421CFF"}', '2026-02-16 05:59:07.692954+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-DBB951F3', 'TH-32240424', 'staff', 'Jean-Pierre Dupont', 'Your reservation at COYA on 2026-02-28 at 21:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-470820A5"}', '2026-02-16 06:00:28.036583+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-15773DE1', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at TEST on 2026-03-01 at 19:00 for 2 guests.', '{"type": "restaurant_booking", "ticketId": "T-DF079382"}', '2026-02-16 06:02:38.519631+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-6B4842B2', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-E2EB51DC"}', '2026-02-16 06:09:07.60909+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-495E62E0', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-E2EB51DC"}', '2026-02-16 06:09:07.783169+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-A61FA926', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-893CED7E"}', '2026-02-16 06:10:24.004671+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-3464E1C2', 'TH-478C3CF9', 'guest', 'Yuki Tanaka', 'hi', '{}', '2026-02-16 06:17:19.869602+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2E4D3599', 'TH-32240424', 'staff', 'Jean-Pierre Dupont', 'Your reservation at TEST on 2026-03-01 at 19:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-DF079382"}', '2026-02-16 06:02:38.721813+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-C6B50FEA', 'TH-32240424', 'staff', 'Jean-Pierre Dupont', 'Your reservation at SEA FU on 2026-02-16 at 11:00 for 3 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-75B2B9CB"}', '2026-02-16 06:04:18.135175+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-EAF34DB4', 'TH-32240424', 'staff', 'Jean-Pierre Dupont', 'Your reservation at SEA FU on 2026-02-16 at 11:00 for 3 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-FCE7B25A"}', '2026-02-16 06:06:14.796723+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-811143C0', 'TH-03554585', 'staff', 'Jean-Pierre Dupont', 'test', '{}', '2026-02-07 19:19:56.010084+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-32A3B168', 'TH-2EE1728A', 'guest', 'Guest', 'Bonjour', '{}', '2026-02-07 19:37:57.921605+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-B2EC8E2E', 'TH-2EE1728A', 'guest', 'Guest', 'test', '{}', '2026-02-07 19:38:19.021845+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-4A7591DB', 'TH-2EE1728A', 'guest', 'Guest', 'Réserver un restaurant', '{}', '2026-02-07 19:38:46.387329+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-0DC6FB68', 'TH-2EE1728A', 'guest', 'Guest', 'Organiser un transport', '{}', '2026-02-07 19:38:53.621908+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-4889889C', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 11:30 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-A2C5B54B"}', '2026-02-16 03:58:32.465464+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-52042951', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 11:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-B5FFA092"}', '2026-02-16 04:08:59.71498+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-9F8BE2B9', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 11:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-F7F145A4"}', '2026-02-16 05:05:57.483271+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-7E196AC9', 'TH-1D0B40F8', 'staff', 'Claire Moreau', 'hello', '{}', '2026-02-08 13:33:00.186251+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-6677B87F', 'TH-1001', 'staff', 'Jean-Pierre Dupont', 'Here is your payment link:
Reason: Food & Beverages
Amount: 600.00 EUR
http://localhost:3000/pay/pl_demo_1002', '{"type": "payment_link", "paymentLinkId": "PL-1002"}', '2026-02-04 19:59:14.611858+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-AB564699', 'TH-E107F74C', 'guest', 'Emma Dubois', 'same thread', '{}', '2026-02-08 13:33:10.239081+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-0D1A46D9', 'TH-1D0B40F8', 'guest', 'Emma Dubois', 'hi housekeepig', '{}', '2026-02-08 13:34:22.151431+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1EEC4A7F', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-73A7BDDE"}', '2026-02-16 05:16:49.005113+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-3EA4FD98', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-90F9F3FD"}', '2026-02-16 05:17:47.164884+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-20F73001', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-8BC7F9D0"}', '2026-02-16 05:19:04.732462+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-4DFD31D7', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-E4AC2E13"}', '2026-02-16 05:19:51.954803+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-88C7EDC9', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-30E48181"}', '2026-02-16 05:24:09.209444+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-53C387F4', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-F451DBE0"}', '2026-02-16 05:25:03.456692+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-469BF9C2', 'TH-478C3CF9', 'guest', 'Yuki Tanaka', 'I would like to book a table at SEA FU on 2026-02-16 at 11:30 for 1 guest.

Special requests: rien', '{"type": "restaurant_booking", "ticketId": "T-78470E1E"}', '2026-02-16 05:37:23.735517+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-EAB829D8', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at COYA on 2026-02-28 at 21:00 for 2 guests.

Special requests: Anniversary dinner', '{"type": "restaurant_booking", "ticketId": "T-470820A5"}', '2026-02-16 05:52:57.472093+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-6C627E2B', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-89E76D7A"}', '2026-02-16 05:55:19.375598+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-87DD59FF', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-89E76D7A"}', '2026-02-16 05:55:19.524612+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-349183E7', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at COYA on 2026-02-28 at 21:00 for 2 guests.

Special requests: Anniversary dinner', '{"type": "restaurant_booking", "ticketId": "T-94B505B4"}', '2026-02-16 05:55:40.676736+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-12DD7EAA', 'TH-32240424', 'staff', 'Jean-Pierre Dupont', 'Your reservation at COYA on 2026-02-28 at 21:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-7645E534"}', '2026-02-16 05:59:49.786901+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-A4B403F0', 'TH-32240424', 'staff', 'Jean-Pierre Dupont', 'Your reservation at COYA on 2026-02-28 at 21:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-94B505B4"}', '2026-02-16 06:01:44.810515+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-81F039C3', 'TH-478C3CF9', 'staff', 'Jean-Pierre Dupont', 'Your reservation at SEA FU on 2026-02-16 at 11:30 for 1 guest has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-78470E1E"}', '2026-02-16 06:03:25.018753+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2C9BD70C', 'TH-32240424', 'staff', 'Jean-Pierre Dupont', 'Your reservation at SEA FU on 2026-02-20 at 19:30 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-F451DBE0"}', '2026-02-16 06:05:03.297101+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-7C54330A', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-1A8D3B01"}', '2026-02-16 06:07:55.246039+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-8964C496', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-8CF0F508"}', '2026-02-16 06:07:57.351442+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-8F3606E9', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-8CF0F508"}', '2026-02-16 06:07:57.459557+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-522C74EF', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-94DABED0"}', '2026-02-16 06:07:59.927999+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-3FC7E5B2', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-A7A408C4"}', '2026-02-16 06:09:27.508936+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-FA8BF9F0', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-A7A408C4"}', '2026-02-16 06:09:27.644157+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-7398F4A2', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-893CED7E"}', '2026-02-16 06:10:24.451774+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-9B441196', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-ECD1DBA7"}', '2026-02-16 06:10:32.247778+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-74518219', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-ECD1DBA7"}', '2026-02-16 06:10:32.428929+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-E3356537', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-CCCC0502"}', '2026-02-16 18:25:56.219311+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-EFFE08CF', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-2D939BB3"}', '2026-02-16 18:25:56.418657+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-16B5EEA2', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-2D939BB3"}', '2026-02-16 18:25:56.488718+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-92EF4B7C', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 18:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-5ACAA962"}', '2026-02-16 18:26:27.418072+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2CBCC45F', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-96AE7F06"}', '2026-02-16 18:27:02.821364+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1655CC63', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-9B6B2F99"}', '2026-02-16 18:27:02.969832+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-865829D5', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-9B6B2F99"}', '2026-02-16 18:27:03.087444+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-968EAEA3', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-16 at 18:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-E41CBDEA"}', '2026-02-16 18:27:27.423894+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-64AEE94F', 'TH-478C3CF9', 'guest', 'Yuki Tanaka', 'I would like to book a table at SEA FU on 2026-02-16 at 19:00 for 3 guests.', '{"type": "restaurant_booking", "ticketId": "T-895E1193"}', '2026-02-16 18:34:10.31814+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-DC166CDD', 'TH-478C3CF9', 'staff', 'Jean-Pierre Dupont', 'Your reservation at SEA FU on 2026-02-16 at 19:00 for 3 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-895E1193"}', '2026-02-16 18:50:55.840685+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-77F250FC', 'TH-478C3CF9', 'guest', 'Yuki Tanaka', 'I would like to book a table at SEA FU on 2026-02-19 at 11:30 for 6 guests.', '{"type": "restaurant_booking", "ticketId": "T-C04F5E5E"}', '2026-02-16 20:14:47.786906+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-636EE6A8', 'TH-478C3CF9', 'staff', 'Jean-Pierre Dupont', 'Your reservation at SEA FU on 2026-02-19 at 11:30 for 6 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-C04F5E5E"}', '2026-02-16 21:02:54.941486+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-3690A059', 'TH-478C3CF9', 'guest', 'Yuki Tanaka', 'I would like to book a table at SEA FU on 2026-02-20 at 23:00 for 2 guests.', '{"type": "restaurant_booking", "ticketId": "T-06D1F7AD"}', '2026-02-16 23:29:09.23014+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-82EE0696', 'TH-478C3CF9', 'staff', 'Jean-Pierre Dupont', 'Your reservation at SEA FU on 2026-02-20 at 23:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-06D1F7AD"}', '2026-02-16 23:39:22.931096+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-A674B6F7', 'TH-2002', 'guest', 'Guest', 'Demande de nettoyage pour le 2026-02-25, créneau 15:00 - 16:00.
Chambre : 227
Prix : 50.00 EUR', '{"type": "cleaning_booking", "ticketId": "T-653700AC", "bookingId": "SB-0F4BAA0F"}', '2026-02-23 01:04:13.813615+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-94645D7D', 'TH-3FE97D91', 'guest', 'Yuki Tanaka', 'Demande de nettoyage pour le 2026-02-23, créneau 12:00 - 13:00.
Chambre : 502
Prix : 50.00 EUR', '{"type": "cleaning_booking", "ticketId": "T-052C4D9B", "bookingId": "SB-C0E33CA2"}', '2026-02-23 01:12:43.411403+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1001', 'TH-1001', 'guest', 'Sophie Martin', 'Bonjour, pouvez-vous me recommander un bon restaurant pour ce soir ?', '{}', '2026-01-28 20:27:18.406532+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1002', 'TH-1001', 'staff', 'Marie Laurent', 'Bonjour Madame Martin ! Je vous recommande Le Cinq, notre restaurant 3 étoiles Michelin. Souhaitez-vous que je fasse une réservation ?', '{}', '2026-01-28 20:27:18.406532+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1003', 'TH-1001', 'guest', 'Sophie Martin', 'Oui, pour 2 personnes à 20h si possible.', '{}', '2026-01-28 20:27:18.406532+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1010', 'TH-1002', 'guest', 'Sophie Martin', 'Bonjour, avez-vous des disponibilités pour un massage en couple demain ?', '{}', '2026-01-28 20:27:18.406532+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1011', 'TH-1002', 'staff', 'Sophie Martin (Spa)', 'Bonjour ! Oui, nous avons des créneaux disponibles à 15h ou 17h. Quelle heure vous conviendrait ?', '{}', '2026-01-28 20:27:18.406532+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-425BF2BE', 'TH-3FE97D91', 'staff', 'Jean-Pierre Dupont', 'you request is resolved', '{}', '2026-02-23 13:55:06.158102+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-CCFA1ACF', 'TH-3FE97D91', 'staff', 'Jean-Pierre Dupont', 'another message', '{}', '2026-02-23 13:56:46.858841+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-3E08ED3D', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:32.431558+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-94AE3393', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:32.59663+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-5DF502FC', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:32.781553+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-F26C11D9', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:37.83237+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-AD3E78B6', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:38.933983+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-CD4F271E', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:39.182027+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-563FF4CC', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:39.431841+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-AD42DF31', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:39.681615+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-BBCBE6FD', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:32.840893+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-50090726', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:40.893224+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-5A903001', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:42.662105+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-29217F10', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:43.762829+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-CF91198B', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-20 at 19:30 for 2 guests.

Special requests: Window seat please', '{"type": "restaurant_booking", "ticketId": "T-7316E507"}', '2026-02-24 02:18:55.753043+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-CDF5BDB0', 'TH-2002', 'guest', 'Guest', 'Demande de nettoyage pour le 2026-02-25, créneau 10:00 - 11:00.
Chambre : 227
Prix : 50.00 EUR', '{"type": "cleaning_booking", "ticketId": "T-26FBEBD5", "bookingId": "SB-615B4E16"}', '2026-02-24 02:19:10.567129+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-86CBADE4', 'TH-2002', 'guest', 'Guest', 'Demande de nettoyage pour le 2026-02-24, créneau 10:00 - 11:00.
Chambre : 227
Prix : 50.00 EUR', '{"type": "cleaning_booking", "ticketId": "T-9BF461C3", "bookingId": "SB-D0A7C7F7"}', '2026-02-24 02:23:19.807921+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-6CF8C1A1', 'TH-2002', 'guest', 'Guest', 'Demande de nettoyage pour le 2026-02-24, créneau 10:00 - 11:00.
Chambre : 227
Prix : 50.00 EUR', '{"type": "cleaning_booking", "ticketId": "T-0D5BDB7D", "bookingId": "SB-B743DF42"}', '2026-02-24 02:23:27.016245+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-BE9C9491', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-25 at 20:00 for 4 guests.

Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "ticketId": "T-66CB4A96"}', '2026-02-24 02:23:35.78493+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-B96C5115', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-02-25 at 20:00 for 4 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-66CB4A96"}', '2026-02-24 02:23:36.272688+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-0BCB1407', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-02-24 at 11:00 for 3 guests.

Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "ticketId": "T-FC02C79F"}', '2026-02-24 02:24:40.175217+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-73D1FC84', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-03-01 at 20:00 for 2 guests.

Special requests: Regression test 1771896297653', '{"type": "restaurant_booking", "ticketId": "T-4809BA61"}', '2026-02-24 02:24:57.827185+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-4B367D58', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-03-01 at 20:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-4809BA61"}', '2026-02-24 02:24:57.963083+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-BA7F5C10', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-03-01 at 20:00 for 2 guests.

Special requests: Regression test 1771896326346', '{"type": "restaurant_booking", "ticketId": "T-31DE9320"}', '2026-02-24 02:25:26.759612+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-5A40D38C', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-03-01 at 20:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-31DE9320"}', '2026-02-24 02:25:27.069115+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-CA5326E7', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-03-01 at 20:00 for 2 guests.

Special requests: Regression test 1771896356002', '{"type": "restaurant_booking", "ticketId": "T-BE140857"}', '2026-02-24 02:25:56.074567+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-18BC83EE', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-03-01 at 20:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-BE140857"}', '2026-02-24 02:25:56.274513+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-26FCA251', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-03-01 at 20:00 for 2 guests.

Special requests: Regression test 1771896537689', '{"type": "restaurant_booking", "ticketId": "T-3C1AA2F7"}', '2026-02-24 02:28:57.773653+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-9EE00358', 'TH-32240424', 'staff', 'Chef Antoine Dubois', 'Your reservation at SEA FU on 2026-03-01 at 20:00 for 2 guests has been confirmed. We look forward to welcoming you!', '{"type": "restaurant_booking_confirmed", "ticketId": "T-3C1AA2F7"}', '2026-02-24 02:28:57.994656+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-A31567F5', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-03-05 at 19:00 for 1 guest.

Special requests: Pagination test', '{"type": "restaurant_booking", "ticketId": "T-BF0CF2CD"}', '2026-02-24 02:30:50.523747+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-92BE8D0C', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-03-06 at 20:00 for 2 guests.

Special requests: Cursor pagination test', '{"type": "restaurant_booking", "ticketId": "T-E69D1520"}', '2026-02-24 02:30:50.887049+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-BA61687C', 'TH-32240424', 'guest', 'Guest', 'I would like to book a table at SEA FU on 2026-03-07 at 21:00 for 3 guests.

Special requests: Default limit test', '{"type": "restaurant_booking", "ticketId": "T-4635B3C3"}', '2026-02-24 02:30:51.168695+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-7EC08432', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:39.882583+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-373CB7CE', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Reserver un restaurant', '{}', '2026-02-24 15:01:40.864194+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-9E776711', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transfert aeroport', '{}', '2026-02-24 15:01:42.591967+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-5FFC5F71', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:28.984148+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-64FFC21C', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:31.481561+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-1BAC509B', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:01:32.181013+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-7F4A9D30', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:31.229008+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-95877F3D', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:48.361906+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-EF05C945', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:49.142163+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-B168BEB9', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:49.762454+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-66C8B050', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:49.936657+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-17A10B27', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:50.064141+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-3A8E83FA', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:50.23524+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-275DA8CE', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:50.384878+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-DD2F93F2', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:50.52776+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-FF90F5B5', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transfert aeroport', '{}', '2026-02-24 15:56:52.711506+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-47455D81', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transfert aeroport', '{}', '2026-02-24 15:56:54.961968+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-6710FDC0', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:57:01.661876+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-F0BD1243', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:50.714314+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-641925DC', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:54.0633+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-62885085', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transfert aeroport', '{}', '2026-02-24 15:56:56.263839+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-E5A4B4AD', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:55.520161+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-B6E32317', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transport', '{}', '2026-02-24 15:56:57.36228+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-8E9F39C2', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Organiser un transfert aeroport', '{}', '2026-02-24 15:57:02.473424+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2001', 'TH-2001', 'guest', 'Guest', 'Bonjour, pouvez-vous organiser un transfert aéroport pour mon départ ?', '{}', '2026-01-28 20:27:18.406532+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2002', 'TH-2001', 'staff', 'Marie Laurent', 'Bien sûr ! À quelle heure est votre vol ?', '{}', '2026-01-28 20:27:18.406532+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2003', 'TH-2002', 'guest', 'Guest', 'Bonjour, je voudrais 2 serviettes supplémentaires.', '{"item": "towels", "type": "item_request", "quantity": 2}', '2026-01-28 20:27:18.406532+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2004', 'TH-2002', 'staff', 'Claire Moreau', 'C''est noté ! Notre équipe arrive dans 10 minutes.', '{}', '2026-01-28 20:27:18.406532+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2405B005', 'TH-03554585', 'staff', 'Jean-Pierre Dupont', 'test', '{}', '2026-02-28 03:53:06.61563+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-6D14D49D', 'TH-03554585', 'staff', 'Jean-Pierre Dupont', 'test2', '{}', '2026-02-28 03:54:56.205908+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-658B9264', 'TH-03554585', 'staff', 'Jean-Pierre Dupont', 'tt', '{}', '2026-02-28 04:08:19.880819+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-944D5BD4', 'TH-03554585', 'staff', 'Jean-Pierre Dupont', 'ttsfdfasf', '{}', '2026-02-28 04:08:26.827556+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-A0B6888B', 'TH-03554585', 'guest', 'Yuki Tanaka', 'Reserver un restaurant', '{}', '2026-02-28 13:15:21.545792+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-2C8482E2', 'TH-478C3CF9', 'guest', 'Yuki Tanaka', 'I would like to book a table at SEA FU on 2026-02-28 at 14:00 for 1 guest.', '{"type": "restaurant_booking", "ticketId": "T-EFCC9C6D"}', '2026-02-28 13:32:06.576316+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-560CA343', 'TH-03554585', 'guest', 'Yuki Tanaka', 'hi', '{}', '2026-02-28 13:32:38.971797+01');
INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at) VALUES ('M-B060286E', 'TH-478C3CF9', 'guest', 'Yuki Tanaka', 'I would like to book a table at SEA FU on 2026-03-01 at 14:00 for 1 guest.', '{"type": "restaurant_booking", "ticketId": "T-06486B93"}', '2026-02-28 13:33:21.672894+01');

INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('E-1001', 'H-FOURSEASONS', 'S-0001', 'spa', 'Couples Massage - Deep Relaxation', '2026-03-01 15:00:00+01', '2026-03-01 16:30:00+01', 'scheduled', '{"price": 380, "service": "Couples Massage", "department": "spa-gym"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('E-1002', 'H-FOURSEASONS', 'S-0001', 'restaurant', 'Dinner at Le Cinq', '2026-03-01 20:00:00+01', NULL, 'scheduled', '{"guests": 2, "department": "restaurants", "restaurant": "Le Cinq"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-0F5F5E80', 'H-FOURSEASONS', 'S-0003', 'restaurant', 'SEA FU - 1 guest', '2026-02-28 14:00:00+01', NULL, 'pending', '{"guests": 1, "threadId": "TH-478C3CF9", "ticketId": "T-EFCC9C6D", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": ""}', '2026-02-28 13:32:06.578819+01', '2026-02-28 13:32:06.578819+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-3ABCDA82', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-08F7C76F", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 04:08:46.009312+01', '2026-02-16 04:08:46.009312+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-1B2EEDD1', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 11:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-B5FFA092", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 04:08:59.719822+01', '2026-02-16 04:08:59.719822+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-C3E0469F', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-EFB0FBBF", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 05:05:45.394044+01', '2026-02-16 05:05:45.394044+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-08BD021F', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 11:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-F7F145A4", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 05:05:57.485113+01', '2026-02-16 05:05:57.485113+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-F3686492', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-A53B6350", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 05:06:03.469565+01', '2026-02-16 05:06:03.469565+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-8FF70B3D', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-73A7BDDE", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 05:16:49.008152+01', '2026-02-16 05:16:49.008152+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-54EBBD9B', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 11:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-F81850A7", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 05:17:05.201437+01', '2026-02-16 05:17:05.201437+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-F034C30F', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-90F9F3FD", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 05:17:47.166803+01', '2026-02-16 05:17:47.166803+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-77DB0A8E', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 11:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-442D2C1A", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 05:18:06.360117+01', '2026-02-16 05:18:06.360117+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-5A69E169', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-8BC7F9D0", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 05:19:04.751088+01', '2026-02-16 05:19:04.751088+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-70173F09', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 11:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-D52629FD", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 05:19:20.582151+01', '2026-02-16 05:19:20.582151+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-3E87D186', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-E4AC2E13", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 05:19:51.956936+01', '2026-02-16 05:19:51.956936+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-E207C376', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 11:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-5D6DB741", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 05:20:10.409235+01', '2026-02-16 05:20:10.409235+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-BA56D95B', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-30E48181", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 05:24:09.211855+01', '2026-02-16 05:24:09.211855+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-E0CA31A7', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-F451DBE0", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 05:25:03.45829+01', '2026-02-16 05:25:03.45829+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-8A267F17', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 11:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-75B2B9CB", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 05:25:22.533134+01', '2026-02-16 05:25:22.533134+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-B932E383', 'H-FOURSEASONS', 'S-0003', 'restaurant', 'SEA FU - 1 guest', '2026-02-16 11:30:00+01', NULL, 'pending', '{"guests": 1, "threadId": "TH-478C3CF9", "ticketId": "T-78470E1E", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "rien"}', '2026-02-16 05:37:23.738945+01', '2026-02-16 05:37:23.738945+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-03906FF1', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-E106E542", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 03:54:32.39973+01', '2026-02-16 03:54:32.39973+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-51C39ABA', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-1503B8D6", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 03:54:34.402603+01', '2026-02-16 03:54:34.402603+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-F9D6520B', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 11:30:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-A2C5B54B", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 03:58:32.469106+01', '2026-02-16 03:58:32.469106+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-54C19E7F', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'pending', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-478D05A8", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 05:52:54.283861+01', '2026-02-16 05:52:54.283861+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-E51A1E18', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'COYA - 2 guests', '2026-02-28 21:00:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-470820A5", "department": "restaurants", "restaurant": "COYA", "specialRequests": "Anniversary dinner"}', '2026-02-16 05:52:57.474298+01', '2026-02-16 05:52:57.474298+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-D5C0FBBD', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'COYA - 2 guests', '2026-02-28 21:00:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-7645E534", "department": "restaurants", "restaurant": "COYA", "specialRequests": "Anniversary dinner"}', '2026-02-16 05:54:04.690634+01', '2026-02-16 05:54:04.690634+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-E85F7D8C', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'pending', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-89E76D7A", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 05:55:19.378833+01', '2026-02-16 05:55:19.378833+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-B03CB676', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'COYA - 2 guests', '2026-02-28 21:00:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-92421CFF", "department": "restaurants", "restaurant": "COYA", "specialRequests": "Anniversary dinner"}', '2026-02-16 05:55:22.127196+01', '2026-02-16 05:55:22.127196+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-B001DF32', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'COYA - 2 guests', '2026-02-28 21:00:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-94B505B4", "department": "restaurants", "restaurant": "COYA", "specialRequests": "Anniversary dinner"}', '2026-02-16 05:55:40.67885+01', '2026-02-16 05:55:40.67885+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-A4AA4530', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'TEST - 2 guests', '2026-03-01 19:00:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-DF079382", "department": "restaurants", "restaurant": "TEST", "specialRequests": ""}', '2026-02-16 06:02:38.523606+01', '2026-02-16 06:02:38.523606+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-06ED3522', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 11:00:00+01', NULL, 'confirmed', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-FCE7B25A", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 05:24:28.168965+01', '2026-02-16 06:06:14.799865+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-F6433F33', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'pending', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-1A8D3B01", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 06:07:55.24923+01', '2026-02-16 06:07:55.24923+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-A1EA22EB', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'confirmed', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-8CF0F508", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 06:07:57.353765+01', '2026-02-16 06:07:57.479847+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-0677E36D', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'pending', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-94DABED0", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 06:07:59.930807+01', '2026-02-16 06:07:59.930807+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-180E66F4', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'confirmed', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-E2EB51DC", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 06:09:07.629157+01', '2026-02-16 06:09:07.784335+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-7D69CFBF', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'confirmed', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-A7A408C4", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 06:09:27.531829+01', '2026-02-16 06:09:27.687907+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-43E4BFA1', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'confirmed', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-893CED7E", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 06:10:24.085867+01', '2026-02-16 06:10:24.460993+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-E83B5D1C', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'confirmed', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-ECD1DBA7", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 06:10:32.278657+01', '2026-02-16 06:10:32.444298+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-11E19230', 'H-FOURSEASONS', 'S-0003', 'restaurant', 'SEA FU - 1 guest', '2026-03-01 14:00:00+01', NULL, 'pending', '{"guests": 1, "threadId": "TH-478C3CF9", "ticketId": "T-06486B93", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": ""}', '2026-02-28 13:33:21.67548+01', '2026-02-28 13:33:21.67548+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-19CCDD8A', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-CCCC0502", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 18:25:56.221129+01', '2026-02-16 18:25:56.221129+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-4EDC2328', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'confirmed', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-2D939BB3", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 18:25:56.419957+01', '2026-02-16 18:25:56.490019+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-ADE7D644', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 18:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-5ACAA962", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 18:26:27.466897+01', '2026-02-16 18:26:27.466897+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-B6C42542', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-96AE7F06", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-16 18:27:02.825432+01', '2026-02-16 18:27:02.825432+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-8100EECE', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'confirmed', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-9B6B2F99", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-16 18:27:02.971176+01', '2026-02-16 18:27:03.088701+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-8E6FA4D0', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 18:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-E41CBDEA", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-16 18:27:27.425665+01', '2026-02-16 18:27:27.425665+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-4CD607EE', 'H-FOURSEASONS', 'S-0003', 'restaurant', 'SEA FU - 3 guests', '2026-02-16 19:00:00+01', NULL, 'confirmed', '{"guests": 3, "threadId": "TH-478C3CF9", "ticketId": "T-895E1193", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": ""}', '2026-02-16 18:34:10.321642+01', '2026-02-16 18:50:55.846858+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-CFA2C581', 'H-FOURSEASONS', 'S-0003', 'restaurant', 'SEA FU - 6 guests', '2026-02-19 11:30:00+01', NULL, 'confirmed', '{"guests": 6, "threadId": "TH-478C3CF9", "ticketId": "T-C04F5E5E", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": ""}', '2026-02-16 20:14:47.826016+01', '2026-02-16 21:02:54.946205+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-B5932298', 'H-FOURSEASONS', 'S-0003', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 23:00:00+01', NULL, 'confirmed', '{"guests": 2, "threadId": "TH-478C3CF9", "ticketId": "T-06D1F7AD", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": ""}', '2026-02-16 23:29:09.234237+01', '2026-02-16 23:39:22.934566+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-F0D1C0F1', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 4 guests', '2026-02-25 20:00:00+01', NULL, 'confirmed', '{"guests": 4, "threadId": "TH-32240424", "ticketId": "T-66CB4A96", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Birthday celebration, quiet table please"}', '2026-02-24 02:23:35.828174+01', '2026-02-24 02:23:36.277945+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-0BF62512', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-02-24 11:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-FC02C79F", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Terrasse si possible, anniversaire"}', '2026-02-24 02:24:40.264467+01', '2026-02-24 02:24:40.264467+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-F38A3D40', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-02-20 19:30:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-7316E507", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Window seat please"}', '2026-02-24 02:18:55.777977+01', '2026-02-24 02:18:55.777977+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-606B21DB', 'H-FOURSEASONS', 'S-DEMO', 'housekeeping', 'Nettoyage - Room 227', '2026-02-25 10:00:00+01', '2026-02-25 11:00:00+01', 'scheduled', '{"currency": "EUR", "threadId": "TH-2002", "ticketId": "T-26FBEBD5", "timeSlot": "10:00 - 11:00", "bookingId": "SB-615B4E16", "department": "housekeeping", "priceCents": 5000, "serviceName": "Nettoyage"}', '2026-02-24 02:19:10.569416+01', '2026-02-24 02:19:10.569416+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-8F10EDE6', 'H-FOURSEASONS', 'S-DEMO', 'housekeeping', 'Nettoyage - Room 227', '2026-02-24 10:00:00+01', '2026-02-24 11:00:00+01', 'scheduled', '{"currency": "EUR", "threadId": "TH-2002", "ticketId": "T-9BF461C3", "timeSlot": "10:00 - 11:00", "bookingId": "SB-D0A7C7F7", "department": "housekeeping", "priceCents": 5000, "serviceName": "Nettoyage"}', '2026-02-24 02:23:19.857471+01', '2026-02-24 02:23:19.857471+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-155EEB98', 'H-FOURSEASONS', 'S-DEMO', 'housekeeping', 'Nettoyage - Room 227', '2026-02-25 15:00:00+01', '2026-02-25 16:00:00+01', 'scheduled', '{"currency": "EUR", "threadId": "TH-2002", "ticketId": "T-653700AC", "timeSlot": "15:00 - 16:00", "bookingId": "SB-0F4BAA0F", "department": "housekeeping", "priceCents": 5000, "serviceName": "Nettoyage"}', '2026-02-23 01:04:13.817116+01', '2026-02-23 01:04:13.817116+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-E35D79BA', 'H-FOURSEASONS', 'S-0003', 'housekeeping', 'Nettoyage - Room 502', '2026-02-23 12:00:00+01', '2026-02-23 13:00:00+01', 'scheduled', '{"currency": "EUR", "threadId": "TH-3FE97D91", "ticketId": "T-052C4D9B", "timeSlot": "12:00 - 13:00", "bookingId": "SB-C0E33CA2", "department": "housekeeping", "priceCents": 5000, "serviceName": "Nettoyage"}', '2026-02-23 01:12:43.413903+01', '2026-02-23 01:12:43.413903+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-F980C96D', 'H-FOURSEASONS', 'S-DEMO', 'housekeeping', 'Nettoyage - Room 227', '2026-02-24 10:00:00+01', '2026-02-24 11:00:00+01', 'scheduled', '{"currency": "EUR", "threadId": "TH-2002", "ticketId": "T-0D5BDB7D", "timeSlot": "10:00 - 11:00", "bookingId": "SB-B743DF42", "department": "housekeeping", "priceCents": 5000, "serviceName": "Nettoyage"}', '2026-02-24 02:23:27.06112+01', '2026-02-24 02:23:27.06112+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-AB36118D', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-03-01 20:00:00+01', NULL, 'confirmed', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-4809BA61", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Regression test 1771896297653"}', '2026-02-24 02:24:57.831495+01', '2026-02-24 02:24:58.06122+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-9810A3B8', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-03-01 20:00:00+01', NULL, 'confirmed', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-31DE9320", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Regression test 1771896326346"}', '2026-02-24 02:25:26.768158+01', '2026-02-24 02:25:27.076476+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-6F04D948', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-03-01 20:00:00+01', NULL, 'confirmed', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-BE140857", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Regression test 1771896356002"}', '2026-02-24 02:25:56.088352+01', '2026-02-24 02:25:56.311512+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-1A19E99C', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-03-01 20:00:00+01', NULL, 'confirmed', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-3C1AA2F7", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Regression test 1771896537689"}', '2026-02-24 02:28:57.786743+01', '2026-02-24 02:28:58.015974+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-6D1D4508', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 1 guest', '2026-03-05 19:00:00+01', NULL, 'pending', '{"guests": 1, "threadId": "TH-32240424", "ticketId": "T-BF0CF2CD", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Pagination test"}', '2026-02-24 02:30:50.534831+01', '2026-02-24 02:30:50.534831+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-1D454424', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 2 guests', '2026-03-06 20:00:00+01', NULL, 'pending', '{"guests": 2, "threadId": "TH-32240424", "ticketId": "T-E69D1520", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Cursor pagination test"}', '2026-02-24 02:30:50.89625+01', '2026-02-24 02:30:50.89625+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('EV-C64F3158', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'SEA FU - 3 guests', '2026-03-07 21:00:00+01', NULL, 'pending', '{"guests": 3, "threadId": "TH-32240424", "ticketId": "T-4635B3C3", "department": "restaurants", "restaurant": "SEA FU", "specialRequests": "Default limit test"}', '2026-02-24 02:30:51.173685+01', '2026-02-24 02:30:51.173685+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('E-2001', 'H-FOURSEASONS', 'S-DEMO', 'spa', 'Une heure de relaxation au Spa', '2026-02-28 14:00:00+01', '2026-02-28 15:00:00+01', 'scheduled', '{"service": "Relaxation", "department": "spa-gym"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('E-2002', 'H-FOURSEASONS', 'S-DEMO', 'restaurant', 'Soirée de lancement', '2026-02-28 19:00:00+01', '2026-02-28 21:00:00+01', 'scheduled', '{"linkUrl": "/agenda", "variant": "invite"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at) VALUES ('E-2003', 'H-FOURSEASONS', 'S-DEMO', 'transfer', 'Airport Transfer - Departure', '2026-03-05 12:00:00+01', NULL, 'scheduled', '{"type": "airport", "direction": "to_airport", "department": "concierge"}', '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');

INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('I-1001', 'H-FOURSEASONS', 'S-0001', 'Mini Bar', 'room-service', 4500, 'EUR', 45, '2026-01-28', NULL, '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('I-1002', 'H-FOURSEASONS', 'S-0001', 'Breakfast - Le Cinq', 'restaurants', 9500, 'EUR', 95, '2026-01-28', NULL, '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('I-1003', 'H-FOURSEASONS', 'S-0001', 'Deep Tissue Massage', 'spa-gym', 22000, 'EUR', 220, '2026-01-28', NULL, '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('I-2001', 'H-FOURSEASONS', 'S-DEMO', 'Spa Treatment - Swedish Massage', 'spa-gym', 18000, 'EUR', 180, '2026-01-27', NULL, '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('I-2002', 'H-FOURSEASONS', 'S-DEMO', 'Room Service - Dinner', 'room-service', 8500, 'EUR', 85, '2026-01-27', NULL, '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('I-3001', 'H-FOURSEASONS', 'S-0006', 'Private Dining - 6 guests', 'restaurants', 180000, 'EUR', 1800, '2026-01-27', NULL, '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('I-3002', 'H-FOURSEASONS', 'S-0006', 'Limousine Service - Half Day', 'concierge', 75000, 'EUR', 750, '2026-01-28', NULL, '2026-01-28 20:27:18.406532+01', '2026-01-28 20:27:18.406532+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-EF6F5BDA', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:09:53.955762+01', '2026-02-24 02:09:53.955762+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-6798E4AC', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:11:04.970677+01', '2026-02-24 02:11:04.970677+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-0BB069BF', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 52500, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:11:06.774993+01', '2026-02-24 02:11:06.774993+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-518E4033', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:14:55.153525+01', '2026-02-24 02:14:55.153525+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-EE73CBB4', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:15:39.311065+01', '2026-02-24 02:15:39.311065+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-5830047F', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 52500, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:15:40.947081+01', '2026-02-24 02:15:40.947081+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-FCC2BD63', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:16:06.951762+01', '2026-02-24 02:16:06.951762+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-ECC81661', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:16:16.760976+01', '2026-02-24 02:16:16.760976+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-04E46EBE', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 52500, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:16:18.361079+01', '2026-02-24 02:16:18.361079+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-71E16880', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:16:29.027178+01', '2026-02-24 02:16:29.027178+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-DDE1690F', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:16:39.622382+01', '2026-02-24 02:16:39.622382+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-F09BD29B', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 52500, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:16:41.302363+01', '2026-02-24 02:16:41.302363+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-4C4300DC', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:18:56.361787+01', '2026-02-24 02:18:56.361787+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-0500FEB7', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:19:08.317304+01', '2026-02-24 02:19:08.317304+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-DE139116', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 52500, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:19:10.306508+01', '2026-02-24 02:19:10.306508+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-4FDBE077', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:41:07.581553+01', '2026-02-24 02:41:07.581553+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-67D65DEE', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 57750, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:41:18.229812+01', '2026-02-24 02:41:18.229812+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-D8CDD042', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 52500, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 02:41:20.006095+01', '2026-02-24 02:41:20.006095+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-03E8CFD2', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 34100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 03:28:32.679946+01', '2026-02-24 03:28:32.679946+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-B577C24E', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 31000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 03:33:28.220768+01', '2026-02-24 03:33:28.220768+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-5184419C', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 03:44:33.92504+01', '2026-02-24 03:44:33.92504+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-68521795', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 03:45:23.894051+01', '2026-02-24 03:45:23.894051+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-8985A9F9', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 03:45:28.775436+01', '2026-02-24 03:45:28.775436+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-14C49FDC', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 03:45:58.185363+01', '2026-02-24 03:45:58.185363+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-5F7CF48D', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 03:46:27.641094+01', '2026-02-24 03:46:27.641094+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-4BFC35AA', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 03:46:32.346441+01', '2026-02-24 03:46:32.346441+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-DF45AC9C', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 10:56:54.34571+01', '2026-02-24 10:56:54.34571+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-4AEB727D', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 10:57:29.687039+01', '2026-02-24 10:57:29.687039+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-1CF1CC7D', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 10:57:33.696263+01', '2026-02-24 10:57:33.696263+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-1E598BAA', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 10:59:14.560431+01', '2026-02-24 10:59:14.560431+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-945AFE1E', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 10:59:38.086059+01', '2026-02-24 10:59:38.086059+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-429080CF', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 10:59:42.566517+01', '2026-02-24 10:59:42.566517+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-11F3B14C', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 11:04:02.557397+01', '2026-02-24 11:04:02.557397+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-C630494A', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 11:04:26.084996+01', '2026-02-24 11:04:26.084996+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-ED99BCFE', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 11:04:29.742291+01', '2026-02-24 11:04:29.742291+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-4E7D3BB7', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 11:05:03.787859+01', '2026-02-24 11:05:03.787859+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-F7B0B121', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 11:05:24.257992+01', '2026-02-24 11:05:24.257992+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-CE32B8FA', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 11:05:28.340129+01', '2026-02-24 11:05:28.340129+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-8A69EFED', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:02:46.579862+01', '2026-02-24 12:02:46.579862+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-62092318', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:06:09.609104+01', '2026-02-24 12:06:09.609104+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-3BD9DA1A', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:06:17.371184+01', '2026-02-24 12:06:17.371184+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-DC681CB9', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:06:46.163365+01', '2026-02-24 12:06:46.163365+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-B59B383E', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:09:13.669464+01', '2026-02-24 12:09:13.669464+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-56120A7E', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:09:18.726904+01', '2026-02-24 12:09:18.726904+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-D0248E8C', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:12:03.812706+01', '2026-02-24 12:12:03.812706+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-8D683551', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:12:33.302418+01', '2026-02-24 12:12:33.302418+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-7768018F', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:12:39.972382+01', '2026-02-24 12:12:39.972382+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-0561D857', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:13:05.056516+01', '2026-02-24 12:13:05.056516+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-45FBCD48', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:13:39.105344+01', '2026-02-24 12:13:39.105344+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-F42BE8DD', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:13:45.222124+01', '2026-02-24 12:13:45.222124+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-8125F31E', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:50:51.890232+01', '2026-02-24 12:50:51.890232+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-09282980', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:51:05.579908+01', '2026-02-24 12:51:05.579908+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-CF4A0BE3', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:51:07.38655+01', '2026-02-24 12:51:07.38655+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-315F9E27', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:53:20.359013+01', '2026-02-24 12:53:20.359013+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-F0ED0733', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:53:30.773231+01', '2026-02-24 12:53:30.773231+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-919B3AF2', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 12:53:32.622528+01', '2026-02-24 12:53:32.622528+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-0BBDCE6F', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 13:24:27.168494+01', '2026-02-24 13:24:27.168494+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-DF1D2E2F', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 13:24:47.057208+01', '2026-02-24 13:24:47.057208+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-033B2BC1', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 13:24:49.675934+01', '2026-02-24 13:24:49.675934+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-D8D0F368', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 13:24:59.370275+01', '2026-02-24 13:24:59.370275+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-BF30C019', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 13:25:11.863182+01', '2026-02-24 13:25:11.863182+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-F043720C', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 13:25:14.313919+01', '2026-02-24 13:25:14.313919+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-99860589', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 14:48:50.044573+01', '2026-02-24 14:48:50.044573+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-312F6DA8', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 14:49:05.679482+01', '2026-02-24 14:49:05.679482+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-37689B2D', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 14:49:07.476666+01', '2026-02-24 14:49:07.476666+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-B3F18EB1', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 14:50:46.238369+01', '2026-02-24 14:50:46.238369+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-88B63273', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 14:51:17.586987+01', '2026-02-24 14:51:17.586987+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-27F9B960', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 14:51:24.728864+01', '2026-02-24 14:51:24.728864+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-8B5E092E', 'H-FOURSEASONS', 'S-0003', 'Check-out', 'reception', 0, 'EUR', 0, '2026-02-24', '/invoices/RES-YUKI-PARIS.pdf', '2026-02-24 15:02:33.986369+01', '2026-02-24 15:02:33.986369+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-1F65D76E', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 15:36:38.105235+01', '2026-02-24 15:36:38.105235+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-EFB16E73', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 15:36:50.697589+01', '2026-02-24 15:36:50.697589+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-E0AF7ABA', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 15:36:52.662417+01', '2026-02-24 15:36:52.662417+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-3770A0AA', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 15:39:12.560746+01', '2026-02-24 15:39:12.560746+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-59FFF445', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 15:39:24.715731+01', '2026-02-24 15:39:24.715731+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-DA8D2833', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 15:39:26.859887+01', '2026-02-24 15:39:26.859887+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-62CE0C99', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 16:11:35.994998+01', '2026-02-24 16:11:35.994998+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-35E33C23', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 16:12:19.427707+01', '2026-02-24 16:12:19.427707+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-83D12BA3', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 16:12:22.143027+01', '2026-02-24 16:12:22.143027+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-3E449B8E', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 16:12:35.13843+01', '2026-02-24 16:12:35.13843+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-71C24508', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 45100, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 16:12:51.345957+01', '2026-02-24 16:12:51.345957+01');
INSERT INTO invoices (id, hotel_id, stay_id, title, department, amount_cents, currency, points_earned, issued_at, download_url, created_at, updated_at) VALUES ('INV-C1469479', 'H-FOURSEASONS', 'S-DEMO', 'Check-out', 'reception', 41000, 'EUR', 0, '2026-02-24', '/invoices/RES-DEMO.pdf', '2026-02-24 16:12:54.046293+01', '2026-02-24 16:12:54.046293+01');

INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-36F55C5B', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'New guest message • restaurants', 'New guest message received.

Thread: Restaurants - Room 502 (TH-478C3CF9)

hi', '{"type": "message_created", "threadId": "TH-478C3CF9", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:17:19.896191+01', NULL, '2026-02-16 06:17:19.896191+01', '2026-02-16 06:17:20.621153+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-303267D6', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New service request • reception • Room 502', 'New service request: Demande de renseignement

Room: 502
Department: reception
Ticket: T-BB1980CE', '{"type": "service_request", "ticketId": "T-BB1980CE"}', 'sent', 1, '2026-02-06 00:26:27.311108+01', NULL, '2026-02-06 00:26:27.311108+01', '2026-02-06 00:26:28.260153+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-67BA328F', 'H-FOURSEASONS', 'email', 'mock', 'reception@fourseasons.demo', 'New service request • reception • Room 502', 'New service request: Demande de renseignement

Room: 502
Department: reception
Ticket: T-BB1980CE', '{"type": "service_request", "ticketId": "T-BB1980CE"}', 'sent', 1, '2026-02-06 00:26:27.382905+01', NULL, '2026-02-06 00:26:27.382905+01', '2026-02-06 00:26:28.272788+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E1AEB9CC', 'H-FOURSEASONS', 'email', 'mock', 'reception@fourseasons.demo', 'New service request • reception • Room 502', 'New service request: Demande de renseignement

Room: 502
Department: reception
Ticket: T-63A4EC39', '{"type": "service_request", "ticketId": "T-63A4EC39"}', 'sent', 1, '2026-02-06 00:26:30.470787+01', NULL, '2026-02-06 00:26:30.470787+01', '2026-02-06 00:26:31.316551+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AC228AD9', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New service request • reception • Room 502', 'New service request: Demande de renseignement

Room: 502
Department: reception
Ticket: T-63A4EC39', '{"type": "service_request", "ticketId": "T-63A4EC39"}', 'sent', 1, '2026-02-06 00:26:30.469441+01', NULL, '2026-02-06 00:26:30.469441+01', '2026-02-06 00:26:31.317451+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0191337F', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New thread • concierge', 'A guest started a new conversation.
Thread: TH-03554585
Department: concierge
Stay: S-0003
Initial message:
Bonjour', '{"type": "thread_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-07 19:12:48.115677+01', NULL, '2026-02-07 19:12:48.115677+01', '2026-02-07 19:12:49.14039+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-FC044485', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New thread • concierge', 'A guest started a new conversation.
Thread: TH-03554585
Department: concierge
Stay: S-0003
Initial message:
Bonjour', '{"type": "thread_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-07 19:12:48.14109+01', NULL, '2026-02-07 19:12:48.14109+01', '2026-02-07 19:12:49.399848+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-1BA24451', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

aaa', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-07 19:24:34.453956+01', NULL, '2026-02-07 19:24:34.453956+01', '2026-02-07 19:24:35.511775+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5C374400', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

aaa', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-07 19:24:34.442919+01', NULL, '2026-02-07 19:24:34.442919+01', '2026-02-07 19:24:35.5151+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-DBA35020', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New thread • concierge', 'A guest started a new conversation.
Thread: TH-2EE1728A
Department: concierge
Stay: S-0004
Initial message:
Bonjour', '{"type": "thread_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:37:57.92028+01', NULL, '2026-02-07 19:37:57.92028+01', '2026-02-07 19:37:58.112169+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AB4585E1', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New thread • concierge', 'A guest started a new conversation.
Thread: TH-2EE1728A
Department: concierge
Stay: S-0004
Initial message:
Bonjour', '{"type": "thread_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:37:57.91655+01', NULL, '2026-02-07 19:37:57.91655+01', '2026-02-07 19:37:58.117193+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-8C0D07B8', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-2EE1728A)

bonjour', '{"type": "message_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:38:11.110214+01', NULL, '2026-02-07 19:38:11.110214+01', '2026-02-07 19:38:11.670713+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-82EEF636', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-2EE1728A)

bonjour', '{"type": "message_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:38:11.105032+01', NULL, '2026-02-07 19:38:11.105032+01', '2026-02-07 19:38:11.691713+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B71B3452', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-2EE1728A)

test', '{"type": "message_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:38:19.04349+01', NULL, '2026-02-07 19:38:19.04349+01', '2026-02-07 19:38:19.205805+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2830605E', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-2EE1728A)

test', '{"type": "message_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:38:19.04539+01', NULL, '2026-02-07 19:38:19.04539+01', '2026-02-07 19:38:19.208815+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D4CEAEB9', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-2EE1728A)

Réserver un restaurant', '{"type": "message_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:38:46.395872+01', NULL, '2026-02-07 19:38:46.395872+01', '2026-02-07 19:38:47.797111+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-123D71A0', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-2EE1728A)

Réserver un restaurant', '{"type": "message_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:38:46.398906+01', NULL, '2026-02-07 19:38:46.398906+01', '2026-02-07 19:38:47.800082+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-EC5D86F0', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-2EE1728A)

Organiser un transport', '{"type": "message_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:38:53.628505+01', NULL, '2026-02-07 19:38:53.628505+01', '2026-02-07 19:38:53.814076+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-28AFBE94', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-2EE1728A)

Organiser un transport', '{"type": "message_created", "threadId": "TH-2EE1728A", "department": "concierge"}', 'sent', 1, '2026-02-07 19:38:53.626718+01', NULL, '2026-02-07 19:38:53.626718+01', '2026-02-07 19:38:53.815711+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-82835198', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New service request • housekeeping • Room 305', 'New service request: Oreillers

Room: 305
Department: housekeeping
Ticket: T-CB28A005', '{"type": "service_request", "ticketId": "T-CB28A005"}', 'sent', 1, '2026-02-08 13:28:53.291392+01', NULL, '2026-02-08 13:28:53.291392+01', '2026-02-08 13:28:54.498717+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B627D796', 'H-FOURSEASONS', 'email', 'mock', 'housekeeping@fourseasons.demo', 'New service request • housekeeping • Room 305', 'New service request: Oreillers

Room: 305
Department: housekeeping
Ticket: T-CB28A005', '{"type": "service_request", "ticketId": "T-CB28A005"}', 'sent', 1, '2026-02-08 13:28:53.343861+01', NULL, '2026-02-08 13:28:53.343861+01', '2026-02-08 13:28:54.51975+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-05911AB3', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New thread • housekeeping', 'A guest started a new conversation.
Thread: TH-1D0B40F8
Department: housekeeping
Stay: S-0004', '{"type": "thread_created", "threadId": "TH-1D0B40F8", "department": "housekeeping"}', 'sent', 1, '2026-02-08 13:30:04.242302+01', NULL, '2026-02-08 13:30:04.242302+01', '2026-02-08 13:30:05.683016+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-82B67A89', 'H-FOURSEASONS', 'email', 'mock', 'housekeeping@fourseasons.demo', 'New thread • housekeeping', 'A guest started a new conversation.
Thread: TH-1D0B40F8
Department: housekeeping
Stay: S-0004', '{"type": "thread_created", "threadId": "TH-1D0B40F8", "department": "housekeeping"}', 'sent', 1, '2026-02-08 13:30:04.250031+01', NULL, '2026-02-08 13:30:04.250031+01', '2026-02-08 13:30:05.819509+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B875B2C5', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-03906FF1", "threadId": "TH-32240424", "ticketId": "T-E106E542"}', 'sent', 1, '2026-02-16 03:54:32.410846+01', NULL, '2026-02-16 03:54:32.410846+01', '2026-02-16 03:54:32.546906+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F922CAFB', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-03906FF1", "threadId": "TH-32240424", "ticketId": "T-E106E542"}', 'sent', 1, '2026-02-16 03:54:32.417763+01', NULL, '2026-02-16 03:54:32.417763+01', '2026-02-16 03:54:32.550822+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A6FE6684', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-E207C376", "threadId": "TH-32240424", "ticketId": "T-5D6DB741"}', 'sent', 1, '2026-02-16 05:20:10.417207+01', NULL, '2026-02-16 05:20:10.417207+01', '2026-02-16 05:20:10.882822+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-4762EFEA', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New thread • spa-gym', 'A guest started a new conversation.
Thread: TH-E107F74C
Department: spa-gym
Stay: S-0004', '{"type": "thread_created", "threadId": "TH-E107F74C", "department": "spa-gym"}', 'sent', 1, '2026-02-08 13:31:08.921772+01', NULL, '2026-02-08 13:31:08.921772+01', '2026-02-08 13:31:09.576311+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0E195779', 'H-FOURSEASONS', 'email', 'mock', 'spa@fourseasons.demo', 'New thread • spa-gym', 'A guest started a new conversation.
Thread: TH-E107F74C
Department: spa-gym
Stay: S-0004', '{"type": "thread_created", "threadId": "TH-E107F74C", "department": "spa-gym"}', 'sent', 1, '2026-02-08 13:31:09.040914+01', NULL, '2026-02-08 13:31:09.040914+01', '2026-02-08 13:31:09.581259+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-C8FB3E2F', 'H-FOURSEASONS', 'email', 'mock', 'reception@fourseasons.demo', 'New thread • reception', 'A guest started a new conversation.
Thread: TH-BC7D47F1
Department: reception
Stay: S-0003', '{"type": "thread_created", "threadId": "TH-BC7D47F1", "department": "reception"}', 'sent', 1, '2026-02-24 15:01:17.194771+01', NULL, '2026-02-24 15:01:17.194771+01', '2026-02-24 15:01:17.642317+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2F525139', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-51C39ABA", "threadId": "TH-32240424", "ticketId": "T-1503B8D6"}', 'sent', 1, '2026-02-16 03:54:34.404182+01', NULL, '2026-02-16 03:54:34.404182+01', '2026-02-16 03:54:35.557832+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-331D3A64', 'H-FOURSEASONS', 'email', 'mock', 'spa@fourseasons.demo', 'New guest message • spa-gym', 'New guest message received.

Thread: Spa & Gym (TH-E107F74C)

bonjour spa gym', '{"type": "message_created", "threadId": "TH-E107F74C", "department": "spa-gym"}', 'sent', 1, '2026-02-08 13:32:00.950474+01', NULL, '2026-02-08 13:32:00.950474+01', '2026-02-08 13:32:02.319078+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-19CE156A', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-51C39ABA", "threadId": "TH-32240424", "ticketId": "T-1503B8D6"}', 'sent', 1, '2026-02-16 03:54:34.405335+01', NULL, '2026-02-16 03:54:34.405335+01', '2026-02-16 03:54:35.559167+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E544BDB7', 'H-FOURSEASONS', 'email', 'mock', 'spa@fourseasons.demo', 'New guest message • spa-gym', 'New guest message received.

Thread: Spa & Gym (TH-E107F74C)

same thread', '{"type": "message_created", "threadId": "TH-E107F74C", "department": "spa-gym"}', 'sent', 1, '2026-02-08 13:33:10.244738+01', NULL, '2026-02-08 13:33:10.244738+01', '2026-02-08 13:33:11.538999+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-07C8D2F0', 'H-FOURSEASONS', 'email', 'mock', 'housekeeping@fourseasons.demo', 'New guest message • housekeeping', 'New guest message received.

Thread: Housekeeping (TH-1D0B40F8)

hi housekeepig', '{"type": "message_created", "threadId": "TH-1D0B40F8", "department": "housekeeping"}', 'sent', 1, '2026-02-08 13:34:22.186695+01', NULL, '2026-02-08 13:34:22.186695+01', '2026-02-08 13:34:22.225587+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-83D5927D', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:30
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-F9D6520B", "threadId": "TH-32240424", "ticketId": "T-A2C5B54B"}', 'sent', 1, '2026-02-16 03:58:32.474796+01', NULL, '2026-02-16 03:58:32.474796+01', '2026-02-16 03:58:33.656434+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5EA057CC', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:30
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-F9D6520B", "threadId": "TH-32240424", "ticketId": "T-A2C5B54B"}', 'sent', 1, '2026-02-16 03:58:32.479454+01', NULL, '2026-02-16 03:58:32.479454+01', '2026-02-16 03:58:33.662348+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2AAF9A82', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-3ABCDA82", "threadId": "TH-32240424", "ticketId": "T-08F7C76F"}', 'sent', 1, '2026-02-16 04:08:46.014592+01', NULL, '2026-02-16 04:08:46.014592+01', '2026-02-16 04:08:47.117833+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B3471E10', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-3ABCDA82", "threadId": "TH-32240424", "ticketId": "T-08F7C76F"}', 'sent', 1, '2026-02-16 04:08:46.016272+01', NULL, '2026-02-16 04:08:46.016272+01', '2026-02-16 04:08:47.119691+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-18CA8C56', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-1B2EEDD1", "threadId": "TH-32240424", "ticketId": "T-B5FFA092"}', 'sent', 1, '2026-02-16 04:08:59.726462+01', NULL, '2026-02-16 04:08:59.726462+01', '2026-02-16 04:09:00.717116+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2FEFBAD0', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-1B2EEDD1", "threadId": "TH-32240424", "ticketId": "T-B5FFA092"}', 'sent', 1, '2026-02-16 04:08:59.728482+01', NULL, '2026-02-16 04:08:59.728482+01', '2026-02-16 04:09:00.719339+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6BBBE7CC', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-C3E0469F", "threadId": "TH-32240424", "ticketId": "T-EFB0FBBF"}', 'sent', 1, '2026-02-16 05:05:45.397883+01', NULL, '2026-02-16 05:05:45.397883+01', '2026-02-16 05:05:46.256555+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-514BE954', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-C3E0469F", "threadId": "TH-32240424", "ticketId": "T-EFB0FBBF"}', 'sent', 1, '2026-02-16 05:05:45.399412+01', NULL, '2026-02-16 05:05:45.399412+01', '2026-02-16 05:05:46.258556+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-644C6882', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-E207C376", "threadId": "TH-32240424", "ticketId": "T-5D6DB741"}', 'sent', 1, '2026-02-16 05:20:10.415067+01', NULL, '2026-02-16 05:20:10.415067+01', '2026-02-16 05:20:10.880813+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5AB116F5', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-92421CFF', 'Ticket updated.

Title: Reservation COYA - 2026-02-28 21:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-92421CFF", "department": "restaurants"}', 'sent', 1, '2026-02-16 05:59:07.68611+01', NULL, '2026-02-16 05:59:07.68611+01', '2026-02-16 05:59:08.10638+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F641AEA8', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-92421CFF', 'Ticket updated.

Title: Reservation COYA - 2026-02-28 21:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-92421CFF", "department": "restaurants"}', 'sent', 1, '2026-02-16 05:59:07.690202+01', NULL, '2026-02-16 05:59:07.690202+01', '2026-02-16 05:59:08.107305+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5A75C998', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-08BD021F", "threadId": "TH-32240424", "ticketId": "T-F7F145A4"}', 'sent', 1, '2026-02-16 05:05:57.487593+01', NULL, '2026-02-16 05:05:57.487593+01', '2026-02-16 05:05:58.295544+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D7452636', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-08BD021F", "threadId": "TH-32240424", "ticketId": "T-F7F145A4"}', 'sent', 1, '2026-02-16 05:05:57.48874+01', NULL, '2026-02-16 05:05:57.48874+01', '2026-02-16 05:05:58.297826+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B1F6F31D', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-8A267F17", "threadId": "TH-32240424", "ticketId": "T-75B2B9CB"}', 'sent', 1, '2026-02-16 05:25:22.552537+01', NULL, '2026-02-16 05:25:22.552537+01', '2026-02-16 05:25:23.966244+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0CFF08F1', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-8A267F17", "threadId": "TH-32240424", "ticketId": "T-75B2B9CB"}', 'sent', 1, '2026-02-16 05:25:22.554097+01', NULL, '2026-02-16 05:25:22.554097+01', '2026-02-16 05:25:23.974303+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-41616A59', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 23:00
Guests: 2
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-B5932298", "threadId": "TH-478C3CF9", "ticketId": "T-06D1F7AD"}', 'sent', 1, '2026-02-16 23:29:09.29442+01', NULL, '2026-02-16 23:29:09.29442+01', '2026-02-16 23:29:10.81639+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7A89D34B', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-478D05A8', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-478D05A8", "department": "restaurants"}', 'sent', 1, '2026-02-16 05:52:54.4247+01', NULL, '2026-02-16 05:52:54.4247+01', '2026-02-16 05:52:54.772889+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9D5DB8F4', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-F3686492", "threadId": "TH-32240424", "ticketId": "T-A53B6350"}', 'sent', 1, '2026-02-16 05:06:03.471831+01', NULL, '2026-02-16 05:06:03.471831+01', '2026-02-16 05:06:04.315018+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6AFBA619', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-F3686492", "threadId": "TH-32240424", "ticketId": "T-A53B6350"}', 'sent', 1, '2026-02-16 05:06:03.474133+01', NULL, '2026-02-16 05:06:03.474133+01', '2026-02-16 05:06:04.315875+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2CD8CBB6', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-D5C0FBBD", "threadId": "TH-32240424", "ticketId": "T-7645E534"}', 'sent', 1, '2026-02-16 05:54:04.701297+01', NULL, '2026-02-16 05:54:04.701297+01', '2026-02-16 05:54:05.451133+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-28C585F3', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-8FF70B3D", "threadId": "TH-32240424", "ticketId": "T-73A7BDDE"}', 'sent', 1, '2026-02-16 05:16:49.012243+01', NULL, '2026-02-16 05:16:49.012243+01', '2026-02-16 05:16:50.326239+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E0CE4921', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-89E76D7A', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-89E76D7A", "department": "restaurants"}', 'sent', 1, '2026-02-16 05:55:19.523308+01', NULL, '2026-02-16 05:55:19.523308+01', '2026-02-16 05:55:20.68157+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AE0727BB', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-B03CB676", "threadId": "TH-32240424", "ticketId": "T-92421CFF"}', 'sent', 1, '2026-02-16 05:55:22.135551+01', NULL, '2026-02-16 05:55:22.135551+01', '2026-02-16 05:55:22.188206+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F39FE89A', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-B001DF32", "threadId": "TH-32240424", "ticketId": "T-94B505B4"}', 'sent', 1, '2026-02-16 05:55:40.682108+01', NULL, '2026-02-16 05:55:40.682108+01', '2026-02-16 05:55:41.734105+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-852E838A', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New thread • reception', 'A guest started a new conversation.
Thread: TH-BC7D47F1
Department: reception
Stay: S-0003', '{"type": "thread_created", "threadId": "TH-BC7D47F1", "department": "reception"}', 'sent', 1, '2026-02-24 15:01:17.152859+01', NULL, '2026-02-24 15:01:17.152859+01', '2026-02-24 15:01:17.631912+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7892BB49', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-8FF70B3D", "threadId": "TH-32240424", "ticketId": "T-73A7BDDE"}', 'sent', 1, '2026-02-16 05:16:49.013914+01', NULL, '2026-02-16 05:16:49.013914+01', '2026-02-16 05:16:50.328843+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7162E7F4', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 23:00
Guests: 2
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-B5932298", "threadId": "TH-478C3CF9", "ticketId": "T-06D1F7AD"}', 'sent', 1, '2026-02-16 23:29:09.284418+01', NULL, '2026-02-16 23:29:09.284418+01', '2026-02-16 23:29:10.844242+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F5F053E8', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-7645E534', 'Ticket updated.

Title: Reservation COYA - 2026-02-28 21:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-7645E534", "department": "restaurants"}', 'sent', 1, '2026-02-16 05:59:49.780402+01', NULL, '2026-02-16 05:59:49.780402+01', '2026-02-16 05:59:50.297548+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AA6696AC', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-BA56D95B", "threadId": "TH-32240424", "ticketId": "T-30E48181"}', 'sent', 1, '2026-02-16 05:24:09.215632+01', NULL, '2026-02-16 05:24:09.215632+01', '2026-02-16 05:24:10.259184+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A49C9770', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-54EBBD9B", "threadId": "TH-32240424", "ticketId": "T-F81850A7"}', 'sent', 1, '2026-02-16 05:17:05.207043+01', NULL, '2026-02-16 05:17:05.207043+01', '2026-02-16 05:17:05.372575+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-1244D548', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-54EBBD9B", "threadId": "TH-32240424", "ticketId": "T-F81850A7"}', 'sent', 1, '2026-02-16 05:17:05.209025+01', NULL, '2026-02-16 05:17:05.209025+01', '2026-02-16 05:17:05.373855+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-819F3BD4', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-BA56D95B", "threadId": "TH-32240424", "ticketId": "T-30E48181"}', 'sent', 1, '2026-02-16 05:24:09.217424+01', NULL, '2026-02-16 05:24:09.217424+01', '2026-02-16 05:24:10.261342+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-16839437', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-94B505B4', 'Ticket updated.

Title: Reservation COYA - 2026-02-28 21:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-94B505B4", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:01:44.801964+01', NULL, '2026-02-16 06:01:44.801964+01', '2026-02-16 06:01:46.156397+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-92A87155', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-F034C30F", "threadId": "TH-32240424", "ticketId": "T-90F9F3FD"}', 'sent', 1, '2026-02-16 05:17:47.168925+01', NULL, '2026-02-16 05:17:47.168925+01', '2026-02-16 05:17:47.473269+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-43DC1070', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-F034C30F", "threadId": "TH-32240424", "ticketId": "T-90F9F3FD"}', 'sent', 1, '2026-02-16 05:17:47.170105+01', NULL, '2026-02-16 05:17:47.170105+01', '2026-02-16 05:17:47.47552+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-EDF9DC57', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:30
Guests: 1
Room: 502
Guest: Yuki Tanaka
Special requests: rien', '{"type": "restaurant_booking", "eventId": "EV-B932E383", "threadId": "TH-478C3CF9", "ticketId": "T-78470E1E"}', 'sent', 1, '2026-02-16 05:37:23.741884+01', NULL, '2026-02-16 05:37:23.741884+01', '2026-02-16 05:37:23.937161+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-BA7A48ED', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:30
Guests: 1
Room: 502
Guest: Yuki Tanaka
Special requests: rien', '{"type": "restaurant_booking", "eventId": "EV-B932E383", "threadId": "TH-478C3CF9", "ticketId": "T-78470E1E"}', 'sent', 1, '2026-02-16 05:37:23.74346+01', NULL, '2026-02-16 05:37:23.74346+01', '2026-02-16 05:37:23.941219+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0A05A4D6', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-77DB0A8E", "threadId": "TH-32240424", "ticketId": "T-442D2C1A"}', 'sent', 1, '2026-02-16 05:18:06.364659+01', NULL, '2026-02-16 05:18:06.364659+01', '2026-02-16 05:18:07.056477+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7EDE6E43', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-D5C0FBBD", "threadId": "TH-32240424", "ticketId": "T-7645E534"}', 'sent', 1, '2026-02-16 05:54:04.694395+01', NULL, '2026-02-16 05:54:04.694395+01', '2026-02-16 05:54:05.447957+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-FC344015', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-D5C0FBBD", "threadId": "TH-32240424", "ticketId": "T-7645E534"}', 'sent', 1, '2026-02-16 05:54:04.699256+01', NULL, '2026-02-16 05:54:04.699256+01', '2026-02-16 05:54:05.449834+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2E394B74', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-E85F7D8C", "threadId": "TH-32240424", "ticketId": "T-89E76D7A"}', 'sent', 1, '2026-02-16 05:55:19.382546+01', NULL, '2026-02-16 05:55:19.382546+01', '2026-02-16 05:55:20.677666+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6A1E83FC', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-E85F7D8C", "threadId": "TH-32240424", "ticketId": "T-89E76D7A"}', 'sent', 1, '2026-02-16 05:55:19.384419+01', NULL, '2026-02-16 05:55:19.384419+01', '2026-02-16 05:55:20.678667+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-00AB9D3E', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-7645E534', 'Ticket updated.

Title: Reservation COYA - 2026-02-28 21:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-7645E534", "department": "restaurants"}', 'sent', 1, '2026-02-16 05:59:49.783238+01', NULL, '2026-02-16 05:59:49.783238+01', '2026-02-16 05:59:50.298912+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9C1DC79A', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-77DB0A8E", "threadId": "TH-32240424", "ticketId": "T-442D2C1A"}', 'sent', 1, '2026-02-16 05:18:06.366413+01', NULL, '2026-02-16 05:18:06.366413+01', '2026-02-16 05:18:07.057869+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-05CD9998', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-06ED3522", "threadId": "TH-32240424", "ticketId": "T-FCE7B25A"}', 'sent', 1, '2026-02-16 05:24:28.172443+01', NULL, '2026-02-16 05:24:28.172443+01', '2026-02-16 05:24:28.304377+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7258F001', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-5A69E169", "threadId": "TH-32240424", "ticketId": "T-8BC7F9D0"}', 'sent', 1, '2026-02-16 05:19:04.753861+01', NULL, '2026-02-16 05:19:04.753861+01', '2026-02-16 05:19:06.026855+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-43424FA6', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-5A69E169", "threadId": "TH-32240424", "ticketId": "T-8BC7F9D0"}', 'sent', 1, '2026-02-16 05:19:04.759732+01', NULL, '2026-02-16 05:19:04.759732+01', '2026-02-16 05:19:06.029729+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E199F7FD', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-06ED3522", "threadId": "TH-32240424", "ticketId": "T-FCE7B25A"}', 'sent', 1, '2026-02-16 05:24:28.1735+01', NULL, '2026-02-16 05:24:28.1735+01', '2026-02-16 05:24:28.307721+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F14F1366', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-70173F09", "threadId": "TH-32240424", "ticketId": "T-D52629FD"}', 'sent', 1, '2026-02-16 05:19:20.602725+01', NULL, '2026-02-16 05:19:20.602725+01', '2026-02-16 05:19:21.25242+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5FD490D9', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-70173F09", "threadId": "TH-32240424", "ticketId": "T-D52629FD"}', 'sent', 1, '2026-02-16 05:19:20.60422+01', NULL, '2026-02-16 05:19:20.60422+01', '2026-02-16 05:19:21.2534+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AE15EF39', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-3E87D186", "threadId": "TH-32240424", "ticketId": "T-E4AC2E13"}', 'sent', 1, '2026-02-16 05:19:51.959842+01', NULL, '2026-02-16 05:19:51.959842+01', '2026-02-16 05:19:52.816967+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-82C167E8', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-54C19E7F", "threadId": "TH-32240424", "ticketId": "T-478D05A8"}', 'sent', 1, '2026-02-16 05:52:54.288894+01', NULL, '2026-02-16 05:52:54.288894+01', '2026-02-16 05:52:54.749717+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6CFE85D9', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-54C19E7F", "threadId": "TH-32240424", "ticketId": "T-478D05A8"}', 'sent', 1, '2026-02-16 05:52:54.290599+01', NULL, '2026-02-16 05:52:54.290599+01', '2026-02-16 05:52:54.750961+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-BE4E9383', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-54C19E7F", "threadId": "TH-32240424", "ticketId": "T-478D05A8"}', 'sent', 1, '2026-02-16 05:52:54.291926+01', NULL, '2026-02-16 05:52:54.291926+01', '2026-02-16 05:52:54.752199+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-70A614FC', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-478D05A8', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-478D05A8", "department": "restaurants"}', 'sent', 1, '2026-02-16 05:52:54.423165+01', NULL, '2026-02-16 05:52:54.423165+01', '2026-02-16 05:52:54.771232+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-15757A99', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-B03CB676", "threadId": "TH-32240424", "ticketId": "T-92421CFF"}', 'sent', 1, '2026-02-16 05:55:22.13128+01', NULL, '2026-02-16 05:55:22.13128+01', '2026-02-16 05:55:22.185423+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-FC1D02CC', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-B03CB676", "threadId": "TH-32240424", "ticketId": "T-92421CFF"}', 'sent', 1, '2026-02-16 05:55:22.134182+01', NULL, '2026-02-16 05:55:22.134182+01', '2026-02-16 05:55:22.186938+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7362AECA', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-B001DF32", "threadId": "TH-32240424", "ticketId": "T-94B505B4"}', 'sent', 1, '2026-02-16 05:55:40.685119+01', NULL, '2026-02-16 05:55:40.685119+01', '2026-02-16 05:55:41.742854+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-1F92AB9F', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-B001DF32", "threadId": "TH-32240424", "ticketId": "T-94B505B4"}', 'sent', 1, '2026-02-16 05:55:40.686309+01', NULL, '2026-02-16 05:55:40.686309+01', '2026-02-16 05:55:41.777139+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-BB681CE3', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 23:00
Guests: 2
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-B5932298", "threadId": "TH-478C3CF9", "ticketId": "T-06D1F7AD"}', 'sent', 1, '2026-02-16 23:29:09.290272+01', NULL, '2026-02-16 23:29:09.290272+01', '2026-02-16 23:29:10.833983+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-8DA3FDF8', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-3E87D186", "threadId": "TH-32240424", "ticketId": "T-E4AC2E13"}', 'sent', 1, '2026-02-16 05:19:51.96134+01', NULL, '2026-02-16 05:19:51.96134+01', '2026-02-16 05:19:52.817807+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-394A75D0', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-893CED7E', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-893CED7E", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:10:24.447949+01', NULL, '2026-02-16 06:10:24.447949+01', '2026-02-16 06:10:25.308247+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A7A89F27', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-E0CA31A7", "threadId": "TH-32240424", "ticketId": "T-F451DBE0"}', 'sent', 1, '2026-02-16 05:25:03.460241+01', NULL, '2026-02-16 05:25:03.460241+01', '2026-02-16 05:25:04.413979+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-FDFF3168', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-E0CA31A7", "threadId": "TH-32240424", "ticketId": "T-F451DBE0"}', 'sent', 1, '2026-02-16 05:25:03.461371+01', NULL, '2026-02-16 05:25:03.461371+01', '2026-02-16 05:25:04.416697+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-BC1D8455', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-470820A5', 'Ticket updated.

Title: Reservation COYA - 2026-02-28 21:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-470820A5", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:00:28.029999+01', NULL, '2026-02-16 06:00:28.029999+01', '2026-02-16 06:00:29.381955+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6B453522', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-470820A5', 'Ticket updated.

Title: Reservation COYA - 2026-02-28 21:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-470820A5", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:00:28.033449+01', NULL, '2026-02-16 06:00:28.033449+01', '2026-02-16 06:00:29.383217+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F26772B9', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-94B505B4', 'Ticket updated.

Title: Reservation COYA - 2026-02-28 21:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-94B505B4", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:01:44.806453+01', NULL, '2026-02-16 06:01:44.806453+01', '2026-02-16 06:01:46.157325+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-DF1BDCB7', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-E51A1E18", "threadId": "TH-32240424", "ticketId": "T-470820A5"}', 'sent', 1, '2026-02-16 05:52:57.476841+01', NULL, '2026-02-16 05:52:57.476841+01', '2026-02-16 05:52:57.781035+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F88840A2', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-E51A1E18", "threadId": "TH-32240424", "ticketId": "T-470820A5"}', 'sent', 1, '2026-02-16 05:52:57.47888+01', NULL, '2026-02-16 05:52:57.47888+01', '2026-02-16 05:52:57.782381+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-88A1407F', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • COYA • Room 227', 'New restaurant booking request.

Restaurant: COYA
Date: 2026-02-28
Time: 21:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Anniversary dinner', '{"type": "restaurant_booking", "eventId": "EV-E51A1E18", "threadId": "TH-32240424", "ticketId": "T-470820A5"}', 'sent', 1, '2026-02-16 05:52:57.481702+01', NULL, '2026-02-16 05:52:57.481702+01', '2026-02-16 05:52:57.783823+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5501CE47', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-E85F7D8C", "threadId": "TH-32240424", "ticketId": "T-89E76D7A"}', 'sent', 1, '2026-02-16 05:55:19.385824+01', NULL, '2026-02-16 05:55:19.385824+01', '2026-02-16 05:55:20.679655+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-25D4A254', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-89E76D7A', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-89E76D7A", "department": "restaurants"}', 'sent', 1, '2026-02-16 05:55:19.505073+01', NULL, '2026-02-16 05:55:19.505073+01', '2026-02-16 05:55:20.680641+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-56747A77', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • TEST • Room 227', 'New restaurant booking request.

Restaurant: TEST
Date: 2026-03-01
Time: 19:00
Guests: 2
Room: 227
Guest: Guest
', '{"type": "restaurant_booking", "eventId": "EV-A4AA4530", "threadId": "TH-32240424", "ticketId": "T-DF079382"}', 'sent', 1, '2026-02-16 06:02:38.530782+01', NULL, '2026-02-16 06:02:38.530782+01', '2026-02-16 06:02:38.764101+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-01A6A7BA', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • TEST • Room 227', 'New restaurant booking request.

Restaurant: TEST
Date: 2026-03-01
Time: 19:00
Guests: 2
Room: 227
Guest: Guest
', '{"type": "restaurant_booking", "eventId": "EV-A4AA4530", "threadId": "TH-32240424", "ticketId": "T-DF079382"}', 'sent', 1, '2026-02-16 06:02:38.533033+01', NULL, '2026-02-16 06:02:38.533033+01', '2026-02-16 06:02:38.765261+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5BF192F6', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • TEST • Room 227', 'New restaurant booking request.

Restaurant: TEST
Date: 2026-03-01
Time: 19:00
Guests: 2
Room: 227
Guest: Guest
', '{"type": "restaurant_booking", "eventId": "EV-A4AA4530", "threadId": "TH-32240424", "ticketId": "T-DF079382"}', 'sent', 1, '2026-02-16 06:02:38.534479+01', NULL, '2026-02-16 06:02:38.534479+01', '2026-02-16 06:02:38.766684+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E22A14EF', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-DF079382', 'Ticket updated.

Title: Reservation TEST - 2026-03-01 19:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-DF079382", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:02:38.718852+01', NULL, '2026-02-16 06:02:38.718852+01', '2026-02-16 06:02:38.76806+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-33CF8E45', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-DF079382', 'Ticket updated.

Title: Reservation TEST - 2026-03-01 19:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-DF079382", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:02:38.720143+01', NULL, '2026-02-16 06:02:38.720143+01', '2026-02-16 06:02:38.770818+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-35A86458', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-78470E1E', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-16 11:30 - 1 guest
Room: 502
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-78470E1E", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:03:25.012362+01', NULL, '2026-02-16 06:03:25.012362+01', '2026-02-16 06:03:25.445741+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A6DAFF03', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-78470E1E', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-16 11:30 - 1 guest
Room: 502
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-78470E1E", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:03:25.015637+01', NULL, '2026-02-16 06:03:25.015637+01', '2026-02-16 06:03:25.446974+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B2BB311D', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New service request • concierge • Room 227', 'New service request: Organiser un transport

Room: 227
Department: concierge
Ticket: T-9A9EDBAD', '{"type": "service_request", "ticketId": "T-9A9EDBAD"}', 'sent', 1, '2026-02-24 16:07:35.453045+01', NULL, '2026-02-24 16:07:35.453045+01', '2026-02-24 16:07:36.176539+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0C5874A3', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-893CED7E', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-893CED7E", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:10:24.446421+01', NULL, '2026-02-16 06:10:24.446421+01', '2026-02-16 06:10:25.306088+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AF2FA150', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-43E4BFA1", "threadId": "TH-32240424", "ticketId": "T-893CED7E"}', 'sent', 1, '2026-02-16 06:10:24.104014+01', NULL, '2026-02-16 06:10:24.104014+01', '2026-02-16 06:10:25.309279+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-17D0CC4A', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-75B2B9CB', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-16 11:00 - 3 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-75B2B9CB", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:04:18.124837+01', NULL, '2026-02-16 06:04:18.124837+01', '2026-02-16 06:04:19.541137+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F799D192', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-75B2B9CB', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-16 11:00 - 3 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-75B2B9CB", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:04:18.129653+01', NULL, '2026-02-16 06:04:18.129653+01', '2026-02-16 06:04:19.542065+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-711AF3B3', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-43E4BFA1", "threadId": "TH-32240424", "ticketId": "T-893CED7E"}', 'sent', 1, '2026-02-16 06:10:24.109009+01', NULL, '2026-02-16 06:10:24.109009+01', '2026-02-16 06:10:25.310297+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AF87201A', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-43E4BFA1", "threadId": "TH-32240424", "ticketId": "T-893CED7E"}', 'sent', 1, '2026-02-16 06:10:24.098615+01', NULL, '2026-02-16 06:10:24.098615+01', '2026-02-16 06:10:25.311201+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7F90E101', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-F451DBE0', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-20 19:30 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-F451DBE0", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:05:03.286236+01', NULL, '2026-02-16 06:05:03.286236+01', '2026-02-16 06:05:04.750785+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A5A3A503', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-F451DBE0', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-20 19:30 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-F451DBE0", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:05:03.288895+01', NULL, '2026-02-16 06:05:03.288895+01', '2026-02-16 06:05:04.75508+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2BB02E5A', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-FCE7B25A', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-16 11:00 - 3 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-FCE7B25A", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:06:14.788907+01', NULL, '2026-02-16 06:06:14.788907+01', '2026-02-16 06:06:15.577895+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-852A1640', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-ECD1DBA7', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-ECD1DBA7", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:10:32.403861+01', NULL, '2026-02-16 06:10:32.403861+01', '2026-02-16 06:10:33.010295+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-78E67EB9', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-0677E36D", "threadId": "TH-32240424", "ticketId": "T-94DABED0"}', 'sent', 1, '2026-02-16 06:07:59.933134+01', NULL, '2026-02-16 06:07:59.933134+01', '2026-02-16 06:08:01.342875+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E9BDCBEC', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-E83B5D1C", "threadId": "TH-32240424", "ticketId": "T-ECD1DBA7"}', 'sent', 1, '2026-02-16 06:10:32.285209+01', NULL, '2026-02-16 06:10:32.285209+01', '2026-02-16 06:10:33.028941+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9711CB62', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-E83B5D1C", "threadId": "TH-32240424", "ticketId": "T-ECD1DBA7"}', 'sent', 1, '2026-02-16 06:10:32.281509+01', NULL, '2026-02-16 06:10:32.281509+01', '2026-02-16 06:10:33.042413+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-3230A7B1', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-E83B5D1C", "threadId": "TH-32240424", "ticketId": "T-ECD1DBA7"}', 'sent', 1, '2026-02-16 06:10:32.283347+01', NULL, '2026-02-16 06:10:32.283347+01', '2026-02-16 06:10:33.044344+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-4BB70C6C', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New service request • concierge • Room 227', 'New service request: Organiser un transport

Room: 227
Department: concierge
Ticket: T-9A9EDBAD', '{"type": "service_request", "ticketId": "T-9A9EDBAD"}', 'sent', 1, '2026-02-24 16:07:35.443105+01', NULL, '2026-02-24 16:07:35.443105+01', '2026-02-24 16:07:36.171178+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0FD61AD9', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-FCE7B25A', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-16 11:00 - 3 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-FCE7B25A", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:06:14.792987+01', NULL, '2026-02-16 06:06:14.792987+01', '2026-02-16 06:06:15.550742+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A8784B5A', 'H-FOURSEASONS', 'email', 'mock', 'housekeeping@fourseasons.demo', 'Nettoyage • 2026-02-25 15:00 - 16:00 • Room 227', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-25
Time slot: 15:00 - 16:00
Room: 227
Guest: Guest
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-155EEB98", "threadId": "TH-2002", "ticketId": "T-653700AC", "bookingId": "SB-0F4BAA0F"}', 'sent', 1, '2026-02-23 01:04:13.832554+01', NULL, '2026-02-23 01:04:13.832554+01', '2026-02-23 01:04:15.190563+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A618E104', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:28.994153+01', NULL, '2026-02-24 15:01:28.994153+01', '2026-02-24 15:01:29.792603+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-EDD4801D', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:29.002511+01', NULL, '2026-02-24 15:01:29.002511+01', '2026-02-24 15:01:29.794181+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B11B5B2E', 'H-FOURSEASONS', 'email', 'mock', 'housekeeping@fourseasons.demo', 'Nettoyage • 2026-02-24 10:00 - 11:00 • Room 227', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-24
Time slot: 10:00 - 11:00
Room: 227
Guest: Guest
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-F980C96D", "threadId": "TH-2002", "ticketId": "T-0D5BDB7D", "bookingId": "SB-B743DF42"}', 'sent', 1, '2026-02-24 02:23:27.163797+01', NULL, '2026-02-24 02:23:27.163797+01', '2026-02-24 02:23:27.8634+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-09DB7E2C', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-F6433F33", "threadId": "TH-32240424", "ticketId": "T-1A8D3B01"}', 'sent', 1, '2026-02-16 06:07:55.256367+01', NULL, '2026-02-16 06:07:55.256367+01', '2026-02-16 06:07:55.287477+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-ED9E3773', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-F6433F33", "threadId": "TH-32240424", "ticketId": "T-1A8D3B01"}', 'sent', 1, '2026-02-16 06:07:55.252993+01', NULL, '2026-02-16 06:07:55.252993+01', '2026-02-16 06:07:55.30755+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-3C12DFD4', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-F6433F33", "threadId": "TH-32240424", "ticketId": "T-1A8D3B01"}', 'sent', 1, '2026-02-16 06:07:55.254596+01', NULL, '2026-02-16 06:07:55.254596+01', '2026-02-16 06:07:55.308966+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-05FCEA59', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-A1EA22EB", "threadId": "TH-32240424", "ticketId": "T-8CF0F508"}', 'sent', 1, '2026-02-16 06:07:57.35809+01', NULL, '2026-02-16 06:07:57.35809+01', '2026-02-16 06:07:58.331942+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0BAA6072', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-A1EA22EB", "threadId": "TH-32240424", "ticketId": "T-8CF0F508"}', 'sent', 1, '2026-02-16 06:07:57.355841+01', NULL, '2026-02-16 06:07:57.355841+01', '2026-02-16 06:07:58.333368+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-4B0BFB05', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-8CF0F508', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-8CF0F508", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:07:57.455505+01', NULL, '2026-02-16 06:07:57.455505+01', '2026-02-16 06:07:58.334292+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D26DC88E', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-8CF0F508', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-8CF0F508", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:07:57.452844+01', NULL, '2026-02-16 06:07:57.452844+01', '2026-02-16 06:07:58.33541+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7CD806B1', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-A1EA22EB", "threadId": "TH-32240424", "ticketId": "T-8CF0F508"}', 'sent', 1, '2026-02-16 06:07:57.377779+01', NULL, '2026-02-16 06:07:57.377779+01', '2026-02-16 06:07:58.336359+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-646147DE', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-0677E36D", "threadId": "TH-32240424", "ticketId": "T-94DABED0"}', 'sent', 1, '2026-02-16 06:07:59.935986+01', NULL, '2026-02-16 06:07:59.935986+01', '2026-02-16 06:08:01.340865+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-21EEB8C0', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-0677E36D", "threadId": "TH-32240424", "ticketId": "T-94DABED0"}', 'sent', 1, '2026-02-16 06:07:59.93482+01', NULL, '2026-02-16 06:07:59.93482+01', '2026-02-16 06:08:01.341901+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-1BFD80D1', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-180E66F4", "threadId": "TH-32240424", "ticketId": "T-E2EB51DC"}', 'sent', 1, '2026-02-16 06:09:07.633083+01', NULL, '2026-02-16 06:09:07.633083+01', '2026-02-16 06:09:08.00896+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A53781A5', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-E2EB51DC', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-E2EB51DC", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:09:07.780467+01', NULL, '2026-02-16 06:09:07.780467+01', '2026-02-16 06:09:08.042207+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-30913DC0', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Nettoyage • 2026-02-25 15:00 - 16:00 • Room 227', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-25
Time slot: 15:00 - 16:00
Room: 227
Guest: Guest
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-155EEB98", "threadId": "TH-2002", "ticketId": "T-653700AC", "bookingId": "SB-0F4BAA0F"}', 'sent', 1, '2026-02-23 01:04:13.828006+01', NULL, '2026-02-23 01:04:13.828006+01', '2026-02-23 01:04:15.21058+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-44AE095D', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-ECD1DBA7', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-ECD1DBA7", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:10:32.408789+01', NULL, '2026-02-16 06:10:32.408789+01', '2026-02-16 06:10:33.033475+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2A932834', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-E2EB51DC', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-E2EB51DC", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:09:07.781731+01', NULL, '2026-02-16 06:09:07.781731+01', '2026-02-16 06:09:07.97723+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-1FFC2BE5', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-180E66F4", "threadId": "TH-32240424", "ticketId": "T-E2EB51DC"}', 'sent', 1, '2026-02-16 06:09:07.635955+01', NULL, '2026-02-16 06:09:07.635955+01', '2026-02-16 06:09:08.055714+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AC3ECEF8', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-180E66F4", "threadId": "TH-32240424", "ticketId": "T-E2EB51DC"}', 'sent', 1, '2026-02-16 06:09:07.634824+01', NULL, '2026-02-16 06:09:07.634824+01', '2026-02-16 06:09:08.077134+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9EF9CBB7', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Nettoyage • 2026-02-24 10:00 - 11:00 • Room 227', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-24
Time slot: 10:00 - 11:00
Room: 227
Guest: Guest
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-F980C96D", "threadId": "TH-2002", "ticketId": "T-0D5BDB7D", "bookingId": "SB-B743DF42"}', 'sent', 1, '2026-02-24 02:23:27.126463+01', NULL, '2026-02-24 02:23:27.126463+01', '2026-02-24 02:23:28.31731+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-885A7901', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New service request • concierge • Room 227', 'New service request: Organiser un transport

Room: 227
Department: concierge
Ticket: T-8080A958', '{"type": "service_request", "ticketId": "T-8080A958"}', 'sent', 1, '2026-02-24 23:25:55.480009+01', NULL, '2026-02-24 23:25:55.480009+01', '2026-02-24 23:25:55.725538+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-09392955', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-F0D1C0F1", "threadId": "TH-32240424", "ticketId": "T-66CB4A96"}', 'sent', 1, '2026-02-24 02:23:35.88368+01', NULL, '2026-02-24 02:23:35.88368+01', '2026-02-24 02:23:36.510928+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F9EBBED9', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-F0D1C0F1", "threadId": "TH-32240424", "ticketId": "T-66CB4A96"}', 'sent', 1, '2026-02-24 02:23:35.859553+01', NULL, '2026-02-24 02:23:35.859553+01', '2026-02-24 02:23:36.523264+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-4CCAB249', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-4EDC2328", "threadId": "TH-32240424", "ticketId": "T-2D939BB3"}', 'sent', 1, '2026-02-16 18:25:56.421395+01', NULL, '2026-02-16 18:25:56.421395+01', '2026-02-16 18:25:57.097847+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-FF47E7F1', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-4EDC2328", "threadId": "TH-32240424", "ticketId": "T-2D939BB3"}', 'sent', 1, '2026-02-16 18:25:56.422296+01', NULL, '2026-02-16 18:25:56.422296+01', '2026-02-16 18:25:57.117134+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E37E9DA9', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-A7A408C4', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-A7A408C4", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:09:27.635659+01', NULL, '2026-02-16 06:09:27.635659+01', '2026-02-16 06:09:27.707475+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-52FF3D56', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-7D69CFBF", "threadId": "TH-32240424", "ticketId": "T-A7A408C4"}', 'sent', 1, '2026-02-16 06:09:27.536765+01', NULL, '2026-02-16 06:09:27.536765+01', '2026-02-16 06:09:27.728007+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0CD0AC95', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-7D69CFBF", "threadId": "TH-32240424", "ticketId": "T-A7A408C4"}', 'sent', 1, '2026-02-16 06:09:27.534944+01', NULL, '2026-02-16 06:09:27.534944+01', '2026-02-16 06:09:27.729973+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B9D63797', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-A7A408C4', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-A7A408C4", "department": "restaurants"}', 'sent', 1, '2026-02-16 06:09:27.64222+01', NULL, '2026-02-16 06:09:27.64222+01', '2026-02-16 06:09:27.74285+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6A892F31', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-7D69CFBF", "threadId": "TH-32240424", "ticketId": "T-A7A408C4"}', 'sent', 1, '2026-02-16 06:09:27.540335+01', NULL, '2026-02-16 06:09:27.540335+01', '2026-02-16 06:09:27.7439+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-22D13A01', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New service request • concierge • Room 502', 'New service request: Organiser un transport

Room: 502
Department: concierge
Ticket: T-63B5B930', '{"type": "service_request", "ticketId": "T-63B5B930"}', 'pending', 7, '2026-02-28 13:46:24.142494+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:35:37.785493+01', '2026-02-28 13:41:03.142494+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-3D6396D5', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New service request • concierge • Room 227', 'New service request: Organiser un transport

Room: 227
Department: concierge
Ticket: T-8080A958', '{"type": "service_request", "ticketId": "T-8080A958"}', 'sent', 1, '2026-02-24 23:25:55.491802+01', NULL, '2026-02-24 23:25:55.491802+01', '2026-02-24 23:25:55.735462+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E7C22E4A', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Nettoyage • 2026-02-23 12:00 - 13:00 • Room 502', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-23
Time slot: 12:00 - 13:00
Room: 502
Guest: Yuki Tanaka
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-E35D79BA", "threadId": "TH-3FE97D91", "ticketId": "T-052C4D9B", "bookingId": "SB-C0E33CA2"}', 'sent', 1, '2026-02-23 01:12:43.417108+01', NULL, '2026-02-23 01:12:43.417108+01', '2026-02-23 01:12:44.736404+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D02E7232', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-19CCDD8A", "threadId": "TH-32240424", "ticketId": "T-CCCC0502"}', 'sent', 1, '2026-02-16 18:25:56.226972+01', NULL, '2026-02-16 18:25:56.226972+01', '2026-02-16 18:25:57.099198+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B38385DA', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-19CCDD8A", "threadId": "TH-32240424", "ticketId": "T-CCCC0502"}', 'sent', 1, '2026-02-16 18:25:56.234001+01', NULL, '2026-02-16 18:25:56.234001+01', '2026-02-16 18:25:57.118713+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D14E6AED', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-2D939BB3', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-2D939BB3", "department": "restaurants"}', 'sent', 1, '2026-02-16 18:25:56.486089+01', NULL, '2026-02-16 18:25:56.486089+01', '2026-02-16 18:25:57.12006+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-62BE4546', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-2D939BB3', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-2D939BB3", "department": "restaurants"}', 'sent', 1, '2026-02-16 18:25:56.487463+01', NULL, '2026-02-16 18:25:56.487463+01', '2026-02-16 18:25:57.121367+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-948F3C26', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-19CCDD8A", "threadId": "TH-32240424", "ticketId": "T-CCCC0502"}', 'sent', 1, '2026-02-16 18:25:56.231717+01', NULL, '2026-02-16 18:25:56.231717+01', '2026-02-16 18:25:57.122672+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-38C90667', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-4EDC2328", "threadId": "TH-32240424", "ticketId": "T-2D939BB3"}', 'sent', 1, '2026-02-16 18:25:56.423887+01', NULL, '2026-02-16 18:25:56.423887+01', '2026-02-16 18:25:57.124073+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2EC7B41D', 'H-FOURSEASONS', 'email', 'mock', 'housekeeping@fourseasons.demo', 'Nettoyage • 2026-02-23 12:00 - 13:00 • Room 502', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-23
Time slot: 12:00 - 13:00
Room: 502
Guest: Yuki Tanaka
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-E35D79BA", "threadId": "TH-3FE97D91", "ticketId": "T-052C4D9B", "bookingId": "SB-C0E33CA2"}', 'sent', 1, '2026-02-23 01:12:43.420293+01', NULL, '2026-02-23 01:12:43.420293+01', '2026-02-23 01:12:44.738952+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-47225579', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:32.606403+01', NULL, '2026-02-24 15:01:32.606403+01', '2026-02-24 15:01:32.834617+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-33DABF08', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:38.938129+01', NULL, '2026-02-24 15:01:38.938129+01', '2026-02-24 15:01:40.383207+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0925DD04', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 18:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-ADE7D644", "threadId": "TH-32240424", "ticketId": "T-5ACAA962"}', 'sent', 1, '2026-02-16 18:26:27.518052+01', NULL, '2026-02-16 18:26:27.518052+01', '2026-02-16 18:26:28.7795+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-71E3B49B', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 18:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-ADE7D644", "threadId": "TH-32240424", "ticketId": "T-5ACAA962"}', 'sent', 1, '2026-02-16 18:26:27.497749+01', NULL, '2026-02-16 18:26:27.497749+01', '2026-02-16 18:26:28.780918+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-847E3DF3', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 18:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-ADE7D644", "threadId": "TH-32240424", "ticketId": "T-5ACAA962"}', 'sent', 1, '2026-02-16 18:26:27.517173+01', NULL, '2026-02-16 18:26:27.517173+01', '2026-02-16 18:26:28.785346+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-21406DA7', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-B6C42542", "threadId": "TH-32240424", "ticketId": "T-96AE7F06"}', 'sent', 1, '2026-02-16 18:27:02.830862+01', NULL, '2026-02-16 18:27:02.830862+01', '2026-02-16 18:27:03.392068+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D7E26328', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-8100EECE", "threadId": "TH-32240424", "ticketId": "T-9B6B2F99"}', 'sent', 1, '2026-02-16 18:27:02.974615+01', NULL, '2026-02-16 18:27:02.974615+01', '2026-02-16 18:27:03.39315+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-454E4E9D', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-8100EECE", "threadId": "TH-32240424", "ticketId": "T-9B6B2F99"}', 'sent', 1, '2026-02-16 18:27:02.973748+01', NULL, '2026-02-16 18:27:02.973748+01', '2026-02-16 18:27:03.394351+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-478CB0FD', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:32.795318+01', NULL, '2026-02-24 15:01:32.795318+01', '2026-02-24 15:01:32.835972+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-FC0F90AE', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:32.790932+01', NULL, '2026-02-24 15:01:32.790932+01', '2026-02-24 15:01:32.839005+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-191F95A4', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-F38A3D40", "threadId": "TH-32240424", "ticketId": "T-7316E507"}', 'sent', 1, '2026-02-24 02:18:55.828956+01', NULL, '2026-02-24 02:18:55.828956+01', '2026-02-24 02:18:56.249249+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A10B8F5E', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-F38A3D40", "threadId": "TH-32240424", "ticketId": "T-7316E507"}', 'sent', 1, '2026-02-24 02:18:55.824248+01', NULL, '2026-02-24 02:18:55.824248+01', '2026-02-24 02:18:56.260119+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F07D1A4D', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-9B6B2F99', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-9B6B2F99", "department": "restaurants"}', 'sent', 1, '2026-02-16 18:27:03.086495+01', NULL, '2026-02-16 18:27:03.086495+01', '2026-02-16 18:27:03.38849+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AA1B062C', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-8100EECE", "threadId": "TH-32240424", "ticketId": "T-9B6B2F99"}', 'sent', 1, '2026-02-16 18:27:02.975417+01', NULL, '2026-02-16 18:27:02.975417+01', '2026-02-16 18:27:03.389832+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E6DBE997', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-9B6B2F99', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-9B6B2F99", "department": "restaurants"}', 'sent', 1, '2026-02-16 18:27:03.085356+01', NULL, '2026-02-16 18:27:03.085356+01', '2026-02-16 18:27:03.390955+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-3322CD64', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-B6C42542", "threadId": "TH-32240424", "ticketId": "T-96AE7F06"}', 'sent', 1, '2026-02-16 18:27:02.830056+01', NULL, '2026-02-16 18:27:02.830056+01', '2026-02-16 18:27:03.416079+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9FC0B4BF', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-B6C42542", "threadId": "TH-32240424", "ticketId": "T-96AE7F06"}', 'sent', 1, '2026-02-16 18:27:02.828488+01', NULL, '2026-02-16 18:27:02.828488+01', '2026-02-16 18:27:03.417632+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D21CAE4A', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-20
Time: 19:30
Guests: 2
Room: 227
Guest: Guest
Special requests: Window seat please', '{"type": "restaurant_booking", "eventId": "EV-F38A3D40", "threadId": "TH-32240424", "ticketId": "T-7316E507"}', 'sent', 1, '2026-02-24 02:18:55.811374+01', NULL, '2026-02-24 02:18:55.811374+01', '2026-02-24 02:18:56.26425+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D11CC4C5', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 18:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-8E6FA4D0", "threadId": "TH-32240424", "ticketId": "T-E41CBDEA"}', 'sent', 1, '2026-02-16 18:27:27.431713+01', NULL, '2026-02-16 18:27:27.431713+01', '2026-02-16 18:27:27.476048+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6D680F95', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-66CB4A96', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-66CB4A96", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:23:36.267468+01', NULL, '2026-02-24 02:23:36.267468+01', '2026-02-24 02:23:36.533784+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B571B74B', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-66CB4A96', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-25 20:00 - 4 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-66CB4A96", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:23:36.259938+01', NULL, '2026-02-24 02:23:36.259938+01', '2026-02-24 02:23:36.540274+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2ECB8544', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:37.837824+01', NULL, '2026-02-24 15:01:37.837824+01', '2026-02-24 15:01:38.857837+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-10CC3365', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:37.839711+01', NULL, '2026-02-24 15:01:37.839711+01', '2026-02-24 15:01:38.859198+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-8BD62F32', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-4809BA61', 'Ticket updated.

Title: Reservation SEA FU - 2026-03-01 20:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-4809BA61", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:24:57.938279+01', NULL, '2026-02-24 02:24:57.938279+01', '2026-02-24 02:24:59.017229+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-996F9E4E', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896297653', '{"type": "restaurant_booking", "eventId": "EV-AB36118D", "threadId": "TH-32240424", "ticketId": "T-4809BA61"}', 'sent', 1, '2026-02-24 02:24:57.924154+01', NULL, '2026-02-24 02:24:57.924154+01', '2026-02-24 02:24:59.113511+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9AA2D374', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:42.595073+01', NULL, '2026-02-24 15:01:42.595073+01', '2026-02-24 15:01:43.406498+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A59BB5B3', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 18:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-8E6FA4D0", "threadId": "TH-32240424", "ticketId": "T-E41CBDEA"}', 'sent', 1, '2026-02-16 18:27:27.430779+01', NULL, '2026-02-16 18:27:27.430779+01', '2026-02-16 18:27:27.477561+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2F3470B5', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 18:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-8E6FA4D0", "threadId": "TH-32240424", "ticketId": "T-E41CBDEA"}', 'sent', 1, '2026-02-16 18:27:27.429439+01', NULL, '2026-02-16 18:27:27.429439+01', '2026-02-16 18:27:27.478739+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D622A7A8', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:32.440664+01', NULL, '2026-02-24 15:01:32.440664+01', '2026-02-24 15:01:32.836988+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7F303530', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 19:00
Guests: 3
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-4CD607EE", "threadId": "TH-478C3CF9", "ticketId": "T-895E1193"}', 'sent', 1, '2026-02-16 18:34:10.333475+01', NULL, '2026-02-16 18:34:10.333475+01', '2026-02-16 18:34:11.038605+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6B93B7AD', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 19:00
Guests: 3
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-4CD607EE", "threadId": "TH-478C3CF9", "ticketId": "T-895E1193"}', 'sent', 1, '2026-02-16 18:34:10.330689+01', NULL, '2026-02-16 18:34:10.330689+01', '2026-02-16 18:34:11.040353+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-737194C3', 'H-FOURSEASONS', 'email', 'mock', 'housekeeping@fourseasons.demo', 'Nettoyage • 2026-02-25 10:00 - 11:00 • Room 227', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-25
Time slot: 10:00 - 11:00
Room: 227
Guest: Guest
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-606B21DB", "threadId": "TH-2002", "ticketId": "T-26FBEBD5", "bookingId": "SB-615B4E16"}', 'sent', 1, '2026-02-24 02:19:10.575592+01', NULL, '2026-02-24 02:19:10.575592+01', '2026-02-24 02:19:11.599501+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-BAAEA842', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Nettoyage • 2026-02-25 10:00 - 11:00 • Room 227', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-25
Time slot: 10:00 - 11:00
Room: 227
Guest: Guest
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-606B21DB", "threadId": "TH-2002", "ticketId": "T-26FBEBD5", "bookingId": "SB-615B4E16"}', 'sent', 1, '2026-02-24 02:19:10.57358+01', NULL, '2026-02-24 02:19:10.57358+01', '2026-02-24 02:19:11.915551+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-97ABD42F', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:32.189831+01', NULL, '2026-02-24 15:01:32.189831+01', '2026-02-24 15:01:32.837914+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9082D43E', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-25
Time: 20:00
Guests: 4
Room: 227
Guest: Guest
Special requests: Birthday celebration, quiet table please', '{"type": "restaurant_booking", "eventId": "EV-F0D1C0F1", "threadId": "TH-32240424", "ticketId": "T-66CB4A96"}', 'sent', 1, '2026-02-24 02:23:35.879396+01', NULL, '2026-02-24 02:23:35.879396+01', '2026-02-24 02:23:36.569006+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7EF45A0B', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896297653', '{"type": "restaurant_booking", "eventId": "EV-AB36118D", "threadId": "TH-32240424", "ticketId": "T-4809BA61"}', 'sent', 1, '2026-02-24 02:24:57.914838+01', NULL, '2026-02-24 02:24:57.914838+01', '2026-02-24 02:24:58.978507+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0E1F296F', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896297653', '{"type": "restaurant_booking", "eventId": "EV-AB36118D", "threadId": "TH-32240424", "ticketId": "T-4809BA61"}', 'sent', 1, '2026-02-24 02:24:57.911034+01', NULL, '2026-02-24 02:24:57.911034+01', '2026-02-24 02:24:59.075623+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-CCA09F1A', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-4809BA61', 'Ticket updated.

Title: Reservation SEA FU - 2026-03-01 20:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-4809BA61", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:24:57.940311+01', NULL, '2026-02-24 02:24:57.940311+01', '2026-02-24 02:24:59.090426+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6F80D02B', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896326346', '{"type": "restaurant_booking", "eventId": "EV-9810A3B8", "threadId": "TH-32240424", "ticketId": "T-31DE9320"}', 'sent', 1, '2026-02-24 02:25:26.817039+01', NULL, '2026-02-24 02:25:26.817039+01', '2026-02-24 02:25:28.526746+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-44308FB7', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896326346', '{"type": "restaurant_booking", "eventId": "EV-9810A3B8", "threadId": "TH-32240424", "ticketId": "T-31DE9320"}', 'sent', 1, '2026-02-24 02:25:26.824477+01', NULL, '2026-02-24 02:25:26.824477+01', '2026-02-24 02:25:28.538496+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AD9D655B', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896326346', '{"type": "restaurant_booking", "eventId": "EV-9810A3B8", "threadId": "TH-32240424", "ticketId": "T-31DE9320"}', 'sent', 1, '2026-02-24 02:25:26.833466+01', NULL, '2026-02-24 02:25:26.833466+01', '2026-02-24 02:25:28.561462+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-17571AB7', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-BE140857', 'Ticket updated.

Title: Reservation SEA FU - 2026-03-01 20:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-BE140857", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:25:56.24085+01', NULL, '2026-02-24 02:25:56.24085+01', '2026-02-24 02:25:57.590894+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A3233A31', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-BE140857', 'Ticket updated.

Title: Reservation SEA FU - 2026-03-01 20:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-BE140857", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:25:56.267824+01', NULL, '2026-02-24 02:25:56.267824+01', '2026-02-24 02:25:57.68723+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D3EB9899', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-16
Time: 19:00
Guests: 3
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-4CD607EE", "threadId": "TH-478C3CF9", "ticketId": "T-895E1193"}', 'sent', 1, '2026-02-16 18:34:10.334401+01', NULL, '2026-02-16 18:34:10.334401+01', '2026-02-16 18:34:11.03575+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9F547A52', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:32.197949+01', NULL, '2026-02-24 15:01:32.197949+01', '2026-02-24 15:01:32.811351+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-DC5918D8', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Nettoyage • 2026-02-24 10:00 - 11:00 • Room 227', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-24
Time slot: 10:00 - 11:00
Room: 227
Guest: Guest
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-8F10EDE6", "threadId": "TH-2002", "ticketId": "T-9BF461C3", "bookingId": "SB-D0A7C7F7"}', 'sent', 1, '2026-02-24 02:23:19.922193+01', NULL, '2026-02-24 02:23:19.922193+01', '2026-02-24 02:23:20.68049+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7D24FB81', 'H-FOURSEASONS', 'email', 'mock', 'housekeeping@fourseasons.demo', 'Nettoyage • 2026-02-24 10:00 - 11:00 • Room 227', 'New cleaning booking.

Service: Nettoyage
Date: 2026-02-24
Time slot: 10:00 - 11:00
Room: 227
Guest: Guest
Price: 50.00 EUR', '{"type": "cleaning_booking", "eventId": "EV-8F10EDE6", "threadId": "TH-2002", "ticketId": "T-9BF461C3", "bookingId": "SB-D0A7C7F7"}', 'sent', 1, '2026-02-24 02:23:19.958794+01', NULL, '2026-02-24 02:23:19.958794+01', '2026-02-24 02:23:20.686797+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6AD05875', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:31.491635+01', NULL, '2026-02-24 15:01:31.491635+01', '2026-02-24 15:01:32.844377+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7D70D85F', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:32.603838+01', NULL, '2026-02-24 15:01:32.603838+01', '2026-02-24 15:01:32.845445+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-84528A23', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-19
Time: 11:30
Guests: 6
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-CFA2C581", "threadId": "TH-478C3CF9", "ticketId": "T-C04F5E5E"}', 'sent', 1, '2026-02-16 20:14:47.878056+01', NULL, '2026-02-16 20:14:47.878056+01', '2026-02-16 20:14:48.204947+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-4BAA3244', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-19
Time: 11:30
Guests: 6
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-CFA2C581", "threadId": "TH-478C3CF9", "ticketId": "T-C04F5E5E"}', 'sent', 1, '2026-02-16 20:14:47.877146+01', NULL, '2026-02-16 20:14:47.877146+01', '2026-02-16 20:14:48.209572+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E3933B3C', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-19
Time: 11:30
Guests: 6
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-CFA2C581", "threadId": "TH-478C3CF9", "ticketId": "T-C04F5E5E"}', 'sent', 1, '2026-02-16 20:14:47.872818+01', NULL, '2026-02-16 20:14:47.872818+01', '2026-02-16 20:14:48.2561+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A6509D29', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-C04F5E5E', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-19 11:30 - 6 guests
Room: 502
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-C04F5E5E", "department": "restaurants"}', 'sent', 1, '2026-02-16 21:02:54.917462+01', NULL, '2026-02-16 21:02:54.917462+01', '2026-02-16 21:02:55.387596+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-24B6EA35', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Ticket updated • restaurants • T-C04F5E5E', 'Ticket updated.

Title: Reservation SEA FU - 2026-02-19 11:30 - 6 guests
Room: 502
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-C04F5E5E", "department": "restaurants"}', 'sent', 1, '2026-02-16 21:02:54.908824+01', NULL, '2026-02-16 21:02:54.908824+01', '2026-02-16 21:02:55.391168+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9934FC4C', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-24
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-0BF62512", "threadId": "TH-32240424", "ticketId": "T-FC02C79F"}', 'sent', 1, '2026-02-24 02:24:40.330704+01', NULL, '2026-02-24 02:24:40.330704+01', '2026-02-24 02:24:40.685399+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-91C12DEC', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-24
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-0BF62512", "threadId": "TH-32240424", "ticketId": "T-FC02C79F"}', 'sent', 1, '2026-02-24 02:24:40.32373+01', NULL, '2026-02-24 02:24:40.32373+01', '2026-02-24 02:24:40.712622+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B3E53F21', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-24
Time: 11:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Terrasse si possible, anniversaire', '{"type": "restaurant_booking", "eventId": "EV-0BF62512", "threadId": "TH-32240424", "ticketId": "T-FC02C79F"}', 'sent', 1, '2026-02-24 02:24:40.314782+01', NULL, '2026-02-24 02:24:40.314782+01', '2026-02-24 02:24:40.717522+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D88546C8', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-31DE9320', 'Ticket updated.

Title: Reservation SEA FU - 2026-03-01 20:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-31DE9320", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:25:27.064623+01', NULL, '2026-02-24 02:25:27.064623+01', '2026-02-24 02:25:28.511306+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-1C7A536B', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-31DE9320', 'Ticket updated.

Title: Reservation SEA FU - 2026-03-01 20:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-31DE9320", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:25:27.021647+01', NULL, '2026-02-24 02:25:27.021647+01', '2026-02-24 02:25:28.515863+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-BC5E33CC', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896356002', '{"type": "restaurant_booking", "eventId": "EV-6F04D948", "threadId": "TH-32240424", "ticketId": "T-BE140857"}', 'sent', 1, '2026-02-24 02:25:56.124101+01', NULL, '2026-02-24 02:25:56.124101+01', '2026-02-24 02:25:57.585545+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-E1A49918', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896356002', '{"type": "restaurant_booking", "eventId": "EV-6F04D948", "threadId": "TH-32240424", "ticketId": "T-BE140857"}', 'sent', 1, '2026-02-24 02:25:56.13669+01', NULL, '2026-02-24 02:25:56.13669+01', '2026-02-24 02:25:57.626518+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-DE3BD7C5', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:31.488951+01', NULL, '2026-02-24 15:01:31.488951+01', '2026-02-24 15:01:32.831037+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-8485C3EE', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896356002', '{"type": "restaurant_booking", "eventId": "EV-6F04D948", "threadId": "TH-32240424", "ticketId": "T-BE140857"}', 'sent', 1, '2026-02-24 02:25:56.162161+01', NULL, '2026-02-24 02:25:56.162161+01', '2026-02-24 02:25:57.720323+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-57A55887', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:32.43778+01', NULL, '2026-02-24 15:01:32.43778+01', '2026-02-24 15:01:32.84051+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-93311095', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:39.18816+01', NULL, '2026-02-24 15:01:39.18816+01', '2026-02-24 15:01:40.386026+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-9CA6499F', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:39.191159+01', NULL, '2026-02-24 15:01:39.191159+01', '2026-02-24 15:01:40.391684+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2A8283FF', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:38.940475+01', NULL, '2026-02-24 15:01:38.940475+01', '2026-02-24 15:01:40.392841+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-3DC83471', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:42.596532+01', NULL, '2026-02-24 15:01:42.596532+01', '2026-02-24 15:01:43.408961+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-1611D4B5', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Ticket updated • restaurants • T-3C1AA2F7', 'Ticket updated.

Title: Reservation SEA FU - 2026-03-01 20:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-3C1AA2F7", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:28:57.990492+01', NULL, '2026-02-24 02:28:57.990492+01', '2026-02-24 02:28:58.52803+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A8806891', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896537689', '{"type": "restaurant_booking", "eventId": "EV-1A19E99C", "threadId": "TH-32240424", "ticketId": "T-3C1AA2F7"}', 'sent', 1, '2026-02-24 02:28:57.913913+01', NULL, '2026-02-24 02:28:57.913913+01', '2026-02-24 02:28:58.532482+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-45AC437E', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896537689', '{"type": "restaurant_booking", "eventId": "EV-1A19E99C", "threadId": "TH-32240424", "ticketId": "T-3C1AA2F7"}', 'sent', 1, '2026-02-24 02:28:57.964413+01', NULL, '2026-02-24 02:28:57.964413+01', '2026-02-24 02:28:58.726661+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-BE56F840', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Regression test 1771896537689', '{"type": "restaurant_booking", "eventId": "EV-1A19E99C", "threadId": "TH-32240424", "ticketId": "T-3C1AA2F7"}', 'sent', 1, '2026-02-24 02:28:57.961438+01', NULL, '2026-02-24 02:28:57.961438+01', '2026-02-24 02:28:58.785269+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-928FA97B', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Ticket updated • restaurants • T-3C1AA2F7', 'Ticket updated.

Title: Reservation SEA FU - 2026-03-01 20:00 - 2 guests
Room: 227
Department: restaurants
Status: pending → resolved
Assignee: unassigned', '{"type": "ticket_updated", "status": "resolved", "ticketId": "T-3C1AA2F7", "department": "restaurants"}', 'sent', 1, '2026-02-24 02:28:57.988183+01', NULL, '2026-02-24 02:28:57.988183+01', '2026-02-24 02:28:58.881523+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-198A1BE9', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-06
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Cursor pagination test', '{"type": "restaurant_booking", "eventId": "EV-1D454424", "threadId": "TH-32240424", "ticketId": "T-E69D1520"}', 'sent', 1, '2026-02-24 02:30:50.927677+01', NULL, '2026-02-24 02:30:50.927677+01', '2026-02-24 02:30:51.030666+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7605BE2B', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-05
Time: 19:00
Guests: 1
Room: 227
Guest: Guest
Special requests: Pagination test', '{"type": "restaurant_booking", "eventId": "EV-6D1D4508", "threadId": "TH-32240424", "ticketId": "T-BF0CF2CD"}', 'sent', 1, '2026-02-24 02:30:50.623783+01', NULL, '2026-02-24 02:30:50.623783+01', '2026-02-24 02:30:51.040584+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6DFB8DAA', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-06
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Cursor pagination test', '{"type": "restaurant_booking", "eventId": "EV-1D454424", "threadId": "TH-32240424", "ticketId": "T-E69D1520"}', 'sent', 1, '2026-02-24 02:30:50.921991+01', NULL, '2026-02-24 02:30:50.921991+01', '2026-02-24 02:30:51.06829+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-608953B7', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-06
Time: 20:00
Guests: 2
Room: 227
Guest: Guest
Special requests: Cursor pagination test', '{"type": "restaurant_booking", "eventId": "EV-1D454424", "threadId": "TH-32240424", "ticketId": "T-E69D1520"}', 'sent', 1, '2026-02-24 02:30:50.934138+01', NULL, '2026-02-24 02:30:50.934138+01', '2026-02-24 02:30:51.081161+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-CCA25FC6', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-05
Time: 19:00
Guests: 1
Room: 227
Guest: Guest
Special requests: Pagination test', '{"type": "restaurant_booking", "eventId": "EV-6D1D4508", "threadId": "TH-32240424", "ticketId": "T-BF0CF2CD"}', 'sent', 1, '2026-02-24 02:30:50.620518+01', NULL, '2026-02-24 02:30:50.620518+01', '2026-02-24 02:30:51.094146+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7594BFEC', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-07
Time: 21:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Default limit test', '{"type": "restaurant_booking", "eventId": "EV-C64F3158", "threadId": "TH-32240424", "ticketId": "T-4635B3C3"}', 'sent', 1, '2026-02-24 02:30:51.178334+01', NULL, '2026-02-24 02:30:51.178334+01', '2026-02-24 02:30:51.965924+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-3377CD1A', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-05
Time: 19:00
Guests: 1
Room: 227
Guest: Guest
Special requests: Pagination test', '{"type": "restaurant_booking", "eventId": "EV-6D1D4508", "threadId": "TH-32240424", "ticketId": "T-BF0CF2CD"}', 'sent', 1, '2026-02-24 02:30:50.576002+01', NULL, '2026-02-24 02:30:50.576002+01', '2026-02-24 02:30:51.1182+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5A13D393', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:39.440048+01', NULL, '2026-02-24 15:01:39.440048+01', '2026-02-24 15:01:40.381172+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-441F1230', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:39.688803+01', NULL, '2026-02-24 15:01:39.688803+01', '2026-02-24 15:01:40.384746+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-41E51F35', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:39.442616+01', NULL, '2026-02-24 15:01:39.442616+01', '2026-02-24 15:01:40.387126+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-35617D31', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:39.691801+01', NULL, '2026-02-24 15:01:39.691801+01', '2026-02-24 15:01:40.390639+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-4BF257C7', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Reserver un restaurant', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:40.886981+01', NULL, '2026-02-24 15:01:40.886981+01', '2026-02-24 15:01:41.898405+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-3FE945A8', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Reserver un restaurant', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:40.890569+01', NULL, '2026-02-24 15:01:40.890569+01', '2026-02-24 15:01:41.901268+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-596C1BBF', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New service request • concierge • Room 227', 'New service request: Organiser un transport

Room: 227
Department: concierge
Ticket: T-C80A13A2', '{"type": "service_request", "ticketId": "T-C80A13A2"}', 'sent', 1, '2026-02-24 15:34:51.206488+01', NULL, '2026-02-24 15:34:51.206488+01', '2026-02-24 15:34:52.101597+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0C109D4B', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New service request • concierge • Room 227', 'New service request: Organiser un transport

Room: 227
Department: concierge
Ticket: T-C80A13A2', '{"type": "service_request", "ticketId": "T-C80A13A2"}', 'sent', 1, '2026-02-24 15:34:51.200653+01', NULL, '2026-02-24 15:34:51.200653+01', '2026-02-24 15:34:52.103842+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-57964AFE', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:40.985052+01', NULL, '2026-02-24 15:56:40.985052+01', '2026-02-24 15:56:41.423661+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-07CFF658', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:42.674037+01', NULL, '2026-02-24 15:56:42.674037+01', '2026-02-24 15:56:42.928518+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-50AD027A', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:42.682277+01', NULL, '2026-02-24 15:56:42.682277+01', '2026-02-24 15:56:42.93224+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-4E1E950A', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:49.963237+01', NULL, '2026-02-24 15:56:49.963237+01', '2026-02-24 15:56:50.566117+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-ED1CC076', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:49.76912+01', NULL, '2026-02-24 15:56:49.76912+01', '2026-02-24 15:56:50.617933+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2DBB599C', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:49.775722+01', NULL, '2026-02-24 15:56:49.775722+01', '2026-02-24 15:56:50.642798+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-416A3D30', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:55.527441+01', NULL, '2026-02-24 15:56:55.527441+01', '2026-02-24 15:56:56.693143+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-104AF4AD', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:55.525484+01', NULL, '2026-02-24 15:56:55.525484+01', '2026-02-24 15:56:56.694427+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-AC341019', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:57.379244+01', NULL, '2026-02-24 15:56:57.379244+01', '2026-02-24 15:56:58.217721+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-163836E8', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:57.368674+01', NULL, '2026-02-24 15:56:57.368674+01', '2026-02-24 15:56:58.219058+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-EB02E5DD', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:57:02.481605+01', NULL, '2026-02-24 15:57:02.481605+01', '2026-02-24 15:57:02.728623+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D9064458', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:57:02.478508+01', NULL, '2026-02-24 15:57:02.478508+01', '2026-02-24 15:57:02.729978+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-82DCF574', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-07
Time: 21:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Default limit test', '{"type": "restaurant_booking", "eventId": "EV-C64F3158", "threadId": "TH-32240424", "ticketId": "T-4635B3C3"}', 'sent', 1, '2026-02-24 02:30:51.18693+01', NULL, '2026-02-24 02:30:51.18693+01', '2026-02-24 02:30:51.93324+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-3472C290', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 227', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-07
Time: 21:00
Guests: 3
Room: 227
Guest: Guest
Special requests: Default limit test', '{"type": "restaurant_booking", "eventId": "EV-C64F3158", "threadId": "TH-32240424", "ticketId": "T-4635B3C3"}', 'sent', 1, '2026-02-24 02:30:51.181715+01', NULL, '2026-02-24 02:30:51.181715+01', '2026-02-24 02:30:51.962881+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7079BF9D', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:39.893761+01', NULL, '2026-02-24 15:01:39.893761+01', '2026-02-24 15:01:40.388333+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-1ADB4C0D', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:01:39.891777+01', NULL, '2026-02-24 15:01:39.891777+01', '2026-02-24 15:01:40.38939+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-DE4310DC', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New service request • concierge • Room 502', 'New service request: Organiser un transport

Room: 502
Department: concierge
Ticket: T-63B5B930', '{"type": "service_request", "ticketId": "T-63B5B930"}', 'pending', 7, '2026-02-28 13:46:25.153521+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:35:37.784026+01', '2026-02-28 13:41:03.153521+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A219DE12', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:31.292956+01', NULL, '2026-02-24 15:56:31.292956+01', '2026-02-24 15:56:32.377593+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-38E15470', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:31.282165+01', NULL, '2026-02-24 15:56:31.282165+01', '2026-02-24 15:56:32.38061+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-8054798B', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:32.878316+01', NULL, '2026-02-24 15:56:32.878316+01', '2026-02-24 15:56:33.890653+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-F15E663E', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:32.866375+01', NULL, '2026-02-24 15:56:32.866375+01', '2026-02-24 15:56:33.892318+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-DB975C32', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:40.973885+01', NULL, '2026-02-24 15:56:40.973885+01', '2026-02-24 15:56:41.421782+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2B9C4EAD', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:43.783912+01', NULL, '2026-02-24 15:56:43.783912+01', '2026-02-24 15:56:44.529354+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-0586C6B2', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:43.777345+01', NULL, '2026-02-24 15:56:43.777345+01', '2026-02-24 15:56:44.5311+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-88498C7F', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:48.366374+01', NULL, '2026-02-24 15:56:48.366374+01', '2026-02-24 15:56:49.040986+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-EEAF15B1', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:48.369082+01', NULL, '2026-02-24 15:56:48.369082+01', '2026-02-24 15:56:49.04238+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-66E14E0C', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:49.162583+01', NULL, '2026-02-24 15:56:49.162583+01', '2026-02-24 15:56:49.326251+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-58AA216D', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:49.166426+01', NULL, '2026-02-24 15:56:49.166426+01', '2026-02-24 15:56:49.327809+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-91BD3A66', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Reserver un restaurant', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'failed', 8, '2026-02-28 13:26:08.333586+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:15:21.570261+01', '2026-02-28 13:26:08.91282+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-60DF7356', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Reserver un restaurant', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'failed', 8, '2026-02-28 13:26:08.818497+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:15:21.592369+01', '2026-02-28 13:26:08.963186+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2D566B65', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.077474+01', NULL, '2026-02-24 15:56:50.077474+01', '2026-02-24 15:56:50.615765+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-53A99733', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.074696+01', NULL, '2026-02-24 15:56:50.074696+01', '2026-02-24 15:56:50.627795+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-DE901660', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:49.966337+01', NULL, '2026-02-24 15:56:49.966337+01', '2026-02-24 15:56:50.639036+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-519D4889', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.269165+01', NULL, '2026-02-24 15:56:50.269165+01', '2026-02-24 15:56:50.563446+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-CFFDDFEB', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.394395+01', NULL, '2026-02-24 15:56:50.394395+01', '2026-02-24 15:56:50.611299+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-1EBC41F7', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.413763+01', NULL, '2026-02-24 15:56:50.413763+01', '2026-02-24 15:56:50.620288+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-8C60A8C4', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.263085+01', NULL, '2026-02-24 15:56:50.263085+01', '2026-02-24 15:56:50.635079+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A75F5D2B', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.724698+01', NULL, '2026-02-24 15:56:50.724698+01', '2026-02-24 15:56:50.834678+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-D2826203', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.720705+01', NULL, '2026-02-24 15:56:50.720705+01', '2026-02-24 15:56:50.835544+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B196DF50', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:54.067082+01', NULL, '2026-02-24 15:56:54.067082+01', '2026-02-24 15:56:55.183529+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B91ECECB', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:54.065913+01', NULL, '2026-02-24 15:56:54.065913+01', '2026-02-24 15:56:55.185939+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-6F39C04B', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 14:00
Guests: 1
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-11E19230", "threadId": "TH-478C3CF9", "ticketId": "T-06486B93"}', 'pending', 7, '2026-02-28 13:44:09.648825+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:33:21.682916+01', '2026-02-28 13:38:47.648825+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-146B247E', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:56.268539+01', NULL, '2026-02-24 15:56:56.268539+01', '2026-02-24 15:56:56.691655+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-7B13663F', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:56.270532+01', NULL, '2026-02-24 15:56:56.270532+01', '2026-02-24 15:56:56.712335+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-8409EE3D', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 14:00
Guests: 1
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-11E19230", "threadId": "TH-478C3CF9", "ticketId": "T-06486B93"}', 'pending', 7, '2026-02-28 13:44:11.682779+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:33:21.684105+01', '2026-02-28 13:38:50.682779+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-077D6885', 'H-FOURSEASONS', 'email', 'mock', 'roomservice@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-28
Time: 14:00
Guests: 1
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-0F5F5E80", "threadId": "TH-478C3CF9", "ticketId": "T-EFCC9C6D"}', 'failed', 8, '2026-02-28 13:42:46.243733+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:32:06.610557+01', '2026-02-28 13:42:47.351628+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2B1FDCF2', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-28
Time: 14:00
Guests: 1
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-0F5F5E80", "threadId": "TH-478C3CF9", "ticketId": "T-EFCC9C6D"}', 'failed', 8, '2026-02-28 13:42:53.784749+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:32:06.589088+01', '2026-02-28 13:42:54.890797+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-735E7DB2', 'H-FOURSEASONS', 'email', 'mock', 'restaurant@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-02-28
Time: 14:00
Guests: 1
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-0F5F5E80", "threadId": "TH-478C3CF9", "ticketId": "T-EFCC9C6D"}', 'failed', 8, '2026-02-28 13:42:53.794324+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:32:06.609123+01', '2026-02-28 13:42:54.89951+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-2E2D9E80', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.531011+01', NULL, '2026-02-24 15:56:50.531011+01', '2026-02-24 15:56:50.663291+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5D7E1C38', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:50.532195+01', NULL, '2026-02-24 15:56:50.532195+01', '2026-02-24 15:56:50.66669+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-3E3A51B6', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

hi', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'pending', 7, '2026-02-28 13:43:24.893185+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:32:38.978182+01', '2026-02-28 13:38:03.893185+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-A6290144', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:52.715561+01', NULL, '2026-02-24 15:56:52.715561+01', '2026-02-24 15:56:53.675556+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-52755824', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:52.716558+01', NULL, '2026-02-24 15:56:52.716558+01', '2026-02-24 15:56:53.676676+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-8BD03B89', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

hi', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'pending', 7, '2026-02-28 13:43:30.928506+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:32:38.980433+01', '2026-02-28 13:38:09.928506+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B47415F5', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'Restaurant booking • SEA FU • Room 502', 'New restaurant booking request.

Restaurant: SEA FU
Date: 2026-03-01
Time: 14:00
Guests: 1
Room: 502
Guest: Yuki Tanaka
', '{"type": "restaurant_booking", "eventId": "EV-11E19230", "threadId": "TH-478C3CF9", "ticketId": "T-06486B93"}', 'pending', 7, '2026-02-28 13:44:06.630559+01', 'column "sent_at" of relation "notification_outbox" does not exist', '2026-02-28 13:33:21.681141+01', '2026-02-28 13:38:44.630559+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-5E1B8737', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:54.968447+01', NULL, '2026-02-24 15:56:54.968447+01', '2026-02-24 15:56:55.182147+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-FC65978A', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transfert aeroport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:56:54.972966+01', NULL, '2026-02-24 15:56:54.972966+01', '2026-02-24 15:56:55.184742+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-B686CA49', 'H-FOURSEASONS', 'email', 'mock', 'concierge@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:57:01.666822+01', NULL, '2026-02-24 15:57:01.666822+01', '2026-02-24 15:57:02.731045+01');
INSERT INTO notification_outbox (id, hotel_id, channel, provider, to_address, subject, body_text, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES ('N-74590235', 'H-FOURSEASONS', 'email', 'mock', 'manager@fourseasons.demo', 'New guest message • concierge', 'New guest message received.

Thread: Concierge (TH-03554585)

Organiser un transport', '{"type": "message_created", "threadId": "TH-03554585", "department": "concierge"}', 'sent', 1, '2026-02-24 15:57:01.665021+01', NULL, '2026-02-24 15:57:01.665021+01', '2026-02-24 15:57:02.73224+01');

INSERT INTO service_bookings (id, hotel_id, stay_id, upsell_service_id, guest_name, booking_date, time_slot, price_cents, currency, status, notes, created_at, updated_at) VALUES ('SB-5F4AC42F', 'H-FOURSEASONS', NULL, 'UP-CLEANING-01', 'Test Guest', '2026-02-24', '10:00 - 11:00', 5000, 'EUR', 'confirmed', NULL, '2026-02-23 00:53:25.185173+01', '2026-02-23 00:53:25.185173+01');
INSERT INTO service_bookings (id, hotel_id, stay_id, upsell_service_id, guest_name, booking_date, time_slot, price_cents, currency, status, notes, created_at, updated_at) VALUES ('SB-F895E37E', 'H-FOURSEASONS', 'S-0003', 'UP-CLEANING-01', 'Yuki Tanaka', '2026-02-23', '10:00 - 11:00', 5000, 'EUR', 'confirmed', NULL, '2026-02-23 00:58:13.633103+01', '2026-02-23 00:58:13.633103+01');
INSERT INTO service_bookings (id, hotel_id, stay_id, upsell_service_id, guest_name, booking_date, time_slot, price_cents, currency, status, notes, created_at, updated_at) VALUES ('SB-0F4BAA0F', 'H-FOURSEASONS', 'S-DEMO', 'UP-CLEANING-01', 'Guest', '2026-02-25', '15:00 - 16:00', 5000, 'EUR', 'confirmed', NULL, '2026-02-23 01:04:13.783188+01', '2026-02-23 01:04:13.783188+01');
INSERT INTO service_bookings (id, hotel_id, stay_id, upsell_service_id, guest_name, booking_date, time_slot, price_cents, currency, status, notes, created_at, updated_at) VALUES ('SB-C0E33CA2', 'H-FOURSEASONS', 'S-0003', 'UP-CLEANING-01', 'Yuki Tanaka', '2026-02-23', '12:00 - 13:00', 5000, 'EUR', 'confirmed', NULL, '2026-02-23 01:12:43.39844+01', '2026-02-23 01:12:43.39844+01');
INSERT INTO service_bookings (id, hotel_id, stay_id, upsell_service_id, guest_name, booking_date, time_slot, price_cents, currency, status, notes, created_at, updated_at) VALUES ('SB-615B4E16', 'H-FOURSEASONS', 'S-DEMO', 'UP-CLEANING-01', 'Guest', '2026-02-25', '10:00 - 11:00', 5000, 'EUR', 'confirmed', NULL, '2026-02-24 02:19:10.5544+01', '2026-02-24 02:19:10.5544+01');
INSERT INTO service_bookings (id, hotel_id, stay_id, upsell_service_id, guest_name, booking_date, time_slot, price_cents, currency, status, notes, created_at, updated_at) VALUES ('SB-D0A7C7F7', 'H-FOURSEASONS', 'S-DEMO', 'UP-CLEANING-01', 'Guest', '2026-02-24', '10:00 - 11:00', 5000, 'EUR', 'confirmed', NULL, '2026-02-24 02:23:19.586589+01', '2026-02-24 02:23:19.586589+01');
INSERT INTO service_bookings (id, hotel_id, stay_id, upsell_service_id, guest_name, booking_date, time_slot, price_cents, currency, status, notes, created_at, updated_at) VALUES ('SB-B743DF42', 'H-FOURSEASONS', 'S-DEMO', 'UP-CLEANING-01', 'Guest', '2026-02-24', '10:00 - 11:00', 5000, 'EUR', 'confirmed', NULL, '2026-02-24 02:23:26.880929+01', '2026-02-24 02:23:26.880929+01');

-- Include the latest curated experience tile visible in live admin.
INSERT INTO experience_items (id, section_id, hotel_id, label, image_url, link_url, type, sort_order, is_active)
VALUES ('EI-1005','ES-1001','H-FOURSEASONS','VOS UPSELLS','/images/experiences/vos-upsells.jpg','/services','default',5,TRUE)
ON CONFLICT (id) DO UPDATE SET
  section_id = EXCLUDED.section_id,
  hotel_id = EXCLUDED.hotel_id,
  label = EXCLUDED.label,
  image_url = EXCLUDED.image_url,
  link_url = EXCLUDED.link_url,
  type = EXCLUDED.type,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Remove transient E2E useful-info categories from seed baseline.
DELETE FROM useful_info_items WHERE category_id IN (SELECT id FROM useful_info_categories WHERE id LIKE 'uic-%');
DELETE FROM useful_info_categories WHERE id LIKE 'uic-%';

-- Keep outbox history but drop failed retry artifacts captured from stale migration states.
DELETE FROM notification_outbox WHERE status <> 'sent' OR last_error IS NOT NULL;
