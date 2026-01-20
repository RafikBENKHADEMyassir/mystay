# Backend Integrations Guide

This guide covers all external service integrations in the MyStay backend.

## Overview

The backend includes connectors for:
- **PMS Systems**: Opera Cloud, Mews, Cloudbeds
- **Payment Processing**: Stripe
- **Digital Keys**: Alliants, OpenKey
- **OCR Services**: AWS Textract, Google Vision, Azure Vision
- **AI Assistant**: OpenAI GPT-4

All integrations are managed through the `IntegrationManager` singleton.

## Getting Started

### 1. Configuration

Copy `.env.example` to `.env` and configure your integration credentials:

```bash
cp .env.example .env
```

### 2. Initialize Integrations

In your server startup code:

```javascript
import { getIntegrationManager } from "./src/integrations/integration-manager.mjs";

// Initialize all configured integrations
const integrationManager = getIntegrationManager();
integrationManager.initializeAll();

// Or initialize individually
integrationManager.initPMS("mews", {
  baseUrl: process.env.PMS_BASE_URL,
  clientToken: process.env.PMS_CLIENT_TOKEN,
  // ... other config
});
```

## PMS Integration

### Supported Providers

- **Opera Cloud**: Oracle's PMS system
- **Mews**: Cloud-based PMS
- **Cloudbeds**: Hospitality management platform
- **Mock**: Test provider with dummy data

### Usage

```javascript
const pms = integrationManager.getPMS();

// Get reservation by confirmation number
const reservation = await pms.getReservation("CONF123");

// Get guest folio
const folio = await pms.getFolio("RES-456");

// Update guest profile
await pms.updateGuestProfile("GUEST-789", {
  email: "updated@example.com",
  phone: "+1234567890",
});
```

### Response Format

All PMS methods return normalized data:

```javascript
{
  id: "RES-123",
  confirmationNumber: "CONF123",
  guestName: "John Doe",
  guestEmail: "john@example.com",
  checkInDate: "2026-01-15",
  checkOutDate: "2026-01-20",
  roomType: "Deluxe King",
  roomNumber: "305",
  status: "confirmed",
  numberOfGuests: 2
}
```

## Payment Integration (Stripe)

### Features

- Authorization holds (pre-auth)
- Charge capture
- Refunds (full or partial)
- Digital tips processing
- Customer management

### Usage

```javascript
const payment = integrationManager.getPayment();

// Create authorization hold
const hold = await payment.createAuthorizationHold({
  amount: 500.0,
  currency: "usd",
  customerId: "cus_abc123",
  description: "Hotel room deposit",
});

// Capture hold
await payment.captureHold(hold.id, 350.0); // Capture partial amount

// Process tip
await payment.processTip({
  amount: 20.0,
  currency: "usd",
  customerId: "cus_abc123",
  staffName: "Maria Garcia",
  department: "Housekeeping",
});

// Create refund
await payment.createRefund(hold.id, 50.0, "partial_refund");
```

### Customer Management

```javascript
// Create customer
const customer = await payment.createCustomer({
  email: "guest@example.com",
  name: "John Doe",
  phone: "+1234567890",
  metadata: { reservationId: "RES-123" },
});

// Attach payment method
await payment.attachPaymentMethod("pm_xyz789", customer.id);

// List payment methods
const methods = await payment.listPaymentMethods(customer.id);
```

## Digital Key Integration

### Supported Providers

- **Alliants**: Mobile key provider
- **OpenKey**: Digital access platform
- **None**: Disabled (no digital key)

### Usage

```javascript
const digitalKey = integrationManager.getDigitalKey();

// Issue digital key
const key = await digitalKey.issueKey({
  guestId: "GUEST-123",
  roomNumber: "305",
  checkIn: "2026-01-15T14:00:00Z",
  checkOut: "2026-01-20T11:00:00Z",
  guestEmail: "guest@example.com",
});

// Revoke key
await digitalKey.revokeKey(key.keyId);

// Extend validity
await digitalKey.extendKey(key.keyId, "2026-01-21T11:00:00Z");

// Check status
const status = await digitalKey.getKeyStatus(key.keyId);
```

