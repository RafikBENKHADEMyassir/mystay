import { sql } from "drizzle-orm";
import { boolean, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const guests = pgTable(
  "guests",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    idDocumentUrl: text("id_document_url"),
    idDocumentVerified: boolean("id_document_verified").notNull().default(false),
    paymentMethodId: text("payment_method_id"),
    paymentProvider: text("payment_provider"),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerificationToken: text("email_verification_token"),
    emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    emailIdx: index("idx_guests_email").on(table.email),
    emailUnique: uniqueIndex("guests_email_unique").on(table.email)
  })
);

export const hotels = pgTable(
  "hotels",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),
    primaryColor: text("primary_color").default("#1a1a2e"),
    secondaryColor: text("secondary_color").default("#f5a623"),
    address: text("address"),
    city: text("city"),
    country: text("country"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    timezone: text("timezone").default("Europe/Paris"),
    currency: text("currency").default("EUR"),
    starRating: integer("star_rating"),
    amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    isActiveIdx: index("idx_hotels_is_active").on(table.isActive)
  })
);

export const platformAdmins = pgTable(
  "platform_admins",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    emailIdx: index("idx_platform_admins_email").on(table.email),
    emailUnique: uniqueIndex("platform_admins_email_unique").on(table.email)
  })
);

export const hotelIntegrations = pgTable("hotel_integrations", {
  hotelId: text("hotel_id")
    .primaryKey()
    .references(() => hotels.id, { onDelete: "cascade" }),
  pmsProvider: text("pms_provider").notNull().default("mock"),
  pmsConfig: jsonb("pms_config").notNull().default({}),
  digitalKeyProvider: text("digital_key_provider").notNull().default("none"),
  digitalKeyConfig: jsonb("digital_key_config").notNull().default({}),
  spaProvider: text("spa_provider").notNull().default("none"),
  spaConfig: jsonb("spa_config").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const hotelNotifications = pgTable("hotel_notifications", {
  hotelId: text("hotel_id")
    .primaryKey()
    .references(() => hotels.id, { onDelete: "cascade" }),
  emailProvider: text("email_provider").notNull().default("none"),
  emailConfig: jsonb("email_config").notNull().default({}),
  smsProvider: text("sms_provider").notNull().default("none"),
  smsConfig: jsonb("sms_config").notNull().default({}),
  pushProvider: text("push_provider").notNull().default("none"),
  pushConfig: jsonb("push_config").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const pmsSyncRuns = pgTable(
  "pms_sync_runs",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    summary: jsonb("summary").notNull().default({}),
    errorMessage: text("error_message"),
    errorDetails: text("error_details")
  },
  (table) => ({
    hotelIdx: index("idx_pms_sync_runs_hotel_id").on(table.hotelId),
    statusIdx: index("idx_pms_sync_runs_status").on(table.status),
    startedAtIdx: index("idx_pms_sync_runs_started_at").on(table.startedAt)
  })
);

export const audienceContacts = pgTable(
  "audience_contacts",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    guestId: text("guest_id").references(() => guests.id, { onDelete: "set null" }),
    status: text("status").notNull(),
    statusAt: timestamp("status_at", { withTimezone: true }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    channel: text("channel").notNull(),
    syncedWithPms: boolean("synced_with_pms").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_audience_contacts_hotel_id").on(table.hotelId),
    statusIdx: index("idx_audience_contacts_status").on(table.hotelId, table.status),
    statusAtIdx: index("idx_audience_contacts_status_at").on(table.hotelId, table.statusAt),
    hotelEmailUnique: uniqueIndex("audience_contacts_hotel_email_unique").on(table.hotelId, table.email)
  })
);

export const signupForms = pgTable(
  "signup_forms",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    channel: text("channel").notNull(),
    status: text("status").notNull().default("active"),
    config: jsonb("config").notNull().default({}),
    createdByStaffUserId: text("created_by_staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_signup_forms_hotel_id").on(table.hotelId),
    channelIdx: index("idx_signup_forms_channel").on(table.hotelId, table.channel),
    statusIdx: index("idx_signup_forms_status").on(table.hotelId, table.status),
    updatedAtIdx: index("idx_signup_forms_updated_at").on(table.hotelId, table.updatedAt)
  })
);

