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
  created_at,
  updated_at
)
VALUES
  -- Four Seasons Paris room images
  (
    'RI-1001',
    'H-FOURSEASONS',
    'room',
    'Bedroom',
    'Luxurious bedroom with king-size bed',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&fit=crop',
    1,
    TRUE,
    'SU-0001',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'RI-1002',
    'H-FOURSEASONS',
    'room',
    'Living Area',
    'Spacious living area with city views',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&fit=crop',
    2,
    TRUE,
    'SU-0001',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'RI-1003',
    'H-FOURSEASONS',
    'room',
    'Bathroom',
    'Marble bathroom with soaking tub',
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&fit=crop',
    3,
    TRUE,
    'SU-0001',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'RI-1004',
    'H-FOURSEASONS',
    'room',
    'Terrace',
    'Private terrace overlooking Paris',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&fit=crop',
    4,
    TRUE,
    'SU-0001',
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
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&fit=crop',
    1,
    TRUE,
    'SU-0010',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  ),
  (
    'RI-2002',
    'H-FSGENEVA',
    'room',
    'Alpine Suite',
    'Suite with mountain views',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&fit=crop',
    2,
    TRUE,
    'SU-0010',
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
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&fit=crop',
    1,
    TRUE,
    'SU-0020',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  ),
  (
    'RI-3002',
    'H-BULGARI',
    'room',
    'Design Suite',
    'Contemporary Italian design suite',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&fit=crop',
    2,
    TRUE,
    'SU-0020',
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
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&fit=crop',
    1,
    TRUE,
    'SU-0030',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    'RI-4002',
    'H-MAMOUNIA',
    'room',
    'Garden View',
    'Room with garden and pool views',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&fit=crop',
    2,
    TRUE,
    'SU-0030',
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
  sort_order,
  is_active,
  created_at,
  updated_at
) VALUES
  -- Four Seasons Paris - Tailored (Plaisirs sur mesure)
  ('EI-1001', 'ES-1001', 'H-FOURSEASONS', 'FLEURS', '/images/experiences/fleurs.jpg', '/services', 1, TRUE, NOW(), NOW()),
  ('EI-1002', 'ES-1001', 'H-FOURSEASONS', 'CHAMPAGNE', '/images/experiences/champagne.jpg', '/services', 2, TRUE, NOW(), NOW()),
  ('EI-1003', 'ES-1001', 'H-FOURSEASONS', 'LETTRE', '/images/experiences/lettre.jpg', '/services', 3, TRUE, NOW(), NOW()),
  ('EI-1004', 'ES-1001', 'H-FOURSEASONS', 'MAGAZINE', '/images/experiences/magazine.jpg', '/services', 4, TRUE, NOW(), NOW()),
  ('EI-1005', 'ES-1001', 'H-FOURSEASONS', 'VOS UPSELLS', '/images/experiences/vos-upsells.jpg', '/services', 5, TRUE, NOW(), NOW()),
  
  -- Four Seasons Paris - Culinary (Expériences culinaires)
  ('EI-1101', 'ES-1002', 'H-FOURSEASONS', 'SEA FU', '/images/experiences/sea-fu.jpg', '/restaurants', 1, TRUE, NOW(), NOW()),
  ('EI-1102', 'ES-1002', 'H-FOURSEASONS', 'COYA', '/images/experiences/coya.jpg', '/restaurants', 2, TRUE, NOW(), NOW()),
  ('EI-1103', 'ES-1002', 'H-FOURSEASONS', 'MIMI KAKUSHI', '/images/experiences/mimi-kakushi.jpg', '/restaurants', 3, TRUE, NOW(), NOW()),
  ('EI-1104', 'ES-1002', 'H-FOURSEASONS', 'SCALINI', '/images/experiences/scalini.jpg', '/restaurants', 4, TRUE, NOW(), NOW()),
  ('EI-1105', 'ES-1002', 'H-FOURSEASONS', 'VERDE', '/images/experiences/verde.jpg', '/restaurants', 5, TRUE, NOW(), NOW()),
  ('EI-1106', 'ES-1002', 'H-FOURSEASONS', 'PASTRIES', '/images/experiences/pastries.jpg', '/restaurants', 6, TRUE, NOW(), NOW()),
  ('EI-1107', 'ES-1002', 'H-FOURSEASONS', 'NUSR-ET', '/images/experiences/nusr-et.jpg', '/restaurants', 7, TRUE, NOW(), NOW()),
  ('EI-1108', 'ES-1002', 'H-FOURSEASONS', 'NAMMOS', '/images/experiences/nammos.jpg', '/restaurants', 8, TRUE, NOW(), NOW()),
  
  -- Four Seasons Paris - Activities (Moments à vivre)
  ('EI-1201', 'ES-1003', 'H-FOURSEASONS', 'SAFARI', '/images/experiences/safari.jpg', '/services', 1, TRUE, NOW(), NOW()),
  ('EI-1202', 'ES-1003', 'H-FOURSEASONS', 'BURJ AL ARAB TOUR', '/images/experiences/burj-al-arab-tour.jpg', '/services', 2, TRUE, NOW(), NOW()),
  ('EI-1203', 'ES-1003', 'H-FOURSEASONS', 'PADEL', '/images/experiences/padel.jpg', '/services', 3, TRUE, NOW(), NOW()),
  ('EI-1204', 'ES-1003', 'H-FOURSEASONS', 'JET SKI', '/images/experiences/jet-ski.jpg', '/services', 4, TRUE, NOW(), NOW()),
  ('EI-1205', 'ES-1003', 'H-FOURSEASONS', 'SURF', '/images/experiences/surf.jpg', '/services', 5, TRUE, NOW(), NOW()),
  ('EI-1206', 'ES-1003', 'H-FOURSEASONS', 'HELICOPTER TOUR', '/images/experiences/helicopter-tour.jpg', '/services', 6, TRUE, NOW(), NOW()),
  ('EI-1207', 'ES-1003', 'H-FOURSEASONS', 'SUNRISE BALLOON', '/images/experiences/sunrise-balloon.jpg', '/services', 7, TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  image_url = EXCLUDED.image_url,
  link_url = EXCLUDED.link_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- DONE
-- =============================================================================
-- Seed data has been loaded successfully!
-- See demo.md in the project root for login credentials and testing instructions.
