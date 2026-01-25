# MyStay Demo Guide

Complete guide for running and testing the MyStay hotel guest experience platform.

## 🚀 Quick Start

```bash
# Start everything with one command
./dev.sh

# Or start fresh (reset database)
./dev.sh --reset-db
```

### What Gets Started

| Service | URL | Description |
|---------|-----|-------------|
| **Guest Frontend** | http://localhost:3000 | Guest mobile web app |
| **Admin Dashboard** | http://localhost:3001 | Hotel/Platform management |
| **Backend API** | http://localhost:4000 | REST API server |
| **Opera PMS Mock** | http://localhost:4010 | Mock Property Management System |
| **SpaBooker Mock** | http://localhost:4011 | Mock Spa booking system |

---

## 🔐 Demo Accounts

### Platform Administrator
Full access to manage all hotels in the platform.

| Email | Password | Access |
|-------|----------|--------|
| `admin@mystay.com` | `admin123` | Platform admin dashboard |

**URL:** http://localhost:3001 → Select "Platform Admin" login

### Hotel Staff (Four Seasons Paris)

| Email | Password | Role | Departments |
|-------|----------|------|-------------|
| `manager@fourseasons.demo` | `admin123` | Manager | All |
| `concierge@fourseasons.demo` | `admin123` | Staff | Concierge |
| `reception@fourseasons.demo` | `admin123` | Staff | Reception |
| `housekeeping@fourseasons.demo` | `admin123` | Staff | Housekeeping |
| `spa@fourseasons.demo` | `admin123` | Staff | Spa & Gym |
| `roomservice@fourseasons.demo` | `admin123` | Staff | Room Service |

**URL:** http://localhost:3001 → Select "Hotel Staff" login

### Other Hotels

| Hotel | Manager Email | Password |
|-------|--------------|----------|
| Four Seasons Geneva | `manager@geneva.demo` | `admin123` |
| Bulgari Milano | `manager@bulgari.demo` | `admin123` |
| La Mamounia | `manager@mamounia.demo` | `admin123` |

### Guest Accounts

| Guest | Email | Password | Hotel | Status |
|-------|-------|----------|-------|--------|
| Sophie Martin | `sophie.martin@email.com` | `admin123` | Paris | Checked in (Room 701) |
| James Wilson | `james.wilson@corp.com` | `admin123` | Paris | Arriving tomorrow |
| Yuki Tanaka | `yuki.tanaka@example.jp` | `admin123` | Paris | Arriving today |
| Emma Dubois | `emma.dubois@gmail.com` | `admin123` | Paris | Arriving in 2 days |
| Mohammed Al-Rashid | `m.alrashid@business.ae` | `admin123` | Paris | VIP - Penthouse (PH1) |

**URL:** http://localhost:3000

### Guest Authentication Flow

**Login is required** to access your stay and hotel services. Two options:

1. **Sign Up** → Create account (name, email, phone, ID, payment) → Enter confirmation number → Access your stay
2. **Log In** → Use existing credentials → Reservation auto-links → Access your stay

> 💡 Without a reservation, guests can still browse partner hotels, but stay-specific features (check-in, room service, etc.) require a validated reservation.

### Demo Reservations

After logging in with a guest account, these confirmation numbers link to active stays:

| Confirmation | Room | Hotel | Guest Account |
|--------------|------|-------|---------------|
| `FSGV2025A1B2C` | 701 | Four Seasons Paris | `sophie.martin@email.com` |
| `FSGV2025J7K8L` | PH1 | Four Seasons Paris (VIP) | `m.alrashid@business.ae` |
| `FSGV2025D4E5F` | 412 | Four Seasons Paris | `james.wilson@corp.com` |
| `FSGV2025G7H8I` | 305 | Four Seasons Paris | `yuki.tanaka@example.jp` |

---

## 🏨 Mock PMS Integration

### Opera PMS Mock (Port 4010)

Simulates Oracle Opera PMS - the industry standard for luxury hotels.

#### Test Connection
```bash
# Health check
curl http://localhost:4010/health

# List properties
curl http://localhost:4010/v1/properties
```

