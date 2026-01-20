-- =============================================================================
-- Service Catalog Seed Data
-- =============================================================================
-- Standardized service modules for each department
-- Run with: psql -f backend/db/seed-services.sql

-- =============================================================================
-- HOUSEKEEPING SERVICES
-- =============================================================================

-- Category: Amenities Request
INSERT INTO service_categories (id, hotel_id, department, name_key, name_default, description_key, description_default, icon, sort_order)
VALUES 
  ('SC-HK-AMENITIES', 'H-FOURSEASONS', 'housekeeping', 'service.housekeeping.amenities', 'Amenities Request', 'service.housekeeping.amenities.desc', 'Request additional room amenities', 'sparkles', 1),
  ('SC-HK-CLEANING', 'H-FOURSEASONS', 'housekeeping', 'service.housekeeping.cleaning', 'Cleaning Services', 'service.housekeeping.cleaning.desc', 'Room cleaning and turndown services', 'broom', 2),
  ('SC-HK-LAUNDRY', 'H-FOURSEASONS', 'housekeeping', 'service.housekeeping.laundry', 'Laundry & Pressing', 'service.housekeeping.laundry.desc', 'Laundry, dry cleaning and pressing services', 'shirt', 3)
ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- Housekeeping Service Items
INSERT INTO service_items (id, category_id, hotel_id, department, name_key, name_default, description_key, description_default, icon, form_fields, estimated_time_minutes, sort_order)
VALUES
  -- Amenities
  ('SI-HK-TOWELS', 'SC-HK-AMENITIES', 'H-FOURSEASONS', 'housekeeping', 
   'service.housekeeping.towels', 'Extra Towels', 
   'service.housekeeping.towels.desc', 'Request additional bath towels',
   'towel',
   '[{"type":"quantity","name":"quantity","label":"Number of towels","min":1,"max":10,"default":2}]'::jsonb,
   15, 1),
  
  ('SI-HK-PILLOWS', 'SC-HK-AMENITIES', 'H-FOURSEASONS', 'housekeeping',
   'service.housekeeping.pillows', 'Extra Pillows',
   'service.housekeeping.pillows.desc', 'Request additional pillows',
   'pillow',
   '[{"type":"quantity","name":"quantity","label":"Number of pillows","min":1,"max":4,"default":1},{"type":"select","name":"type","label":"Pillow type","options":[{"value":"soft","label":"Soft"},{"value":"medium","label":"Medium"},{"value":"firm","label":"Firm"}]}]'::jsonb,
   15, 2),
  
  ('SI-HK-BLANKET', 'SC-HK-AMENITIES', 'H-FOURSEASONS', 'housekeeping',
   'service.housekeeping.blanket', 'Extra Blanket',
   'service.housekeeping.blanket.desc', 'Request an additional blanket',
   'blanket',
   '[{"type":"quantity","name":"quantity","label":"Number of blankets","min":1,"max":2,"default":1}]'::jsonb,
   15, 3),
  
  ('SI-HK-TOILETRIES', 'SC-HK-AMENITIES', 'H-FOURSEASONS', 'housekeeping',
   'service.housekeeping.toiletries', 'Toiletries',
   'service.housekeeping.toiletries.desc', 'Request bathroom amenities',
   'soap',
   '[{"type":"multiselect","name":"items","label":"Select items","options":[{"value":"shampoo","label":"Shampoo"},{"value":"conditioner","label":"Conditioner"},{"value":"soap","label":"Soap"},{"value":"lotion","label":"Body lotion"},{"value":"toothbrush","label":"Toothbrush kit"},{"value":"razor","label":"Razor kit"}]}]'::jsonb,
   20, 4),

  -- Cleaning
  ('SI-HK-CLEANING-NOW', 'SC-HK-CLEANING', 'H-FOURSEASONS', 'housekeeping',
   'service.housekeeping.cleaning.now', 'Clean Room Now',
   'service.housekeeping.cleaning.now.desc', 'Request immediate room cleaning',
   'sparkles',
   '[]'::jsonb,
   45, 1),
  
  ('SI-HK-CLEANING-SCHEDULED', 'SC-HK-CLEANING', 'H-FOURSEASONS', 'housekeeping',
   'service.housekeeping.cleaning.scheduled', 'Schedule Cleaning',
   'service.housekeeping.cleaning.scheduled.desc', 'Schedule room cleaning for a specific time',
   'clock',
   '[{"type":"time","name":"preferredTime","label":"Preferred time"},{"type":"textarea","name":"notes","label":"Special instructions","placeholder":"Any specific requests...","required":false}]'::jsonb,
   45, 2),
  
  ('SI-HK-TURNDOWN', 'SC-HK-CLEANING', 'H-FOURSEASONS', 'housekeeping',
   'service.housekeeping.turndown', 'Turndown Service',
   'service.housekeeping.turndown.desc', 'Evening turndown service',
   'moon',
   '[{"type":"time","name":"preferredTime","label":"Preferred time","default":"18:00"}]'::jsonb,
   30, 3),
  
  ('SI-HK-DND', 'SC-HK-CLEANING', 'H-FOURSEASONS', 'housekeeping',
   'service.housekeeping.dnd', 'Do Not Disturb',
   'service.housekeeping.dnd.desc', 'Pause housekeeping service',
   'bell-slash',
   '[{"type":"select","name":"duration","label":"Duration","options":[{"value":"today","label":"Until tomorrow"},{"value":"checkout","label":"Until checkout"}]}]'::jsonb,
   5, 4),

  -- Laundry
  ('SI-HK-LAUNDRY-EXPRESS', 'SC-HK-LAUNDRY', 'H-FOURSEASONS', 'housekeeping',
   'service.housekeeping.laundry.express', 'Express Laundry',
   'service.housekeeping.laundry.express.desc', '4-hour express laundry service',
   'zap',
   '[{"type":"text","name":"itemDescription","label":"Describe items","placeholder":"e.g., 2 shirts, 1 pants"}]'::jsonb,
   240, 1),
  
  ('SI-HK-PRESSING', 'SC-HK-LAUNDRY', 'H-FOURSEASONS', 'housekeeping',
   'service.housekeeping.pressing', 'Pressing Service',
   'service.housekeeping.pressing.desc', 'Iron and press your garments',
   'shirt',
   '[{"type":"quantity","name":"quantity","label":"Number of items","min":1,"max":10,"default":1},{"type":"time","name":"neededBy","label":"Needed by"}]'::jsonb,
   60, 2)

ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  form_fields = EXCLUDED.form_fields,
  estimated_time_minutes = EXCLUDED.estimated_time_minutes,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- ROOM SERVICE