export const hotelDirectoryPages = pgTable(
  "hotel_directory_pages",
  {
    hotelId: text("hotel_id")
      .primaryKey()
      .references(() => hotels.id, { onDelete: "cascade" }),
    draft: jsonb("draft").notNull().default({}),
    published: jsonb("published").notNull().default({}),
    draftSavedAt: timestamp("draft_saved_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    updatedAtIdx: index("idx_hotel_directory_pages_updated_at").on(table.hotelId, table.updatedAt)
  })
);

export const automations = pgTable(
  "automations",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    trigger: text("trigger").notNull(),
    status: text("status").notNull().default("active"),
    config: jsonb("config").notNull().default({}),
    createdByStaffUserId: text("created_by_staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_automations_hotel_id").on(table.hotelId),
    statusIdx: index("idx_automations_status").on(table.hotelId, table.status),
    updatedAtIdx: index("idx_automations_updated_at").on(table.hotelId, table.updatedAt)
  })
);

export const messageTemplates = pgTable(
  "message_templates",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    channel: text("channel").notNull(),
    status: text("status").notNull().default("draft"),
    content: jsonb("content").notNull().default({}),
    createdByStaffUserId: text("created_by_staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_message_templates_hotel_id").on(table.hotelId),
    channelIdx: index("idx_message_templates_channel").on(table.hotelId, table.channel),
    statusIdx: index("idx_message_templates_status").on(table.hotelId, table.status),
    updatedAtIdx: index("idx_message_templates_updated_at").on(table.hotelId, table.updatedAt)
  })
);

export const upsellServices = pgTable(
  "upsell_services",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    name: text("name").notNull(),
    touchpoint: text("touchpoint").notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    availabilityWeekdays: text("availability_weekdays").array().notNull().default(sql`ARRAY[]::text[]`),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    description: text("description"),
    imageUrl: text("image_url"),
    timeSlots: text("time_slots").array().notNull().default(sql`ARRAY[]::text[]`),
    bookable: boolean("bookable").notNull().default(false),
    createdByStaffUserId: text("created_by_staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_upsell_services_hotel_id").on(table.hotelId),
    categoryIdx: index("idx_upsell_services_category").on(table.hotelId, table.category),
    enabledIdx: index("idx_upsell_services_enabled").on(table.hotelId, table.enabled),
    updatedAtIdx: index("idx_upsell_services_updated_at").on(table.hotelId, table.updatedAt)
  })
);

export const serviceBookings = pgTable(
  "service_bookings",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    stayId: text("stay_id").references(() => stays.id, { onDelete: "set null" }),
    upsellServiceId: text("upsell_service_id")
      .notNull()
      .references(() => upsellServices.id, { onDelete: "cascade" }),
    guestName: text("guest_name").notNull(),
    bookingDate: text("booking_date").notNull(),
    timeSlot: text("time_slot").notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    status: text("status").notNull().default("confirmed"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_service_bookings_hotel").on(table.hotelId),
    stayIdx: index("idx_service_bookings_stay").on(table.stayId),
    serviceIdx: index("idx_service_bookings_service").on(table.upsellServiceId),
    dateIdx: index("idx_service_bookings_date").on(table.hotelId, table.bookingDate),
    statusIdx: index("idx_service_bookings_status").on(table.hotelId, table.status)
  })
);

export const staffUsers = pgTable(
  "staff_users",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name"),
    role: text("role").notNull(),
    departments: text("departments").array().notNull().default(sql`ARRAY[]::text[]`),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdIdx: index("idx_staff_users_hotel_id").on(table.hotelId),
    emailIdx: index("idx_staff_users_email").on(table.email),
    emailUnique: uniqueIndex("staff_users_email_unique").on(table.email)
  })
);

