# MyStay Demo Guide

This document provides comprehensive instructions for setting up and testing the MyStay platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or pnpm

### 1. Start the Database
```bash
# If using Docker
docker compose up -d db

# Or ensure your PostgreSQL is running
```

### 2. Run Migrations & Seed Data
```bash
cd backend
npm run db:migrate
npm run db:seed
```

### 3. Start All Services
```bash
# Terminal 1: Mock PMS Server
cd backend && npm run mock-pms

# Terminal 2: Backend API
cd backend && npm run dev

# Terminal 3: Guest Frontend
cd frontend && npm run dev

# Terminal 4: Hotel Admin Dashboard
cd admin && npm run dev
```

### 4. Access the Applications
- **Guest App**: http://localhost:3001
- **Hotel Admin**: http://localhost:3002
- **Backend API**: http://localhost:4000
- **Mock PMS**: http://localhost:4010

---

## 🔐 Demo Accounts

### Platform Administrator
Access the hotel admin dashboard at http://localhost:3002

| Email | Password | Access |
|-------|----------|--------|
| `admin@mystay.com` | `admin123` | Platform-wide admin (manage all hotels) |

### Hotel Staff Accounts

#### Four Seasons Paris (Main Demo Hotel)
| Email | Password | Role | Departments |
|-------|----------|------|-------------|
| `manager@fourseasons.demo` | `admin123` | Manager | All departments |
| `concierge@fourseasons.demo` | `admin123` | Staff | Concierge |
| `reception@fourseasons.demo` | `admin123` | Staff | Reception |
| `housekeeping@fourseasons.demo` | `admin123` | Staff | Housekeeping |
| `spa@fourseasons.demo` | `admin123` | Staff | Spa & Gym |
| `roomservice@fourseasons.demo` | `admin123` | Staff | Room Service, Restaurants |

#### Four Seasons Geneva
| Email | Password | Role |
|-------|----------|------|
| `manager@geneva.demo` | `admin123` | Manager |
| `concierge@geneva.demo` | `admin123` | Staff |

#### Bulgari Hotel Milan
| Email | Password | Role |
|-------|----------|------|
| `manager@bulgari.demo` | `admin123` | Manager |
| `concierge@bulgari.demo` | `admin123` | Staff |

#### La Mamounia Marrakech
| Email | Password | Role |
|-------|----------|------|
| `manager@mamounia.demo` | `admin123` | Manager |
| `concierge@mamounia.demo` | `admin123` | Staff |

### Guest Accounts
Access the guest app at http://localhost:3001

| Email | Password | Hotel | Status |
|-------|----------|-------|--------|
| `sophie.martin@email.com` | `admin123` | Four Seasons Paris | Currently checked in |
| `james.wilson@corp.com` | `admin123` | Four Seasons Paris | Arriving tomorrow |
| `yuki.tanaka@example.jp` | `admin123` | Four Seasons Paris | Checking in today |
| `emma.dubois@gmail.com` | `admin123` | Four Seasons Paris | Arriving in 2 days |
| `m.alrashid@business.ae` | `admin123` | La Mamounia | Future booking |

### Demo Reservation (No Account Required)
For quick testing without creating an account:
- **Confirmation Number**: `0123456789`
- **Room**: 227

---

## 🏨 Mock PMS Integration

The Mock PMS simulates a real Property Management System (Opera, Mews, etc.).

### Starting the Mock PMS
```bash
cd backend
npm run mock-pms
# Server runs on http://localhost:4010
```

### Available Endpoints

#### Properties
```bash
# List all properties
curl http://localhost:4010/v1/properties

# Get property details
curl http://localhost:4010/v1/properties/FS-PARIS
```

#### Reservations
```bash
# List reservations for a property
curl http://localhost:4010/v1/hotels/FS-PARIS/reservations

# Search by confirmation number
curl "http://localhost:4010/v1/hotels/FS-PARIS/reservations?confirmationNumber=FSGV2025A1B2C"

# Search by guest email
curl "http://localhost:4010/v1/hotels/FS-PARIS/reservations?guestEmail=sophie.martin@email.com"

# Get reservation details
curl http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-2025-0001
```

#### Room Management
```bash
# List rooms
curl http://localhost:4010/v1/hotels/FS-PARIS/rooms

# Get room details
curl http://localhost:4010/v1/hotels/FS-PARIS/rooms/701

# Filter by status (clean, dirty, occupied, maintenance)
curl "http://localhost:4010/v1/hotels/FS-PARIS/rooms?status=clean"
```

#### Today's Arrivals/Departures
```bash
# Today's arrivals
curl http://localhost:4010/v1/hotels/FS-PARIS/arrivals

# Today's departures
curl http://localhost:4010/v1/hotels/FS-PARIS/departures

# Specific date
curl "http://localhost:4010/v1/hotels/FS-PARIS/arrivals?date=2025-01-22"
```

#### Check-in / Check-out
```bash
# Check in a guest
curl -X POST http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-2025-0003/checkin \
  -H "Content-Type: application/json" \
  -d '{"roomNumber": "602"}'

# Check out a guest
curl -X POST http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-2025-0001/checkout
```