-- =============================================================================

INSERT INTO service_categories (id, hotel_id, department, name_key, name_default, description_key, description_default, icon, sort_order)
VALUES 
  ('SC-RS-BREAKFAST', 'H-FOURSEASONS', 'room-service', 'service.roomservice.breakfast', 'Breakfast', 'service.roomservice.breakfast.desc', 'In-room breakfast service', 'sun', 1),
  ('SC-RS-DINING', 'H-FOURSEASONS', 'room-service', 'service.roomservice.dining', 'In-Room Dining', 'service.roomservice.dining.desc', 'Order from our dining menu', 'utensils', 2),
  ('SC-RS-BEVERAGES', 'H-FOURSEASONS', 'room-service', 'service.roomservice.beverages', 'Beverages', 'service.roomservice.beverages.desc', 'Drinks and refreshments', 'glass', 3),
  ('SC-RS-MINIBAR', 'H-FOURSEASONS', 'room-service', 'service.roomservice.minibar', 'Mini Bar', 'service.roomservice.minibar.desc', 'Minibar replenishment', 'wine', 4)
ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO service_items (id, category_id, hotel_id, department, name_key, name_default, description_key, description_default, icon, form_fields, estimated_time_minutes, price_cents, sort_order)
VALUES
  -- Breakfast
  ('SI-RS-CONTINENTAL', 'SC-RS-BREAKFAST', 'H-FOURSEASONS', 'room-service',
   'service.roomservice.continental', 'Continental Breakfast',
   'service.roomservice.continental.desc', 'Pastries, fresh fruits, juice, coffee or tea',
   'croissant',
   '[{"type":"time","name":"deliveryTime","label":"Delivery time","required":true},{"type":"quantity","name":"guests","label":"Number of guests","min":1,"max":4,"default":1}]'::jsonb,
   30, 4500, 1),
  
  ('SI-RS-AMERICAN', 'SC-RS-BREAKFAST', 'H-FOURSEASONS', 'room-service',
   'service.roomservice.american', 'American Breakfast',
   'service.roomservice.american.desc', 'Eggs, bacon, toast, juice, coffee',
   'egg',
   '[{"type":"time","name":"deliveryTime","label":"Delivery time","required":true},{"type":"select","name":"eggStyle","label":"Egg preparation","options":[{"value":"scrambled","label":"Scrambled"},{"value":"fried","label":"Fried"},{"value":"poached","label":"Poached"},{"value":"omelette","label":"Omelette"}]}]'::jsonb,
   30, 5500, 2),
  
  -- Beverages
  ('SI-RS-COFFEE', 'SC-RS-BEVERAGES', 'H-FOURSEASONS', 'room-service',
   'service.roomservice.coffee', 'Coffee Service',
   'service.roomservice.coffee.desc', 'Fresh brewed coffee',
   'coffee',
   '[{"type":"select","name":"type","label":"Coffee type","options":[{"value":"espresso","label":"Espresso"},{"value":"americano","label":"Americano"},{"value":"cappuccino","label":"Cappuccino"},{"value":"latte","label":"Latte"}]},{"type":"quantity","name":"cups","label":"Number of cups","min":1,"max":4,"default":1}]'::jsonb,
   15, 800, 1),
  
  ('SI-RS-TEA', 'SC-RS-BEVERAGES', 'H-FOURSEASONS', 'room-service',
   'service.roomservice.tea', 'Tea Service',
   'service.roomservice.tea.desc', 'Selection of fine teas',
   'leaf',
   '[{"type":"select","name":"type","label":"Tea selection","options":[{"value":"english","label":"English Breakfast"},{"value":"earl-grey","label":"Earl Grey"},{"value":"green","label":"Green Tea"},{"value":"chamomile","label":"Chamomile"}]},{"type":"quantity","name":"cups","label":"Number of cups","min":1,"max":4,"default":1}]'::jsonb,
   15, 900, 2),
  
  ('SI-RS-CHAMPAGNE', 'SC-RS-BEVERAGES', 'H-FOURSEASONS', 'room-service',
   'service.roomservice.champagne', 'Champagne',
   'service.roomservice.champagne.desc', 'Bottle of champagne delivered to your room',
   'sparkles',
   '[{"type":"select","name":"selection","label":"Selection","options":[{"value":"house","label":"House Champagne"},{"value":"moet","label":"Moët & Chandon"},{"value":"veuve","label":"Veuve Clicquot"},{"value":"dom","label":"Dom Pérignon"}]}]'::jsonb,
   15, 12000, 3),

  -- Minibar
  ('SI-RS-MINIBAR-REFILL', 'SC-RS-MINIBAR', 'H-FOURSEASONS', 'room-service',
   'service.roomservice.minibar.refill', 'Refill Minibar',
   'service.roomservice.minibar.refill.desc', 'Restock your minibar',
   'refresh',
   '[{"type":"multiselect","name":"items","label":"Items to restock","options":[{"value":"water","label":"Still water"},{"value":"sparkling","label":"Sparkling water"},{"value":"softdrinks","label":"Soft drinks"},{"value":"snacks","label":"Snacks"},{"value":"all","label":"Full restock"}]}]'::jsonb,
   20, 0, 1)

ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  form_fields = EXCLUDED.form_fields,
  estimated_time_minutes = EXCLUDED.estimated_time_minutes,
  price_cents = EXCLUDED.price_cents,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- CONCIERGE SERVICES
