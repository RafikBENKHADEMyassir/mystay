export type GuestContent = {
  navigation: {
    appName: string;
    drawerTitle: string;
    home: string;
    services: string;
    messages: string;
    profile: string;
    operations: string;
    analytics: string;
    logout: string;
    signIn: string;
    guestSectionTitle: string;
    operationsSectionTitle: string;
    sidebarSubtitle: string;
    versionLabel: string;
    welcomeBack: string;
    quickActionsTitle: string;
    quickActionDigitalKey: string;
    quickActionAgenda: string;
    quickActionContactHotel: string;
    settingsLabel: string;
    backAriaLabel: string;
    closeAriaLabel: string;
    sessionSummaryTemplate: string;
    noSessionSummary: string;
    wifiButtonLabel: string;
    wifiButtonAriaLabel: string;
    keyButtonLabel: string;
    keyButtonAriaLabel: string;
    notificationsAriaLabel: string;
  };
  common: {
    startCheckIn: string;
    signInToAccessServices: string;
    signInToAccessRestaurants: string;
    signInToAccessSpaGym: string;
    signInToAccessRoomService: string;
    currencySymbol: string;
    minutesLabel: string;
    availabilityCard: {
      currentlyAvailableTo: string;
      chat: string;
      availability: string;
      from: string;
      to: string;
      openingFrom: string;
      openingTo: string;
    };
  };
  pages: {
    auth: {
      login: {
        topbarTitle: string;
        title: string;
        subtitle: string;
        emailLabel: string;
        emailPlaceholder: string;
        passwordLabel: string;
        passwordPlaceholder: string;
        help: string;
        signIn: string;
        noAccount: string;
        signUp: string;
        loadingLabel: string;
        required: string;
        invalidCredentials: string;
        unexpectedError: string;
        fallbackHotelName: string;
      };
      signup: {
        topbarTitle: string;
        profileTitle: string;
        profileCardTitle: string;
        firstNameLabel: string;
        lastNameLabel: string;
        emailLabel: string;
        emailPlaceholder: string;
        phoneLabel: string;
        phonePlaceholder: string;
        defaultPhoneCountryCode: string;
        phoneCountryCodes: string[];
        continueAction: string;
        passwordTitle: string;
        passwordLabel: string;
        confirmPasswordLabel: string;
        passwordPlaceholder: string;
        passwordRuleTitle: string;
        passwordRules: {
          length: string;
          upper: string;
          special: string;
        };
        createdTitle: string;
        nextStep: string;
        linkTitle: string;
        linkSubtitle: string;
        confirmationLabel: string;
        confirmationPlaceholder: string;
        linkHint: string;
        contactSupport: string;
        confirmAction: string;
        welcomeTitle: string;
        welcomeSubtitle: string;
        doCheckIn: string;
        alreadyAccount: string;
        signIn: string;
        loadingLabel: string;
        required: string;
        invalidEmail: string;
        invalidPhone: string;
        passwordMismatch: string;
        passwordTooWeak: string;
        emailExists: string;
        reservationNotFound: string;
        reservationLinked: string;
        unexpectedError: string;
        fallbackHotelName: string;
      };
      forgotPassword: {
        title: string;
        forgotPassword: string;
        forgotEmail: string;
        contact: string;
      };
      linkReservation: {
        topbarTitle: string;
        title: string;
        subtitle: string;
        confirmationLabel: string;
        confirmationPlaceholder: string;
        linkAction: string;
        skip: string;
        noReservation: string;
        exploreHotels: string;
        loadingLabel: string;
        required: string;
        notFound: string;
        unexpectedError: string;
        fallbackHotelName: string;
      };
    };
    home: {
      firstScreen: {
        title: string;
        subtitle: string;
        noAccount: string;
        setup: string;
        login: string;
      };
      noReservation: {
        title: string;
        description: string;
        linkReservation: string;
        explore: string;
      };
      overview: {
        roomKey: string;
        greeting: string;
        quickActions: {
          upgradeRoom: string;
          roomService: string;
          housekeeping: string;
        };
        viewAgenda: string;
        anotherTime: string;
        see: string;
        invitesYou: string;
        previousDayAria: string;
        nextDayAria: string;
        roomNumberPrefix: string;
        roomImageAlt: string;
        guestFallback: string;
        upsellsUnavailable: string;
        noUpsellsConfigured: string;
      };
    };
    checkIn: {
      topbarTitle: string;
      hotelNameFallback: string;
      personalTitle: string;
      identityTitle: string;
      finalizeTitle: string;
      paymentTitle: string;
      paymentSubtitle: string;
      confirmPaymentMethod: string;
      interfaceLanguage: string;
      localeNames: {
        en: string;
        fr: string;
        es: string;
      };
      stayReason: string;
      reasonPersonal: string;
      reasonBusiness: string;
      yourInfo: string;
      firstName: string;
      lastName: string;
      email: string;
      emailFallback: string;
      phone: string;
      defaultPhoneCountryCode: string;
      phoneFallback: string;
      gender: string;
      genderMale: string;
      genderFemale: string;
      genderNonBinary: string;
      validate: string;
      idLabel: string;
      uploadHint: string;
      removeFileAria: string;
      accepted: string;
      maxFiles: string;
      maxSize: string;
      readable: string;
      summaryTitle: string;
      addSomething: string;
      details: string;
      total: string;
      confirmPay: string;
      free: string;
      required: string;
      sessionError: string;
      validation: {
        invalidField: string;
        invalidEmail: string;
        invalidPhone: string;
        selectGender: string;
        invalidCardNumber: string;
        invalidCardExpiry: string;
        invalidCardCvc: string;
        invalidFileType: string;
        fileTooLarge: string;
        fixFields: string;
      };
      submitErrors: {
        unauthorized: string;
        pmsUnavailable: string;
        couldNotComplete: string;
        serviceUnavailable: string;
      };
      paymentFields: {
        cardNameLabel: string;
        cardNamePlaceholder: string;
        cardNumberLabel: string;
        cardNumberPlaceholder: string;
        cardExpiryLabel: string;
        cardExpiryPlaceholder: string;
        cardCvcLabel: string;
        cardCvcPlaceholder: string;
        submit: string;
      };
      baseLineItems: Array<{
        id: string;
        label: string;
        amountCents: number;
      }>;
      extrasCatalog: Array<{
        id: string;
        label: string;
        priceCents: number;
      }>;
    };
    checkOut: {
      title: string;
      yourCheckout: string;
      roomLabel: string;
      roomNameFallback: string;
      checkInLabel: string;
      checkOutLabel: string;
      checkInTime: string;
      checkOutTime: string;
      detailsTitle: string;
      noExtras: string;
      totalExtras: string;
      tipLabel: string;
      totalLabel: string;
      tipTitle: string;
      percent5: string;
      percent10: string;
      percent15: string;
      customize: string;
      enterAmount: string;
      back: string;
      validate: string;
      confirmPay: string;
      thanks: string;
      removeTip: string;
      viewInvoices: string;
      loadingLabel: string;
      confirmingLabel: string;
      errors: {
        couldNotLoad: string;
        couldNotConfirm: string;
        serviceUnavailable: string;
      };
    };
    pay: {
      notAvailableTitle: string;
      notAvailableDescription: string;
      completePaymentTitle: string;
      paymentRequestFallback: string;
      paymentCompleted: string;
      errorPrefix: string;
      statusPrefix: string;
      statusPaid: string;
      statusExpired: string;
      statusCreated: string;
      actionAlreadyPaid: string;
      actionExpired: string;
      actionPayNow: string;
    };
    services: {
      title: string;
      transportBadge: string;
      transportBookedMessage: string;
      welcomeBadge: string;
      welcomeMessage: string;
      checkInBadge: string;
      checkInMessage: string;
      historyAriaLabel: string;
      cards: Array<{
        id: string;
        title: string;
        href: string;
        chatHref: string;
        backgroundImage: string;
      }>;
      catalog: {
        couldNotLoadCategories: string;
        couldNotLoadItems: string;
        fallbackLoadError: string;
        retry: string;
        noServicesAvailable: string;
        otherRequestTitle: string;
        otherRequestDescription: string;
        roomNumberRequired: string;
        submitFailed: string;
        networkError: string;
        estimatedMinutesTemplate: string;
      };
      requestForm: {
        noAdditionalOptions: string;
        submit: string;
        submitting: string;
        estimatedMinutesTemplate: string;
      };
      requestDialog: {
        successTitle: string;
        successMessage: string;
        referenceLabel: string;
        estimatedTimeTemplate: string;
        done: string;
        errorTitle: string;
        cancel: string;
        retry: string;
        fallbackUnexpectedError: string;
      };
      widgets: {
        orderTracking: {
          title: string;
          orderIdPrefix: string;
          live: string;
          statuses: {
            pending: string;
            preparing: string;
            delivering: string;
            completed: string;
            cancelled: string;
          };
          updatedPrefix: string;
          statusCompleted: string;
          cancelledMessage: string;
        };
        tipDialog: {
          leaveATip: string;
          dialogTitle: string;
          dialogDescriptionTemplate: string;
          selectAmount: string;
          customAmount: string;
          customPlaceholder: string;
          tipAmount: string;
          cancel: string;
          sendTip: string;
          processing: string;
          invalidAmount: string;
          tipFailed: string;
          unexpectedError: string;
        };
      };
    };
    reception: {
      heroImage: string;
      title: string;
      signInToAccess: string;
      resumeConversation: string;
      conversationPreview: string;
      activeRequests: string;
      checkInComplete: string;
      roomLabel: string;
      errors: {
        submitRequest: string;
        serviceUnavailable: string;
      };
      ticketStatus: {
        pending: string;
        inProgress: string;
        resolved: string;
      };
      quickActions: Array<{
        id: string;
        label: string;
        icon: string;
        href?: string;
        action?: string;
        requestTitle?: string;
      }>;
    };
    housekeeping: {
      heroImage: string;
      title: string;
      signInToAccess: string;
      quickRequestsTitle: string;
      activeRequests: string;
      cleaningPrompt: string;
      yesLabel: string;
      noLabel: string;
      composerPlaceholder: string;
      errors: {
        submitRequest: string;
        sendMessage: string;
        serviceUnavailable: string;
      };
      ticketStatus: {
        pending: string;
        inProgress: string;
        resolved: string;
      };
      quickItems: Array<{
        id: string;
        label: string;
        icon: string;
      }>;
    };
    messages: {
      title: string;
      intro: string;
      connect: string;
      refresh: string;
      newChat: string;
      noThreads: string;
      loading: string;
      hotelFallback: string;
      errors: {
        offline: string;
        loadThreads: string;
        createThread: string;
        backendUnreachable: string;
        connectStayFirst: string;
        threadNotFound: string;
        loadMessages: string;
        sendMessagePrefix: string;
      };
      departments: Array<{
        id: string;
        label: string;
      }>;
      thread: {
        staffFallback: string;
        writePlaceholder: string;
        removeAttachmentAria: string;
        addAttachmentAria: string;
        quickActionAria: string;
        sendAria: string;
        sendErrorHint: string;
        translateAction: string;
      };
    };
    concierge: {
      heroImage: string;
      title: string;
      errors: {
        createConversation: string;
        sendMessage: string;
        serviceUnavailable: string;
      };
      resumeConversation: string;
      viewFullConversation: string;
      activeRequests: string;
      ticketStatus: {
        inProgress: string;
        resolved: string;
        pending: string;
      };
      tipPrompt: string;
      leaveTip: string;
      composerPlaceholder: string;
      quickActions: Array<{ id: string; label: string }>;
    };
    roomService: {
      heroImage: string;
      title: string;
      orderTitlePrefix: string;
      orderButton: string;
      errors: {
        couldNotPlaceOrder: string;
        serviceUnavailable: string;
      };
      activeOrders: string;
      ticketStatus: {
        inProgress: string;
        resolved: string;
        pending: string;
      };
      categories: Array<{ id: string; label: string }>;
      menuItems: Array<{
        id: string;
        name: string;
        description?: string;
        price: number;
        category: string;
        image?: string;
        tags?: string[];
      }>;
      itemCount: string;
      placingOrder: string;
      placeOrder: string;
    };
    restaurants: {
      heroImage: string;
      title: string;
      experiencesTitle: string;
      bookTable: string;
      restaurants: Array<{
        id: string;
        name: string;
        cuisine: string;
        description: string;
        image: string;
        hours: string;
        dressCode?: string;
      }>;
    };
    spaGym: {
      heroImage: string;
      title: string;
      tabs: {
        spa: string;
        gym: string;
      };
      yourBookings: string;
      dateTimeSeparator: string;
      bookingStatus: {
        confirmed: string;
        pending: string;
      };
      sectionTitles: {
        spa: string;
        gym: string;
      };
      chooseTimeSlot: string;
      bookingLoading: string;
      bookingAction: string;
      errors: {
        couldNotBook: string;
        serviceUnavailable: string;
      };
      services: Array<{
        id: string;
        name: string;
        description: string;
        duration: number;
        price: number;
        category: "spa" | "gym";
        image?: string;
      }>;
      timeSlots: string[];
    };
    hotels: {
      title: string;
      description: string;
      searchPlaceholder: string;
      featuredSection: string;
      allPropertiesSection: string;
      viewDetails: string;
      featuredBadge: string;
      noResultsTitle: string;
      noResultsDescription: string;
      featuredCount: number;
      amenities: {
        wifi: string;
        restaurant: string;
        gym: string;
        spa: string;
        pool: string;
      };
    };
    room: {
      title: string;
      tailored: string;
      completeCheckIn: string;
      suiteNameTemplate: string;
      labels: {
        room: string;
        adults: string;
        child: string;
        checkIn: string;
        checkOut: string;
        reservation: string;
        stayHistory: string;
        lateCheckout: string;
        contactReception: string;
      };
      quickActions: Array<{
        id: string;
        label: string;
        href: string;
      }>;
      promoCards: Array<{
        id: string;
        title: string;
        subtitle: string;
        cta: string;
        href: string;
        image: string;
      }>;
      upgrade: {
        title: string;
        subtitle: string;
        cta: string;
        href: string;
        image: string;
      };
      upsellsTitle: string;
      upsells: Array<{
        id: string;
        title: string;
        image: string;
        href: string;
      }>;
      fallbackHeroImages: string[];
    };
    agenda: {
      title: string;
      description: string;
      refresh: string;
      refreshing: string;
      messageStaff: string;
      startCheckIn: string;
      guestCalendarTitle: string;
      guestCalendarBadge: string;
      guestCalendarDescription: string;
      connectStay: string;
      loading: string;
      noItems: string;
      roomLabel: string;
      errors: {
        loadAgenda: string;
        backendUnreachable: string;
      };
      notifications: {
        title: string;
        description: string;
        preEventTitle: string;
        preEventText: string;
        servicePrepTitle: string;
        servicePrepText: string;
      };
    };
    analytics: {
      title: string;
      description: string;
      refresh: string;
      refreshing: string;
      startCheckIn: string;
      performanceTitle: string;
      performanceBadge: string;
      performanceDescription: string;
      connectStay: string;
      loading: string;
      ticketsLabel: string;
      pendingSuffix: string;
      inProgressSuffix: string;
      threadsLabel: string;
      threadsSubtitle: string;
      revenueLabel: string;
      pointsTemplate: string;
      upcomingEventsLabel: string;
      generatedTemplate: string;
      errors: {
        loadAnalytics: string;
        backendUnreachable: string;
      };
      health: {
        title: string;
        description: string;
        capacityTitle: string;
        capacityText: string;
        forecastsTitle: string;
        forecastsText: string;
      };
    };
    profile: {
      title: string;
      description: string;
      refresh: string;
      refreshing: string;
      changeReservation: string;
      startCheckIn: string;
      roomLabel: string;
      guestIdentityTitle: string;
      guestIdentityBadge: string;
      guestIdentityDescription: string;
      connectStay: string;
      loading: string;
      noInvoices: string;
      loyaltyPointsTemplate: string;
      invoiceDownloadAria: string;
      errors: {
        loadInvoices: string;
        backendUnreachable: string;
      };
      payments: {
        title: string;
        description: string;
        paymentMethodsTitle: string;
        paymentMethodsText: string;
        alertsTitle: string;
        alertsText: string;
        localizationTitle: string;
        localizationText: string;
      };
    };
    operations: {
      title: string;
      description: string;
      configureRoles: string;
      createWorkflow: string;
      departmentConsolesTitle: string;
      departmentConsolesBadge: string;
      departmentConsolesDescription: string;
      departmentBullets: string[];
      governanceTitle: string;
      governanceDescription: string;
      complianceTitle: string;
      complianceText: string;
      workflowsTitle: string;
      workflowsText: string;
    };
  };
};

export function interpolateTemplate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, token) => {
    const value = vars[token];
    return value == null ? "" : String(value);
  });
}