export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    provider: text("provider").notNull(),
    toAddress: text("to_address").notNull(),
    subject: text("subject"),
    bodyText: text("body_text"),
    payload: jsonb("payload").notNull().default({}),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdIdx: index("idx_notification_outbox_hotel_id").on(table.hotelId),
    statusNextAttemptIdx: index("idx_notification_outbox_status_next_attempt").on(table.status, table.nextAttemptAt)
  })
);

export const stays = pgTable(
  "stays",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    guestId: text("guest_id").references(() => guests.id, { onDelete: "set null" }),
    confirmationNumber: text("confirmation_number").notNull(),
    pmsReservationId: text("pms_reservation_id"),
    pmsStatus: text("pms_status"),
    guestFirstName: text("guest_first_name"),
    guestLastName: text("guest_last_name"),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),
    roomNumber: text("room_number"),
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    adults: integer("adults").notNull().default(1),
    children: integer("children").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    confirmationUnique: uniqueIndex("stays_confirmation_number_unique").on(table.confirmationNumber),
    confirmationIdx: index("idx_stays_confirmation_number").on(table.confirmationNumber),
    hotelIdx: index("idx_stays_hotel_id").on(table.hotelId),
    guestIdx: index("idx_stays_guest_id").on(table.guestId),
    pmsReservationIdx: index("idx_stays_pms_reservation_id").on(table.hotelId, table.pmsReservationId),
    guestEmailIdx: index("idx_stays_guest_email").on(table.hotelId, table.guestEmail)
  })
);

export const tickets = pgTable(
  "tickets",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    stayId: text("stay_id").references(() => stays.id, { onDelete: "set null" }),
    roomNumber: text("room_number"),
    department: text("department").notNull(),
    status: text("status").notNull(),
    title: text("title").notNull(),
    assignedStaffUserId: text("assigned_staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_tickets_hotel_id").on(table.hotelId),
    stayIdx: index("idx_tickets_stay_id").on(table.stayId),
    deptIdx: index("idx_tickets_department").on(table.department),
    statusIdx: index("idx_tickets_status").on(table.status),
    assignedIdx: index("idx_tickets_assigned_staff_user_id").on(table.assignedStaffUserId)
  })
);

export const threads = pgTable(
  "threads",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    stayId: text("stay_id").references(() => stays.id, { onDelete: "set null" }),
    department: text("department").notNull(),
    status: text("status").notNull(),
    title: text("title").notNull(),
    assignedStaffUserId: text("assigned_staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    guestLastReadAt: timestamp("guest_last_read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_threads_hotel_id").on(table.hotelId),
    stayIdx: index("idx_threads_stay_id").on(table.stayId),
    deptIdx: index("idx_threads_department").on(table.department),
    statusIdx: index("idx_threads_status").on(table.status),
    assignedIdx: index("idx_threads_assigned_staff_user_id").on(table.assignedStaffUserId),
    guestLastReadAtIdx: index("idx_threads_guest_last_read_at").on(table.hotelId, table.stayId, table.guestLastReadAt)
  })
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    senderType: text("sender_type").notNull(),
    senderName: text("sender_name"),
    bodyText: text("body_text").notNull(),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    threadIdx: index("idx_messages_thread_id").on(table.threadId),
    createdAtIdx: index("idx_messages_created_at").on(table.createdAt)
  })
);

export const internalNotes = pgTable(
  "internal_notes",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    department: text("department").notNull(),
    authorStaffUserId: text("author_staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    bodyText: text("body_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    targetIdx: index("idx_internal_notes_target").on(table.hotelId, table.targetType, table.targetId),
    deptIdx: index("idx_internal_notes_department").on(table.hotelId, table.department),
    createdAtIdx: index("idx_internal_notes_created_at").on(table.createdAt)
  })
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    stayId: text("stay_id").references(() => stays.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    status: text("status").notNull().default("scheduled"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_events_hotel_id").on(table.hotelId),
    stayIdx: index("idx_events_stay_id").on(table.stayId),
    startAtIdx: index("idx_events_start_at").on(table.startAt)
  })
);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    stayId: text("stay_id").references(() => stays.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    department: text("department"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    pointsEarned: integer("points_earned").notNull().default(0),
    issuedAt: date("issued_at").notNull(),
    downloadUrl: text("download_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_invoices_hotel_id").on(table.hotelId),
    stayIdx: index("idx_invoices_stay_id").on(table.stayId),
    issuedAtIdx: index("idx_invoices_issued_at").on(table.issuedAt)
  })
);