-- =============================================================================

INSERT INTO service_categories (id, hotel_id, department, name_key, name_default, description_key, description_default, icon, sort_order)
VALUES 
  ('SC-CON-TRANSPORT', 'H-FOURSEASONS', 'concierge', 'service.concierge.transport', 'Transportation', 'service.concierge.transport.desc', 'Taxi, limousine and transfer services', 'car', 1),
  ('SC-CON-RESERVATIONS', 'H-FOURSEASONS', 'concierge', 'service.concierge.reservations', 'Reservations', 'service.concierge.reservations.desc', 'Restaurant and show reservations', 'calendar', 2),
  ('SC-CON-SPECIAL', 'H-FOURSEASONS', 'concierge', 'service.concierge.special', 'Special Requests', 'service.concierge.special.desc', 'Flowers, gifts, and special arrangements', 'gift', 3)
ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO service_items (id, category_id, hotel_id, department, name_key, name_default, description_key, description_default, icon, form_fields, estimated_time_minutes, sort_order)
VALUES
  -- Transport
  ('SI-CON-TAXI', 'SC-CON-TRANSPORT', 'H-FOURSEASONS', 'concierge',
   'service.concierge.taxi', 'Request Taxi',
   'service.concierge.taxi.desc', 'Have a taxi waiting at the entrance',
   'car',
   '[{"type":"time","name":"pickupTime","label":"Pickup time","required":true},{"type":"text","name":"destination","label":"Destination","placeholder":"Address or location name"}]'::jsonb,
   15, 1),
  
  ('SI-CON-LIMO', 'SC-CON-TRANSPORT', 'H-FOURSEASONS', 'concierge',
   'service.concierge.limousine', 'Limousine Service',
   'service.concierge.limousine.desc', 'Private limousine with chauffeur',
   'star',
   '[{"type":"datetime","name":"pickupTime","label":"Pickup date & time","required":true},{"type":"text","name":"destination","label":"Destination"},{"type":"select","name":"duration","label":"Duration","options":[{"value":"transfer","label":"One-way transfer"},{"value":"3h","label":"3 hours"},{"value":"half-day","label":"Half day"},{"value":"full-day","label":"Full day"}]}]'::jsonb,
   30, 2),
  
  ('SI-CON-AIRPORT', 'SC-CON-TRANSPORT', 'H-FOURSEASONS', 'concierge',
   'service.concierge.airport', 'Airport Transfer',
   'service.concierge.airport.desc', 'Transfer to/from airport',
   'plane',
   '[{"type":"select","name":"direction","label":"Direction","options":[{"value":"to","label":"To airport"},{"value":"from","label":"From airport"}]},{"type":"datetime","name":"flightTime","label":"Flight date & time","required":true},{"type":"text","name":"flightNumber","label":"Flight number"},{"type":"select","name":"terminal","label":"Terminal"}]'::jsonb,
   60, 3),

  -- Reservations
  ('SI-CON-RESTAURANT', 'SC-CON-RESERVATIONS', 'H-FOURSEASONS', 'concierge',
   'service.concierge.restaurant', 'Restaurant Reservation',
   'service.concierge.restaurant.desc', 'Book a table at top restaurants',
   'utensils',
   '[{"type":"text","name":"restaurant","label":"Restaurant name or cuisine preference"},{"type":"date","name":"date","label":"Date","required":true},{"type":"time","name":"time","label":"Preferred time","required":true},{"type":"quantity","name":"guests","label":"Number of guests","min":1,"max":12,"default":2},{"type":"textarea","name":"preferences","label":"Special requests","placeholder":"Dietary restrictions, occasion, etc."}]'::jsonb,
   60, 1),
  
  ('SI-CON-SHOW', 'SC-CON-RESERVATIONS', 'H-FOURSEASONS', 'concierge',
   'service.concierge.show', 'Show & Event Tickets',
   'service.concierge.show.desc', 'Tickets for shows, concerts, and events',
   'ticket',
   '[{"type":"text","name":"event","label":"Show or event"},{"type":"date","name":"date","label":"Date","required":true},{"type":"quantity","name":"tickets","label":"Number of tickets","min":1,"max":10,"default":2},{"type":"select","name":"category","label":"Seating preference","options":[{"value":"best","label":"Best available"},{"value":"premium","label":"Premium/VIP"},{"value":"standard","label":"Standard"}]}]'::jsonb,
   120, 2),

  -- Special
  ('SI-CON-FLOWERS', 'SC-CON-SPECIAL', 'H-FOURSEASONS', 'concierge',
   'service.concierge.flowers', 'Flower Arrangement',
   'service.concierge.flowers.desc', 'Beautiful flower arrangements delivered',
   'flower',
   '[{"type":"select","name":"type","label":"Arrangement type","options":[{"value":"roses","label":"Red Roses"},{"value":"mixed","label":"Mixed Bouquet"},{"value":"orchids","label":"Orchids"},{"value":"custom","label":"Custom arrangement"}]},{"type":"select","name":"size","label":"Size","options":[{"value":"small","label":"Small"},{"value":"medium","label":"Medium"},{"value":"large","label":"Large"}]},{"type":"text","name":"message","label":"Card message","placeholder":"Optional message for the card"}]'::jsonb,
   120, 1),
  
  ('SI-CON-WAKEUP', 'SC-CON-SPECIAL', 'H-FOURSEASONS', 'concierge',
   'service.concierge.wakeup', 'Wake-up Call',
   'service.concierge.wakeup.desc', 'Schedule a morning wake-up call',
   'alarm',
   '[{"type":"time","name":"time","label":"Wake-up time","required":true},{"type":"select","name":"method","label":"Notification method","options":[{"value":"phone","label":"Phone call"},{"value":"both","label":"Phone + App notification"}]}]'::jsonb,
   5, 2)

ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  form_fields = EXCLUDED.form_fields,
  estimated_time_minutes = EXCLUDED.estimated_time_minutes,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- SPA & GYM SERVICES