## OCR Service

### Supported Providers

- **AWS Textract**: Amazon's document analysis
- **Google Vision**: Google Cloud Vision API
- **Azure Vision**: Microsoft Computer Vision
- **Mock**: Test provider with sample data

### Usage

```javascript
const ocr = integrationManager.getOCR();

// Extract data from ID image
const imageBuffer = fs.readFileSync("passport.jpg");
const data = await ocr.extractIDData(imageBuffer, "passport");

// Validate extracted data
const validation = ocr.validateIDData(data);

if (validation.isValid) {
  console.log("ID data is valid");
} else {
  console.error("Validation errors:", validation.errors);
  console.warn("Warnings:", validation.warnings);
}
```

### Extracted Data Format

```javascript
{
  documentType: "passport",
  documentNumber: "P123456789",
  firstName: "John",
  lastName: "Doe",
  middleName: "Michael",
  dateOfBirth: "1985-06-15",
  nationality: "USA",
  sex: "M",
  issueDate: "2020-01-15",
  expiryDate: "2030-01-15",
  issuingCountry: "USA",
  confidence: 0.95,
  extractedAt: "2026-01-11T10:30:00Z"
}
```

## AI Concierge

### Features

- Natural language query handling
- Local recommendations
- Sentiment analysis
- Context-aware responses
- Automatic escalation detection

### Usage

```javascript
const aiConcierge = integrationManager.getAIConcierge();

// Process guest message
const response = await aiConcierge.processMessage(
  "Can you recommend a good Italian restaurant nearby?",
  conversationHistory,
  { name: "John Doe", roomNumber: "305" }
);

console.log(response.response); // AI response text
console.log(response.requiresEscalation); // true if needs human staff

// Get recommendations
const recommendations = await aiConcierge.getRecommendations("restaurants", {
  cuisine: "Italian",
  priceRange: "moderate",
});

// Analyze sentiment
const sentiment = await aiConcierge.analyzeSentiment(
  "I'm very disappointed with the room service"
);
console.log(sentiment); // { sentiment: "negative", confidence: 0.9, urgency: "high" }

// Generate suggestions
const suggestions = await aiConcierge.generateSuggestions(
  "I need help with transportation",
  { name: "Jane Smith" }
);
```

### Escalation Rules

The AI automatically detects when queries require human intervention based on:
- Emergency keywords (medical, fire, police)
- Complaint indicators (problem, issue, disappointed)
- Service requests (refund, cancel)
- High-urgency situations

## Health Checks

```javascript
// Check all integrations
const health = await integrationManager.healthCheck();

console.log(health);
/*
{
  pms: true,
  payment: true,
  digitalKey: true,
  ocr: true,
  aiConcierge: true,
  timestamp: "2026-01-11T10:30:00Z"
}
*/
```

## Error Handling

All connectors throw descriptive errors:

```javascript
try {
  const reservation = await pms.getReservation("INVALID");
} catch (error) {
  console.error("PMS Error:", error.message);
  // Handle error appropriately
}
```

## Testing

Use mock providers for development:

```env
PMS_PROVIDER=mock
OCR_PROVIDER=mock
DIGITAL_KEY_PROVIDER=none
```

Mock providers return realistic dummy data without external API calls.

## Production Checklist

Before deploying to production:

1. ✅ Set real API credentials in `.env`
2. ✅ Enable appropriate providers (not mock)
3. ✅ Test each integration with staging APIs
4. ✅ Configure error monitoring
5. ✅ Set up rate limiting
6. ✅ Enable logging for audit trails
7. ✅ Review and secure API keys
8. ✅ Test failover scenarios

## Support

For integration issues:
- Check provider API documentation
- Verify credentials and permissions
- Review integration logs
- Test with mock providers first
- Contact provider support if needed