#### Folio/Billing
```bash
# Get guest folio
curl http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-2025-0001/folios

# Add a charge
curl -X POST http://localhost:4010/v1/hotels/FS-PARIS/reservations/RES-2025-0001/charges \
  -H "Content-Type: application/json" \
  -d '{"description": "Room Service - Lunch", "amount": 65, "category": "restaurant"}'
```

#### Room Service Menu
```bash
curl http://localhost:4010/v1/hotels/FS-PARIS/menu
```

#### Spa Services
```bash
# Get spa services catalog
curl http://localhost:4010/v1/hotels/FS-PARIS/spa/services

# Check availability
curl "http://localhost:4010/v1/hotels/FS-PARIS/spa/availability?date=2025-01-21&serviceId=SPA-004"
```

#### OTA Sync Simulation
```bash
# Simulate a booking from Booking.com
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
      "checkInDate": "2025-01-25",
      "checkOutDate": "2025-01-28",
      "roomType": "Deluxe Room"
    }
  }'
```

### PMS Configuration in MyStay

Hotels can be connected to the PMS via the admin dashboard:

1. Login as hotel manager
2. Go to Settings → PMS Integration
3. Configure the PMS provider:
   - **Provider**: opera, mews, cloudbeds
   - **Base URL**: http://localhost:4010
   - **Resort ID**: FS-PARIS (matches PMS property ID)
   - **Credentials**: OPERA/OPERA (mock credentials)

---

## 🧪 Testing Scenarios

### Scenario 1: Guest Journey (with Account)

1. **Sign Up**: Go to http://localhost:3001/signup
   - Enter: Sophie Martin, sophie.martin@email.com, guest123
   - Skip ID verification and payment steps

2. **Link Reservation**: 
   - Enter confirmation: `FSGV2025A1B2C`
   - Guest is now connected to room 701

3. **Explore Experience**:
   - View room information
   - Browse spa services
   - Order room service
   - Chat with concierge

### Scenario 2: Guest Journey (Quick Demo)

1. Go to http://localhost:3001/login
2. Use demo confirmation: `0123456789`
3. Explore the experience without creating an account

### Scenario 3: Hotel Staff Operations

1. Login to admin dashboard: http://localhost:3002
2. Use: `manager@fourseasons.demo` / `password123`
3. View:
   - Dashboard overview
   - Today's arrivals/departures
   - Active service requests
   - Guest conversations

### Scenario 4: Platform Admin

1. Login to admin: http://localhost:3002
2. Toggle to "Platform Admin" mode
3. Use: `admin@mystay.com` / `admin123`
4. Manage:
   - View all hotels
   - Add new hotels
   - Configure hotel settings
   - Manage staff across hotels

### Scenario 5: PMS Integration Test

1. Login as hotel manager
2. Go to Settings
3. Test PMS connection
4. View synced reservations
5. Check room availability

---

## 📊 Sample Data Overview

### Hotels
| ID | Name | City | Status |
|----|------|------|--------|
| H-FOURSEASONS | Four Seasons Hotel George V | Paris | Active |
| H-FSGENEVA | Four Seasons Hotel des Bergues | Geneva | Active |
| H-BULGARI | Bulgari Hotel Milano | Milan | Active |
| H-MAMOUNIA | La Mamounia | Marrakech | Active |

### Active Reservations (PMS Mock)
| Confirmation | Guest | Hotel | Room | Status |
|-------------|-------|-------|------|--------|
| FSGV2025A1B2C | Sophie Martin | Paris | 701 | Checked In |
| FSGV2025D3E4F | James Wilson | Paris | TBA | Confirmed |
| FSGV2025G5H6I | Yuki Tanaka | Paris | TBA | Confirmed |
| FSGV2025M9N0P | Emma Dubois | Paris | TBA | Confirmed |
| FSGE2025A1A1A | James Wilson | Geneva | 401 | Checked In |
| BHMI2025X1Y2Z | Sophie Martin | Milan | TBA | Confirmed |
| LAMM2025H1H2H | Mohammed Al-Rashid | Marrakech | TBA | Confirmed |

### Room Service Menu Categories
- Breakfast (06:30-11:00)
- Starters & Salads (11:00-23:00)
- Main Courses (12:00-23:00)
- Desserts (12:00-23:30)
- Late Night (23:00-06:00)
- Beverages (24/7)

### Spa Services
- Massages (Swedish, Deep Tissue, Hot Stone, Couples)
- Facials (Signature, Anti-Aging, Hydrating, Men's)
- Body Treatments (Scrub & Wrap, Detox)
- Spa Journeys (Half-Day, Full Day, Romantic)
- Wellness (Yoga, Personal Training, Meditation)

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string in .env
DATABASE_URL=postgres://user:password@localhost:5432/mystay
```

### Mock PMS Not Responding
```bash
# Check if port 4010 is in use
lsof -i :4010

# Restart mock PMS
cd backend && npm run mock-pms
```

### Staff Login Not Working
1. Ensure migrations are applied: `npm run db:migrate`
2. Ensure seed data is loaded: `npm run db:seed`
3. Verify the password hash in the database

### Frontend Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

---

## 📝 Notes

- All demo passwords should be changed in production
- Mock PMS data resets when server restarts
- Use environment variables for sensitive configuration
- The platform supports multiple languages (en, fr)

---

*Last updated: January 2025*
