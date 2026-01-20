# MyStay Project - To-Do List

This document tracks the remaining development tasks to meet the client requirements.

Based on the analysis on 2026-01-11.

## Next Steps

All major features and enhancements are now complete! 🎉

The following items from the original list have been implemented:
1. ✅ **Digital Tips Feature**: Complete Stripe integration for processing tips with frontend dialog component
2. ✅ **Real-time Order Tracking**: SSE-based live order status updates for Room Service
3. ✅ **Structured Request Builder**: Admin UI for departments to create custom request forms
4. ✅ **Partner Hotel Browsing**: UI for guests without reservations to explore partner hotels
5. ✅ **F&B Integration Connector**: Restaurant POS integration supporting OpenTable, SevenRooms, and generic systems
6. ✅ **Spa Booker Integration Connector**: Spa/Wellness booking integration supporting Spa Booker, Mindbody, and generic systems

### Additional Notes
- Run `npm install` in the `admin/` directory to install the new `@radix-ui/react-select` dependency
- The tips API endpoint is at `POST /api/v1/tips`
- Real-time order tracking is available at `GET /api/v1/realtime/orders?ticketId=<id>`
- Request templates admin page is at `/request-templates`
- Partner hotels browsing is at `/hotels`

---

## Summary of Completed Work

### ✅ Guest App (`frontend`)
- Complete authentication system (signup, login, JWT sessions)
- Full navigation structure (bottom nav, side drawer, header)
- All service modules: Room Service, Concierge, Housekeeping, Restaurants, Spa, Gym, Reception
- Profile, Agenda, and Messaging modules with backend integration
- Digital check-in/check-out flows
- Comprehensive UI component library

### ✅ Staff Dashboard (`admin`)
- Department-specific dashboards: Reception, Housekeeping
- Analytics dashboard with KPIs and metrics
- Inbox and messaging for staff
- Integration configuration UI

### ✅ Backend (`backend`)
- **PMS Integration**: Opera Cloud, Mews, Cloudbeds connectors
- **Payment Integration**: Full Stripe integration (holds, charges, refunds, tips)
- **Digital Key Integration**: Alliants and OpenKey support
- **OCR Service**: ID scanning with AWS Textract, Google Vision, Azure Vision
- **AI Concierge**: OpenAI GPT-4 powered assistant for guest queries

---

## Remaining Tasks

### Guest App (`frontend`)

-   [x] **Authentication & Reservation Link**
    -   [x] Sign-up page with fields for profile, ID upload, and payment.
    -   [x] Login page.
    -   [x] Flow to link a reservation using a confirmation number.
    -   [ ] UI for browsing partner hotels without a reservation.
-   [x] **Home (Stay Summary)**
    -   [x] Display stay summary (hotel, dates, room).
    -   [x] Implement quick action buttons (Digital Key, Wi-Fi, etc.).
    -   [x] Implement upsell cards for services and events.
-   [x] **Navigation**
    -   [x] Implement main bottom navigation (Home, Messages, Agenda, Profile).
    -   [x] Implement side drawer for all service modules.
-   [x] **Reception: Digital Check-in / Check-out**
    -   [x] Multi-step UI for digital check-in (ID scan, info verification, card hold, e-signature).
    -   [x] UI for digital check-out (view bill, pay, get invoice).
-   [x] **Messaging (Global Inbox)**
    -   [x] Unified chat interface for all departments.
    -   [x] Support for photo attachments.
-   [x] **Concierge Module**
    -   [x] Chat interface with concierge.
    -   [x] Quick action buttons for common requests.
    -   [ ] Digital tips feature.
-   [x] **Housekeeping Module**
    -   [x] UI to toggle cleaning service.
    -   [x] Quick request icons for items.
-   [x] **Room Service Module**
    -   [x] Digital menu with categories, photos, and details.
    -   [x] Shopping cart and checkout flow.
    -   [ ] Real-time order status tracking.
-   [x] **Restaurants Module**
    -   [x] UI to browse restaurant menus.
    -   [x] Table booking form.
-   [x] **Spa & Gym Module**
    -   [x] UI to browse spa services and book treatments.
    -   [x] UI for gym schedule and class booking.
-   [x] **Agenda Module**
    -   [x] Unified calendar view for all bookings and events.
    -   [x] UI to accept/decline event suggestions.
-   [x] **Profile Module**
    -   [x] Page for personal info and preferences.
    -   [x] Manage payment methods.
    -   [x] View stay history and download invoices.

### Staff Dashboard (`admin`)

-   [x] **Department Dashboards**
    -   [x] Specialized dashboard for Reception (arrivals, departures, check-in validation).
    -   [x] Specialized dashboard for Housekeeping (room status grid, task assignment).
    -   [x] Specialized dashboard for F&B (orders, reservations).
    -   [x] Specialized dashboard for Spa (bookings, schedule).
-   [x] **Analytics Dashboard**
    -   [x] UI for managers to view KPIs (response times, revenue, satisfaction).
    -   [x] Data visualization for trends.
-   [ ] **Structured Requests (Module Builder)**
    -   [ ] Interface for departments to configure standard request forms.

### Backend (`backend`)

-   [x] **PMS Integration**
    -   [x] Connect to a PMS API (e.g., Mews, Opera, Cloudbeds) for reservation and folio data.
-   [x] **Payment Gateway Integration**
    -   [x] Integrate with Stripe for holds, charges, and tips.
-   [x] **Digital Key Integration**
    -   [x] Integrate with a digital key provider.
-   [x] **OCR for ID Scanning**
    -   [x] Implement or integrate a service for ID document scanning and data extraction.
-   [x] **AI Assistant**
    -   [x] Implement the AI assistant for the concierge's offline hours.

## Gap Analysis - Missing Features from Arborescence (High Priority)
### Guest App (Frontend)
- [ ] **Concierge Module**: Implement chat interface + quick actions (Taxi, Transfer, Tickets) per User Story 4.
- [ ] **Housekeeping Module**: Implement simplified request flow (Icons for towels, amenities) + chat per User Story 6.
- [ ] **Room Service Module**: Implement "Uber Eats" style menu, cart, order tracking, and chat per User Story 7.
- [ ] **Spa & Gym Module**: Implement Service Catalog (sync with Spa Booker), Booking flow, and Coach booking per User Story 8 & 10.
- [ ] **Restaurant Module**: Implement Menu display, Table booking flow per User Story 9.
- [ ] **Agenda Intelligent**: Implement unified view of all bookings (Spa, Dinner, etc.) + Hotel Events per User Story 11.

### Staff App (Admin)
- [ ] **Reception Dashboard**: Dedicated view for Check-in/out status, room status, and live arrivals/departures (User Story 2 & 5).
- [ ] **Housekeeping Dashboard**: "Housekeeping Board" with room grid (Ready/Cleaning/Dirty) and task assignment (User Story 6).
- [ ] **F&B Manager Dashboard**: Menu management, Order tracking (Prep/Delivery), Table reservations (User Story 7 & 9).
- [ ] **Wellness Manager Dashboard**: Spa/Gym calendar view, Practitioner scheduling (User Story 8 & 10).
- [ ] **Concierge Hub**: Enhanced dashboard with quick booking tools and "Concierge on duty" logic (User Story 4).

### Backend Integrations
- [ ] **F&B Integration**: Connect to Restaurant POS/Booking system (OpenTable/SevenRooms or generic) for table/order sync.
- [ ] **Spa Integration**: Connect to "Spa Booker" or similar for service catalog and availability sync.