-- =============================================================================

INSERT INTO service_categories (id, hotel_id, department, name_key, name_default, description_key, description_default, icon, sort_order)
VALUES 
  ('SC-SPA-MASSAGE', 'H-FOURSEASONS', 'spa-gym', 'service.spa.massage', 'Massage', 'service.spa.massage.desc', 'Relaxing and therapeutic massages', 'spa', 1),
  ('SC-SPA-FACIAL', 'H-FOURSEASONS', 'spa-gym', 'service.spa.facial', 'Facials', 'service.spa.facial.desc', 'Rejuvenating facial treatments', 'smile', 2),
  ('SC-SPA-FITNESS', 'H-FOURSEASONS', 'spa-gym', 'service.spa.fitness', 'Fitness', 'service.spa.fitness.desc', 'Personal training and fitness services', 'dumbbell', 3)
ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO service_items (id, category_id, hotel_id, department, name_key, name_default, description_key, description_default, icon, form_fields, estimated_time_minutes, price_cents, sort_order, requires_confirmation)
VALUES
  -- Massage
  ('SI-SPA-SWEDISH', 'SC-SPA-MASSAGE', 'H-FOURSEASONS', 'spa-gym',
   'service.spa.swedish', 'Swedish Massage',
   'service.spa.swedish.desc', 'Classic relaxation massage',
   'spa',
   '[{"type":"select","name":"duration","label":"Duration","options":[{"value":"60","label":"60 minutes"},{"value":"90","label":"90 minutes"}],"required":true},{"type":"datetime","name":"appointmentTime","label":"Preferred date & time","required":true}]'::jsonb,
   60, 18000, 1, TRUE),
  
  ('SI-SPA-DEEP', 'SC-SPA-MASSAGE', 'H-FOURSEASONS', 'spa-gym',
   'service.spa.deep', 'Deep Tissue Massage',
   'service.spa.deep.desc', 'Therapeutic deep pressure massage',
   'muscle',
   '[{"type":"select","name":"duration","label":"Duration","options":[{"value":"60","label":"60 minutes"},{"value":"90","label":"90 minutes"}],"required":true},{"type":"datetime","name":"appointmentTime","label":"Preferred date & time","required":true},{"type":"multiselect","name":"focusAreas","label":"Focus areas","options":[{"value":"back","label":"Back"},{"value":"shoulders","label":"Shoulders"},{"value":"legs","label":"Legs"},{"value":"full","label":"Full body"}]}]'::jsonb,
   60, 22000, 2, TRUE),
  
  ('SI-SPA-COUPLES', 'SC-SPA-MASSAGE', 'H-FOURSEASONS', 'spa-gym',
   'service.spa.couples', 'Couples Massage',
   'service.spa.couples.desc', 'Relaxing massage for two',
   'heart',
   '[{"type":"select","name":"duration","label":"Duration","options":[{"value":"60","label":"60 minutes"},{"value":"90","label":"90 minutes"}],"required":true},{"type":"datetime","name":"appointmentTime","label":"Preferred date & time","required":true}]'::jsonb,
   60, 38000, 3, TRUE),

  -- Fitness
  ('SI-SPA-TRAINER', 'SC-SPA-FITNESS', 'H-FOURSEASONS', 'spa-gym',
   'service.spa.trainer', 'Personal Training',
   'service.spa.trainer.desc', 'One-on-one fitness session',
   'dumbbell',
   '[{"type":"datetime","name":"sessionTime","label":"Session date & time","required":true},{"type":"select","name":"focus","label":"Focus area","options":[{"value":"strength","label":"Strength training"},{"value":"cardio","label":"Cardio"},{"value":"flexibility","label":"Flexibility"},{"value":"general","label":"General fitness"}]}]'::jsonb,
   60, 15000, 1, TRUE),
  
  ('SI-SPA-YOGA', 'SC-SPA-FITNESS', 'H-FOURSEASONS', 'spa-gym',
   'service.spa.yoga', 'Private Yoga Session',
   'service.spa.yoga.desc', 'One-on-one yoga instruction',
   'lotus',
   '[{"type":"datetime","name":"sessionTime","label":"Session date & time","required":true},{"type":"select","name":"style","label":"Yoga style","options":[{"value":"hatha","label":"Hatha"},{"value":"vinyasa","label":"Vinyasa"},{"value":"restorative","label":"Restorative"},{"value":"meditation","label":"Meditation"}]}]'::jsonb,
   60, 15000, 2, TRUE)

ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  form_fields = EXCLUDED.form_fields,
  estimated_time_minutes = EXCLUDED.estimated_time_minutes,
  price_cents = EXCLUDED.price_cents,
  sort_order = EXCLUDED.sort_order,
  requires_confirmation = EXCLUDED.requires_confirmation;