#### Reservations
```bash
# List all reservations for Four Seasons Paris
curl http://localhost:4010/v1/hotels/FS-PARIS/reservations

# Search by confirmation number
curl "http://localhost:4010/v1/hotels/FS-PARIS/reservations?confirmationNumber=FSGV2025A1B2C"

# Search by guest email
curl "http://localhost:4010/v1/hotels/FS-PARIS/reservations?guestEmail=sophie.martin@email.com"

# Get specific reservation
curl http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-SOPHIE-PARIS
```

#### Room Management
```bash
# List all rooms
curl http://localhost:4010/v1/hotels/FS-PARIS/rooms

# Filter by status
curl "http://localhost:4010/v1/hotels/FS-PARIS/rooms?status=CLEAN"
curl "http://localhost:4010/v1/hotels/FS-PARIS/rooms?status=OCCUPIED"
curl "http://localhost:4010/v1/hotels/FS-PARIS/rooms?status=DIRTY"

# Get specific room
curl http://localhost:4010/v1/hotels/FS-PARIS/rooms/701
```

#### Arrivals & Departures
```bash
# Today's arrivals
curl http://localhost:4010/v1/hotels/FS-PARIS/arrivals

# Today's departures
curl http://localhost:4010/v1/hotels/FS-PARIS/departures

# Specific date
curl "http://localhost:4010/v1/hotels/FS-PARIS/arrivals?date=2026-01-21"
```

#### Guest Folio (Billing)
```bash
# Get guest folio
curl http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-SOPHIE-PARIS/folios

# Add a charge
curl -X POST http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-SOPHIE-PARIS/charges \
  -H "Content-Type: application/json" \
  -d '{"description": "Room Service - Dinner", "amount": 95, "category": "FB"}'
```

#### Check-in / Check-out
```bash
# Check in guest (assign room)
curl -X POST http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-YUKI-PARIS/checkin \
  -H "Content-Type: application/json" \
  -d '{"roomNumber": "602"}'

# Check out guest
curl -X POST http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-SOPHIE-PARIS/checkout
```

#### Room Service Menu
```bash
curl http://localhost:4010/v1/hotels/FS-PARIS/menu
```

#### OTA Sync (Booking.com, Expedia simulation)
```bash
# Simulate a new booking from Booking.com
curl -X POST http://localhost:4010/v1/sync/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "source": "booking.com",
    "reservation": {
      "propertyId": "FS-PARIS",
      "guest": {
        "firstName": "New",
        "lastName": "Guest",
        "email": "new.guest@email.com"
      },
      "arrival": "2026-01-25",
      "departure": "2026-01-28",
      "roomType": "DELUXE"
    }
  }'
```

### SpaBooker Mock (Port 4011)

Simulates spa booking system integration.

#### Test Connection
```bash
curl http://localhost:4011/health
```

#### Spa Services
```bash
# List all locations
curl http://localhost:4011/v1/locations

# Get spa services for Four Seasons Paris
curl http://localhost:4011/v1/locations/FS-PARIS/services

# Get practitioners
curl http://localhost:4011/v1/locations/FS-PARIS/practitioners
```