export const paymentLinks = pgTable(
  "payment_links",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    stayId: text("stay_id").references(() => stays.id, { onDelete: "set null" }),
    guestId: text("guest_id").references(() => guests.id, { onDelete: "set null" }),
    payerType: text("payer_type").notNull().default("guest"),
    payerName: text("payer_name"),
    payerEmail: text("payer_email"),
    payerPhone: text("payer_phone"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    reasonCategory: text("reason_category"),
    reasonText: text("reason_text"),
    pmsStatus: text("pms_status").notNull().default("not_configured"),
    paymentStatus: text("payment_status").notNull().default("created"),
    paymentProvider: text("payment_provider"),
    providerReference: text("provider_reference"),
    publicToken: text("public_token").notNull(),
    publicUrl: text("public_url").notNull(),
    createdByStaffUserId: text("created_by_staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_payment_links_hotel_id").on(table.hotelId),
    stayIdx: index("idx_payment_links_stay_id").on(table.stayId),
    guestIdx: index("idx_payment_links_guest_id").on(table.guestId),
    statusIdx: index("idx_payment_links_payment_status").on(table.hotelId, table.paymentStatus),
    createdAtIdx: index("idx_payment_links_created_at").on(table.hotelId, table.createdAt),
    publicTokenUnique: uniqueIndex("payment_links_public_token_unique").on(table.publicToken)
  })
);

// =============================================================================
// SERVICE CATALOG - Standardized Request Modules
// =============================================================================

export const serviceCategories = pgTable(
  "service_categories",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    department: text("department").notNull(),
    nameKey: text("name_key").notNull(),
    nameDefault: text("name_default").notNull(),
    descriptionKey: text("description_key"),
    descriptionDefault: text("description_default"),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelDeptIdx: index("idx_service_categories_hotel_dept").on(table.hotelId, table.department),
    activeIdx: index("idx_service_categories_active").on(table.hotelId, table.isActive)
  })
);

export const serviceItems = pgTable(
  "service_items",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => serviceCategories.id, { onDelete: "cascade" }),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    department: text("department").notNull(),
    nameKey: text("name_key").notNull(),
    nameDefault: text("name_default").notNull(),
    descriptionKey: text("description_key"),
    descriptionDefault: text("description_default"),
    icon: text("icon"),
    formFields: jsonb("form_fields").notNull().default([]),
    estimatedTimeMinutes: integer("estimated_time_minutes"),
    priceCents: integer("price_cents"),
    currency: text("currency").default("EUR"),
    autoAssignRole: text("auto_assign_role"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    requiresConfirmation: boolean("requires_confirmation").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    categoryIdx: index("idx_service_items_category").on(table.categoryId),
    hotelDeptIdx: index("idx_service_items_hotel_dept").on(table.hotelId, table.department),
    activeIdx: index("idx_service_items_active").on(table.hotelId, table.isActive)
  })
);

export const predefinedResponses = pgTable(
  "predefined_responses",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    department: text("department").notNull(),
    serviceItemId: text("service_item_id").references(() => serviceItems.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    contentKey: text("content_key").notNull(),
    contentDefault: text("content_default").notNull(),
    variables: text("variables").array().notNull().default(sql`ARRAY[]::text[]`),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelDeptIdx: index("idx_predefined_responses_hotel_dept").on(table.hotelId, table.department),
    serviceIdx: index("idx_predefined_responses_service").on(table.serviceItemId)
  })
);

export const messageMentions = pgTable(
  "message_mentions",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    mentionType: text("mention_type").notNull(), // 'staff' or 'department'
    staffUserId: text("staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    department: text("department"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    messageIdx: index("idx_message_mentions_message").on(table.messageId),
    staffIdx: index("idx_message_mentions_staff").on(table.staffUserId),
    deptIdx: index("idx_message_mentions_department").on(table.department)
  })
);