-- =============================================================================
-- RECEPTION SERVICES
-- =============================================================================

INSERT INTO service_categories (id, hotel_id, department, name_key, name_default, description_key, description_default, icon, sort_order)
VALUES 
  ('SC-REC-CHECKOUT', 'H-FOURSEASONS', 'reception', 'service.reception.checkout', 'Check-out', 'service.reception.checkout.desc', 'Check-out and departure services', 'door', 1),
  ('SC-REC-ROOM', 'H-FOURSEASONS', 'reception', 'service.reception.room', 'Room Requests', 'service.reception.room.desc', 'Room changes and extensions', 'bed', 2)
ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO service_items (id, category_id, hotel_id, department, name_key, name_default, description_key, description_default, icon, form_fields, estimated_time_minutes, sort_order)
VALUES
  ('SI-REC-LATE-CHECKOUT', 'SC-REC-CHECKOUT', 'H-FOURSEASONS', 'reception',
   'service.reception.latecheckout', 'Late Check-out',
   'service.reception.latecheckout.desc', 'Request extended check-out time',
   'clock',
   '[{"type":"select","name":"requestedTime","label":"Requested check-out time","options":[{"value":"14:00","label":"2:00 PM"},{"value":"16:00","label":"4:00 PM"},{"value":"18:00","label":"6:00 PM"}],"required":true}]'::jsonb,
   15, 1),
  
  ('SI-REC-EXPRESS', 'SC-REC-CHECKOUT', 'H-FOURSEASONS', 'reception',
   'service.reception.expresscheckout', 'Express Check-out',
   'service.reception.expresscheckout.desc', 'Check out without visiting reception',
   'zap',
   '[{"type":"select","name":"billDelivery","label":"Invoice delivery","options":[{"value":"email","label":"Send by email"},{"value":"room","label":"Deliver to room before departure"}]},{"type":"time","name":"departureTime","label":"Departure time"}]'::jsonb,
   5, 2),

  ('SI-REC-EXTEND', 'SC-REC-ROOM', 'H-FOURSEASONS', 'reception',
   'service.reception.extend', 'Extend Stay',
   'service.reception.extend.desc', 'Extend your reservation',
   'calendar-plus',
   '[{"type":"date","name":"newCheckout","label":"New check-out date","required":true}]'::jsonb,
   30, 1)