#### Availability & Booking
```bash
# Check availability
curl "http://localhost:4011/v1/locations/FS-PARIS/availability?date=2026-01-21&serviceId=SPA-004"

# Book appointment
curl -X POST http://localhost:4011/v1/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "FS-PARIS",
    "serviceId": "SPA-004",
    "guestEmail": "sophie.martin@email.com",
    "guestName": "Sophie Martin",
    "roomNumber": "701",
    "date": "2026-01-21",
    "time": "15:00"
  }'

# List appointments
curl "http://localhost:4011/v1/appointments?guestEmail=sophie.martin@email.com"
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Guest Journey

1. **Open Guest App:** http://localhost:3000
2. **Enter confirmation:** `DEMO123456`
3. **Explore services:**
   - Browse Housekeeping → Request towels
   - Browse Room Service → Order breakfast
   - Browse Spa → Book a massage
   - Browse Concierge → Request restaurant reservation
4. **Check activity:** View "Your Requests" on each service page
5. **View messages:** Check conversation threads

### Scenario 2: Staff Request Processing

1. **Open Admin Dashboard:** http://localhost:3001
2. **Login as staff:** `concierge@fourseasons.demo` / `admin123`
3. **View incoming requests**
4. **Process a ticket:**
   - Assign to yourself
   - Add internal note
   - Reply to guest
   - Mark as completed

### Scenario 3: Hotel Manager Operations

1. **Login as manager:** `manager@fourseasons.demo` / `admin123`
2. **View dashboard:** See today's arrivals/departures
3. **Manage staff:** Add/edit staff members
4. **Configure hotel:** Update branding, settings
5. **View analytics:** Review request statistics

### Scenario 4: Platform Administration

1. **Login as platform admin:** `admin@mystay.com` / `admin123`
2. **View all hotels**
3. **Add new hotel**
4. **Configure PMS integration**
5. **Manage global settings**

### Scenario 5: VIP Guest Experience

1. **Open Guest App:** http://localhost:3000
2. **Enter confirmation:** `FSGV2025J7K8L` (VIP - Presidential Suite)
3. **Notice VIP treatment:**
   - Special welcome message
   - Priority service indicators
   - Premium service options

---

## 📊 Sample Data Overview

### Hotels

| ID | Name | City | PMS |
|----|------|------|-----|
| H-FOURSEASONS | Four Seasons George V | Paris | Opera |
| H-FSGENEVA | Four Seasons des Bergues | Geneva | Opera |
| H-BULGARI | Bulgari Hotel Milano | Milan | Mews |
| H-MAMOUNIA | La Mamounia | Marrakech | Opera |

### Active Reservations (Four Seasons Paris)

| Confirmation | Guest | Room | Status |
|--------------|-------|------|--------|
| FSGV2025A1B2C | Sophie Martin | 701 | Checked In |
| FSGV2025D3E4F | James Wilson | TBD | Arriving Tomorrow |
| FSGV2025G5H6I | Yuki Tanaka | TBD | Arriving Today |
| FSGV2025M9N0P | Emma Dubois | TBD | Arriving +2 days |
| FSGV2025J7K8L | Mohammed Al-Rashid | PH1 | VIP Checked In |
| DEMO123456 | Demo Guest | 227 | Demo Stay |

### Service Departments

- **Housekeeping:** Towels, pillows, cleaning, turndown
- **Room Service:** Breakfast, dining, beverages, minibar
- **Concierge:** Transport, reservations, special requests
- **Spa & Gym:** Massages, facials, fitness
- **Reception:** Check-out, room changes

### Room Types

| Type | Description | Rate (EUR) |
|------|-------------|------------|
| SUPERIOR | Superior Room | 650 |
| DELUXE | Deluxe Room | 850 |
| JRSUITE | Junior Suite | 1,200 |
| SUITE | One Bedroom Suite | 1,500 |
| PRESIDENTIAL | Presidential Suite | 8,500 |

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection (check backend/.env)
DATABASE_URL=postgres://user:password@localhost:5432/mystay

# Reset database completely
./dev.sh --reset-db
```

### Mock Server Issues
```bash
# Check if ports are in use
lsof -i :4010
lsof -i :4011

# Kill processes on ports
kill -9 $(lsof -t -i:4010)
kill -9 $(lsof -t -i:4011)

# Restart just mocks
npm run dev:mock:opera
npm run dev:mock:spabooker
```

### Frontend Issues
```bash
# Clear Next.js cache
rm -rf frontend/.next
rm -rf admin/.next

# Reinstall dependencies
npm install

# Restart
npm run dev:frontend
```

### Staff Login Not Working
```bash
# Re-seed database
npm run db:seed

# Or full reset
./dev.sh --reset-db
```

---

## 📁 Project Structure

```
mystay/
├── frontend/          # Guest mobile web app (Next.js)
├── admin/             # Hotel admin dashboard (Next.js)
├── backend/           # API server (Node.js)
│   ├── src/
│   │   └── server.mjs
│   └── db/
│       ├── seed.sql          # Main seed data
│       └── seed-services.sql # Service catalog
├── mock-servers/      # PMS mock servers
│   ├── opera-mock.mjs
│   └── spabooker-mock.mjs
├── dev.sh            # Development startup script
└── demo.md           # This file
```

---

## 🔑 Important Notes

- **All demo passwords:** `admin123`
- **Mock data resets** when servers restart
- **Use environment variables** for production secrets
- **Multi-language support:** English (en) and French (fr)

---

*Last updated: January 2026*