export const ticketMentions = pgTable(
  "ticket_mentions",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    mentionType: text("mention_type").notNull(),
    staffUserId: text("staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    department: text("department"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    ticketIdx: index("idx_ticket_mentions_ticket").on(table.ticketId),
    staffIdx: index("idx_ticket_mentions_staff").on(table.staffUserId)
  })
);

export const translations = pgTable(
  "translations",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    locale: text("locale").notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelKeyIdx: index("idx_translations_hotel_key").on(table.hotelId, table.key),
    localeIdx: index("idx_translations_locale").on(table.hotelId, table.locale),
    uniqueTranslation: uniqueIndex("translations_hotel_key_locale_unique").on(table.hotelId, table.key, table.locale)
  })
);

export const guestContentConfigs = pgTable(
  "guest_content_configs",
  {
    hotelId: text("hotel_id")
      .primaryKey()
      .references(() => hotels.id, { onDelete: "cascade" }),
    content: jsonb("content").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_guest_content_configs_hotel_id").on(table.hotelId)
  })
);

export const staffActivityLog = pgTable(
  "staff_activity_log",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    staffUserId: text("staff_user_id")
      .notNull()
      .references(() => staffUsers.id, { onDelete: "cascade" }),
    department: text("department").notNull(),
    actionType: text("action_type").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_staff_activity_log_hotel").on(table.hotelId, table.createdAt),
    staffIdx: index("idx_staff_activity_log_staff").on(table.staffUserId, table.createdAt),
    deptIdx: index("idx_staff_activity_log_department").on(table.hotelId, table.department, table.createdAt)
  })
);

export const roomImages = pgTable(
  "room_images",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    category: text("category").notNull().default("room"),
    title: text("title"),
    description: text("description"),
    imageUrl: text("image_url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    roomType: text("room_type"),
    roomNumbers: text("room_numbers").array(),
    createdByStaffUserId: text("created_by_staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_room_images_hotel_id").on(table.hotelId),
    categoryIdx: index("idx_room_images_category").on(table.hotelId, table.category),
    isActiveIdx: index("idx_room_images_is_active").on(table.hotelId, table.isActive),
    sortOrderIdx: index("idx_room_images_sort_order").on(table.hotelId, table.sortOrder),
    roomNumbersIdx: index("idx_room_images_room_numbers").on(table.hotelId, table.roomNumbers)
  })
);

export const experienceSections = pgTable(
  "experience_sections",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(), // 'tailored', 'culinary', 'activities'
    titleFr: text("title_fr").notNull(),
    titleEn: text("title_en").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_experience_sections_hotel").on(table.hotelId),
    hotelSlugUnique: uniqueIndex("experience_sections_hotel_slug_unique").on(table.hotelId, table.slug)
  })
);

export const usefulInfoCategories = pgTable(
  "useful_info_categories",
  {
    id: text("id").primaryKey(),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    hotelIdx: index("idx_useful_info_categories_hotel").on(table.hotelId),
    activeIdx: index("idx_useful_info_categories_active").on(table.hotelId, table.isActive)
  })
);

export const usefulInfoItems = pgTable(
  "useful_info_items",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => usefulInfoCategories.id, { onDelete: "cascade" }),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    categoryIdx: index("idx_useful_info_items_category").on(table.categoryId),
    hotelIdx: index("idx_useful_info_items_hotel").on(table.hotelId),
    activeIdx: index("idx_useful_info_items_active").on(table.hotelId, table.isActive)
  })
);

export const experienceItems = pgTable(
  "experience_items",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => experienceSections.id, { onDelete: "cascade" }),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    imageUrl: text("image_url").notNull(),
    linkUrl: text("link_url"),
    type: text("type").notNull().default("default"), // 'default' | 'restaurant'
    restaurantConfig: jsonb("restaurant_config").notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    sectionIdx: index("idx_experience_items_section").on(table.sectionId),
    hotelIdx: index("idx_experience_items_hotel").on(table.hotelId),
    typeIdx: index("idx_experience_items_type").on(table.hotelId, table.type)
  })
);