ON CONFLICT (id) DO UPDATE SET
  name_default = EXCLUDED.name_default,
  description_default = EXCLUDED.description_default,
  icon = EXCLUDED.icon,
  form_fields = EXCLUDED.form_fields,
  estimated_time_minutes = EXCLUDED.estimated_time_minutes,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- PREDEFINED RESPONSES
-- =============================================================================

INSERT INTO predefined_responses (id, hotel_id, department, name, content_key, content_default, variables, sort_order)
VALUES
  -- Housekeeping
  ('PR-HK-CONFIRM', 'H-FOURSEASONS', 'housekeeping', 
   'Confirm request', 'response.housekeeping.confirm',
   'Your request has been received and our team is on the way. Expected arrival: {time}.',
   ARRAY['time'], 1),
  
  ('PR-HK-COMPLETE', 'H-FOURSEASONS', 'housekeeping',
   'Request completed', 'response.housekeeping.complete',
   'Your request has been completed. Please let us know if you need anything else.',
   ARRAY[]::text[], 2),
  
  ('PR-HK-DELAY', 'H-FOURSEASONS', 'housekeeping',
   'Delay notification', 'response.housekeeping.delay',
   'We apologize for the delay. Your request will be fulfilled within {time}.',
   ARRAY['time'], 3),

  -- Room Service
  ('PR-RS-CONFIRM', 'H-FOURSEASONS', 'room-service',
   'Order confirmed', 'response.roomservice.confirm',
   'Your order has been received. Estimated delivery: {time}.',
   ARRAY['time'], 1),
  
  ('PR-RS-DELIVERY', 'H-FOURSEASONS', 'room-service',
   'On the way', 'response.roomservice.delivery',
   'Your order is on its way! Our team member will arrive shortly.',
   ARRAY[]::text[], 2),

  -- Concierge
  ('PR-CON-CONFIRM', 'H-FOURSEASONS', 'concierge',
   'Request received', 'response.concierge.confirm',
   'Thank you for your request. I am looking into this and will update you shortly.',
   ARRAY[]::text[], 1),
  
  ('PR-CON-RESERVATION', 'H-FOURSEASONS', 'concierge',
   'Reservation confirmed', 'response.concierge.reservation',
   'Your reservation has been confirmed for {date} at {time} at {venue}.',
   ARRAY['date', 'time', 'venue'], 2),
  
  ('PR-CON-TAXI', 'H-FOURSEASONS', 'concierge',
   'Taxi confirmed', 'response.concierge.taxi',
   'Your taxi has been arranged for {time}. Please proceed to the main entrance.',
   ARRAY['time'], 3),

  -- Spa
  ('PR-SPA-CONFIRM', 'H-FOURSEASONS', 'spa-gym',
   'Appointment confirmed', 'response.spa.confirm',
   'Your appointment has been confirmed for {date} at {time}. Please arrive 15 minutes early.',
   ARRAY['date', 'time'], 1),
  
  ('PR-SPA-RESCHEDULE', 'H-FOURSEASONS', 'spa-gym',
   'Reschedule offer', 'response.spa.reschedule',
   'Unfortunately, your requested time is not available. Would {alternative} work for you?',
   ARRAY['alternative'], 2),

  -- Reception
  ('PR-REC-CHECKOUT', 'H-FOURSEASONS', 'reception',
   'Late checkout approved', 'response.reception.checkout',
   'Your late check-out request has been approved. Your new check-out time is {time}.',
   ARRAY['time'], 1),
  
  ('PR-REC-PENDING', 'H-FOURSEASONS', 'reception',
   'Request pending', 'response.reception.pending',
   'Your request is being processed. We will confirm shortly.',
   ARRAY[]::text[], 2)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  content_default = EXCLUDED.content_default,
  variables = EXCLUDED.variables,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- DONE
-- =============================================================================
-- Service catalog seed data loaded successfully!
