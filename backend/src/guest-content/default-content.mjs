const localeCodes = ["en", "fr", "es"];

function text(en, fr, es) {
  return { en, fr, es };
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isLocalizedText(value) {
  if (!isPlainObject(value)) return false;
  return localeCodes.every((code) => typeof value[code] === "string") && Object.keys(value).length === localeCodes.length;
}

function deepMerge(base, override) {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override.map((item) => deepMerge(undefined, item)) : base.map((item) => deepMerge(undefined, item));
  }

  if (isPlainObject(base)) {
    const output = {};
    const sourceOverride = isPlainObject(override) ? override : {};
    for (const key of Object.keys(base)) {
      output[key] = deepMerge(base[key], sourceOverride[key]);
    }
    for (const key of Object.keys(sourceOverride)) {
      if (!(key in output)) {
        output[key] = deepMerge(undefined, sourceOverride[key]);
      }
    }
    return output;
  }

  if (override === undefined) return base;
  if (Array.isArray(override)) return override.map((item) => deepMerge(undefined, item));
  if (isPlainObject(override)) {
    const output = {};
    for (const key of Object.keys(override)) output[key] = deepMerge(undefined, override[key]);
    return output;
  }
  return override;
}

function localizeNode(value, locale) {
  if (Array.isArray(value)) return value.map((entry) => localizeNode(entry, locale));
  if (!isPlainObject(value)) return value;
  if (isLocalizedText(value)) return value[locale] ?? value.en;

  const output = {};
  for (const [key, nested] of Object.entries(value)) {
    output[key] = localizeNode(nested, locale);
  }
  return output;
}

export const defaultGuestContent = {
  navigation: {
    appName: text("MyStay", "MyStay", "MyStay"),
    drawerTitle: text("MyStay Services", "Services MyStay", "Servicios MyStay"),
    home: text("Home", "Accueil", "Inicio"),
    services: text("Services", "Services", "Servicios"),
    messages: text("Messages", "Messages", "Mensajes"),
    profile: text("Profile", "Profil", "Perfil"),
    operations: text("Operations", "Operations", "Operaciones"),
    analytics: text("Analytics", "Analytics", "Analitica"),
    logout: text("Logout", "Se deconnecter", "Cerrar sesion"),
    signIn: text("Sign in", "Se connecter", "Iniciar sesion"),
    guestSectionTitle: text("Guest experience", "Experience client", "Experiencia del huesped"),
    operationsSectionTitle: text("Ops & analytics", "Operations & analytics", "Operaciones y analitica"),
    sidebarSubtitle: text("PWA + Staff Console", "PWA + Console staff", "PWA + Consola staff"),
    versionLabel: text("v0.1", "v0.1", "v0.1"),
    welcomeBack: text("Welcome back", "Bon retour", "Bienvenido de nuevo"),
    quickActionsTitle: text("Quick Actions", "Actions rapides", "Acciones rapidas"),
    quickActionDigitalKey: text("Digital Key", "Cle digitale", "Llave digital"),
    quickActionAgenda: text("My Agenda", "Mon agenda", "Mi agenda"),
    quickActionContactHotel: text("Contact Hotel", "Contacter l'hotel", "Contactar hotel"),
    settingsLabel: text("Settings", "Parametres", "Configuracion"),
    backAriaLabel: text("Back", "Retour", "Volver"),
    closeAriaLabel: text("Close", "Fermer", "Cerrar"),
    sessionSummaryTemplate: text(
      "Room {{roomNumber}} · Confirmation {{confirmationNumber}}",
      "Chambre {{roomNumber}} · Confirmation {{confirmationNumber}}",
      "Habitacion {{roomNumber}} · Confirmacion {{confirmationNumber}}"
    ),
    noSessionSummary: text(
      "Unified guest and staff journeys",
      "Parcours clients et staff unifies",
      "Recorridos unificados para huespedes y staff"
    ),
    wifiButtonLabel: text("Wi-Fi", "Wi-Fi", "Wi-Fi"),
    wifiButtonAriaLabel: text("Open Wi-Fi details", "Ouvrir les details Wi-Fi", "Abrir detalles de Wi-Fi"),
    keyButtonLabel: text("Key", "Cle", "Llave"),
    keyButtonAriaLabel: text("Open digital key", "Ouvrir la cle digitale", "Abrir llave digital"),
    notificationsAriaLabel: text("Notifications", "Notifications", "Notificaciones")
  },
  common: {
    startCheckIn: text("Start check-in", "Commencer le check-in", "Comenzar check-in"),
    signInToAccessServices: text(
      "Sign in to access services.",
      "Connectez-vous pour acceder aux services.",
      "Inicia sesion para acceder a los servicios."
    ),
    signInToAccessRestaurants: text(
      "Sign in to access restaurants.",
      "Connectez-vous pour acceder aux restaurants.",
      "Inicia sesion para acceder a los restaurantes."
    ),
    signInToAccessSpaGym: text(
      "Sign in to access Spa & Gym.",
      "Connectez-vous pour acceder au Spa & Gym.",
      "Inicia sesion para acceder a Spa y Gym."
    ),
    signInToAccessRoomService: text(
      "Sign in to access room service.",
      "Connectez-vous pour acceder au room service.",
      "Inicia sesion para acceder al room service."
    ),
    currencySymbol: text("EUR", "EUR", "EUR"),
    minutesLabel: text("min", "min", "min"),
    availabilityCard: {
      currentlyAvailableTo: text("Currently available to", "Actuellement disponible pour", "Disponible ahora para"),
      chat: text("chat.", "echanger.", "chatear."),
      availability: text("Availability", "Disponibilites", "Disponibilidad"),
      from: text("From", "De", "De"),
      to: text("to", "a", "a"),
      openingFrom: text("6h", "6h", "6h"),
      openingTo: text("23h", "23h", "23h")
    }
  },
  pages: {
    auth: {
      login: {
        topbarTitle: text("Sign In", "Connexion", "Iniciar sesion"),
        title: text("Sign in to your space", "Connexion a votre espace", "Inicia sesion en tu espacio"),
        subtitle: text("Enter your credentials", "Entrez vos identifiants", "Ingresa tus credenciales"),
        emailLabel: text("Email address", "Adresse e-mail", "Correo electronico"),
        emailPlaceholder: text("example@email.com", "exemple@email.com", "ejemplo@email.com"),
        passwordLabel: text("Password", "Mot de passe", "Contrasena"),
        passwordPlaceholder: text("********", "********", "********"),
        help: text("Need help?", "Besoin d'aide ?", "Necesitas ayuda?"),
        signIn: text("Sign In", "Je me connecte", "Iniciar sesion"),
        noAccount: text("Don't have an account?", "Vous n'avez pas de compte ?", "No tienes cuenta?"),
        signUp: text("Create account", "Creer un compte", "Crear cuenta"),
        loadingLabel: text("...", "...", "..."),
        required: text("This field is required", "Ce champ est requis", "Este campo es obligatorio"),
        invalidCredentials: text(
          "Invalid email or password",
          "Les identifiants sont incorrects.",
          "Correo o contrasena incorrectos."
        ),
        unexpectedError: text(
          "An unexpected error occurred",
          "Une erreur inattendue s'est produite",
          "Ocurrio un error inesperado"
        ),
        fallbackHotelName: text("Hotel", "Hotel", "Hotel")
      },
      signup: {
        topbarTitle: text("Sign Up", "Inscription", "Registro"),
        profileTitle: text("Sign up", "Inscription", "Registro"),
        profileCardTitle: text("Your information", "Vos informations", "Tu informacion"),
        firstNameLabel: text("First name", "Prenom", "Nombre"),
        lastNameLabel: text("Last name", "Nom de famille", "Apellido"),
        emailLabel: text("Email address", "Adresse e-mail", "Correo electronico"),
        emailPlaceholder: text("example@email.com", "exemple@email.com", "ejemplo@email.com"),
        phoneLabel: text("Phone", "Telephone", "Telefono"),
        phonePlaceholder: text("Phone", "Telephone", "Telefono"),
        defaultPhoneCountryCode: "+33",
        phoneCountryCodes: ["+33", "+1", "+44"],
        continueAction: text("Continue", "Valider", "Continuar"),
        passwordTitle: text("Choose your password", "Choisissez votre mot de passe", "Elige tu contrasena"),
        passwordLabel: text("Password", "Mot de passe", "Contrasena"),
        confirmPasswordLabel: text("Repeat your password", "Repetez votre mot de passe", "Repite tu contrasena"),
        passwordPlaceholder: text("********", "********", "********"),
        passwordRuleTitle: text(
          "Your password must include at least:",
          "Votre mot de passe doit contenir au moins :",
          "Tu contrasena debe incluir al menos:"
        ),
        passwordRules: {
          length: text("8 characters", "8 caracteres minimum", "8 caracteres"),
          upper: text("One uppercase letter", "Une majuscule", "Una mayuscula"),
          special: text("One special character", "Un caractere special", "Un caracter especial")
        },
        createdTitle: text("Your account has been created.", "Votre compte a bien ete cree.", "Tu cuenta ha sido creada."),
        nextStep: text("Next step", "Passer a l'etape suivante", "Siguiente paso"),
        linkTitle: text("Attach your account to your hotel", "Rattachez votre compte a votre hotel", "Vincula tu cuenta a tu hotel"),
        linkSubtitle: text("Then we'll take care of the rest.", "Ensuite, nous nous occupons du reste.", "Luego nos encargamos del resto."),
        confirmationLabel: text(
          "Your reservation confirmation number",
          "Votre numero de confirmation de reservation",
          "Tu numero de confirmacion de reserva"
        ),
        confirmationPlaceholder: text("01234 56789", "01234 56789", "01234 56789"),
        linkHint: text(
          "You received your reservation number by email when booking.\nDidn't receive it?",
          "Vous avez recu votre numero de reservation par mail lors de la reservation.\nVous ne l'avez pas recu ?",
          "Recibiste tu numero de reserva por correo al reservar.\nNo lo recibiste?"
        ),
        contactSupport: text("Contact support", "Contacter l'assistance", "Contactar soporte"),
        confirmAction: text("Confirm", "Confirmer", "Confirmar"),
        welcomeTitle: text("Your hotel welcomes you.", "Votre hotel vous souhaite la bienvenue.", "Tu hotel te da la bienvenida."),
        welcomeSubtitle: text(
          "You can now complete your check-in.",
          "Vous pouvez maintenant realiser votre check-in.",
          "Ahora puedes completar tu check-in."
        ),
        doCheckIn: text("Complete my check-in", "Je realise mon check-in", "Completar mi check-in"),
        alreadyAccount: text("Already have an account?", "Vous avez deja un compte ?", "Ya tienes cuenta?"),
        signIn: text("Sign in", "Se connecter", "Iniciar sesion"),
        loadingLabel: text("...", "...", "..."),
        required: text("This field is required.", "Ce champ est requis.", "Este campo es obligatorio."),
        invalidEmail: text("Invalid email address.", "Adresse e-mail invalide.", "Correo electronico invalido."),
        invalidPhone: text("Invalid phone number.", "Numero de telephone invalide.", "Numero de telefono invalido."),
        passwordMismatch: text("Passwords do not match.", "Les mots de passe ne correspondent pas.", "Las contrasenas no coinciden."),
        passwordTooWeak: text("Password is too weak.", "Mot de passe trop faible.", "La contrasena es demasiado debil."),
        emailExists: text("An account with this email already exists.", "Un compte avec cet e-mail existe deja.", "Ya existe una cuenta con este correo."),
        reservationNotFound: text("No reservation found with this number.", "Aucune reservation trouvee avec ce numero.", "No se encontro reserva con este numero."),
        reservationLinked: text("This reservation is already linked.", "Cette reservation est deja liee.", "Esta reserva ya esta vinculada."),
        unexpectedError: text("An unexpected error occurred.", "Une erreur inattendue s'est produite.", "Ocurrio un error inesperado."),
        fallbackHotelName: text("Hotel", "Hotel", "Hotel")
      },
      forgotPassword: {
        title: text("Need help?", "Besoin d'aide ?", "Necesitas ayuda?"),
        forgotPassword: text("I forgot my password", "J'ai oublie mon mot de passe", "Olvide mi contrasena"),
        forgotEmail: text("I forgot my email address", "J'ai oublie mon adresse e-mail", "Olvide mi correo electronico"),
        contact: text("Contact support", "Contacter l'assistance", "Contactar soporte")
      },
      linkReservation: {
        topbarTitle: text("Link Reservation", "Lier une reservation", "Vincular reserva"),
        title: text("Link your reservation", "Associez votre reservation", "Vincula tu reserva"),
        subtitle: text(
          "Enter your confirmation number to access your hotel services",
          "Entrez votre numero de confirmation pour acceder aux services de votre hotel",
          "Ingresa tu numero de confirmacion para acceder a los servicios del hotel"
        ),
        confirmationLabel: text("Confirmation number", "Numero de confirmation", "Numero de confirmacion"),
        confirmationPlaceholder: text("e.g. ABC123456", "Ex: ABC123456", "Ej: ABC123456"),
        linkAction: text("Link Reservation", "Lier la reservation", "Vincular reserva"),
        skip: text("Explore Hotels", "Explorer les hotels", "Explorar hoteles"),
        noReservation: text("No reservation yet?", "Pas encore de reservation ?", "Todavia no tienes reserva?"),
        exploreHotels: text("Discover our partner hotels", "Decouvrez nos hotels partenaires", "Descubre nuestros hoteles asociados"),
        loadingLabel: text("...", "...", "..."),
        required: text("This field is required", "Ce champ est requis", "Este campo es obligatorio"),
        notFound: text(
          "No reservation found with this number",
          "Aucune reservation trouvee avec ce numero",
          "No se encontro reserva con este numero"
        ),
        unexpectedError: text("An unexpected error occurred", "Une erreur inattendue s'est produite", "Ocurrio un error inesperado"),
        fallbackHotelName: text("Hotel", "Hotel", "Hotel")
      }
    },
    home: {
      firstScreen: {
        title: text("Welcome to your space", "Bienvenue sur votre espace", "Bienvenido a tu espacio"),
        subtitle: text(
          "Reach your hotel directly from your space.\nComplete your check-in, use a digital key, request room service, book experiences, and more.",
          "Votre hotel est directement joignable depuis votre espace.\nRealisez votre check-in, utilisez votre cle dematerialisee, faites appel au service de chambre, programmez des reservations et plus encore.",
          "Contacta tu hotel desde tu espacio.\nCompleta tu check-in, usa una llave digital, solicita room service, reserva experiencias y mas."
        ),
        noAccount: text("Don't have an account yet?", "Vous n'avez pas encore de compte configure ?", "Aun no tienes una cuenta configurada?"),
        setup: text("Set up my profile", "Je configure mon profil", "Configurar mi perfil"),
        login: text("Sign in", "Connexion", "Iniciar sesion")
      },
      noReservation: {
        title: text("No active reservation", "Pas de reservation active", "Sin reserva activa"),
        description: text(
          "Link a reservation to access all hotel services.",
          "Liez une reservation pour acceder a tous les services de votre hotel.",
          "Vincula una reserva para acceder a todos los servicios del hotel."
        ),
        linkReservation: text("Link a reservation", "Lier une reservation", "Vincular una reserva"),
        explore: text("Explore hotels", "Explorer les hotels", "Explorar hoteles")
      },
      overview: {
        roomKey: text("Room Key", "Cle de chambre", "Llave de habitacion"),
        greeting: text("Good day,", "Belle journee,", "Buen dia,"),
        quickActions: {
          upgradeRoom: text("Upgrade Room", "Upgrade Room", "Mejorar habitacion"),
          roomService: text("Room Service", "Room Service", "Room Service"),
          housekeeping: text("Housekeeping", "Housekeeping", "Housekeeping")
        },
        viewAgenda: text("View agenda", "Voir l'agenda", "Ver agenda"),
        anotherTime: text("Another time", "Une autre fois", "Otro momento"),
        see: text("See", "Voir", "Ver"),
        invitesYou: text("invites you", "vous invite", "te invita"),
        previousDayAria: text("Previous day", "Jour precedent", "Dia anterior"),
        nextDayAria: text("Next day", "Jour suivant", "Dia siguiente"),
        roomNumberPrefix: text("No", "No", "No"),
        roomImageAlt: text("Room", "Chambre", "Habitacion"),
        guestFallback: text("Guest", "Client", "Huesped"),
        upsellsUnavailable: text(
          "Upsells are temporarily unavailable.",
          "Upsells indisponibles pour le moment.",
          "Upsells no disponibles temporalmente."
        ),
        noUpsellsConfigured: text("No upsells configured yet.", "Aucun upsell configure.", "Aun no hay upsells configurados.")
      }
    },
    checkIn: {
      topbarTitle: text("Check-in", "Check-in", "Check-in"),
      hotelNameFallback: text("Four Seasons Hotel", "Hotel Four Seasons", "Hotel Four Seasons"),
      personalTitle: text("Personal information", "Informations personnelles", "Informacion personal"),
      identityTitle: text("ID document", "Justificatif d'identite", "Documento de identidad"),
      finalizeTitle: text("Finish your check-in", "Finalisez votre check-in", "Finaliza tu check-in"),
      paymentTitle: text("Online payment", "Paiement en ligne", "Pago en linea"),
      paymentSubtitle: text("Secure payment.", "Paiement securise.", "Pago seguro."),
      confirmPaymentMethod: text("Confirm your payment method", "Confirmez votre moyen de paiement", "Confirma tu metodo de pago"),
      interfaceLanguage: text("Interface language", "Langue de l'interface", "Idioma de la interfaz"),
      localeNames: {
        en: text("English", "English", "Ingles"),
        fr: text("Francais", "Francais", "Frances"),
        es: text("Espanol", "Espanol", "Espanol")
      },
      stayReason: text("Reason for your stay", "Raison de votre sejour", "Motivo de tu estancia"),
      reasonPersonal: text("Personal", "Personnel", "Personal"),
      reasonBusiness: text("Business", "Travail", "Trabajo"),
      yourInfo: text("Your details", "Vos informations", "Tus datos"),
      firstName: text("First name", "Prenom", "Nombre"),
      lastName: text("Last name", "Nom de famille", "Apellido"),
      email: text("Email address", "Adresse e-mail", "Correo electronico"),
      emailFallback: text("email@email.com", "email@email.com", "email@email.com"),
      phone: text("Phone", "Telephone", "Telefono"),
      defaultPhoneCountryCode: "+33",
      phoneFallback: text("1 23 45 67 89", "1 23 45 67 89", "1 23 45 67 89"),
      gender: text("You prefer to be identified as...", "Vous preferez etre identifie comme...", "Prefieres ser identificado como..."),
      genderMale: text("Male", "Homme", "Hombre"),
      genderFemale: text("Female", "Femme", "Mujer"),
      genderNonBinary: text("Non-binary", "Non-binaire", "No binario"),
      validate: text("Continue", "Valider", "Continuar"),
      idLabel: text("Identity document", "Piece d'identite", "Documento de identidad"),
      uploadHint: text("Drop your files...", "Deposez vos fichiers...", "Suelta tus archivos..."),
      removeFileAria: text("Remove file", "Supprimer le fichier", "Eliminar archivo"),
      accepted: text("Accepted files: PNG, JPG, or PDF", "Fichiers acceptes: PNG, JPG ou PDF", "Archivos aceptados: PNG, JPG o PDF"),
      maxFiles: text("Max. 2 files", "Max. 2 fichiers", "Max. 2 archivos"),
      maxSize: text("Max. 4MB per file", "Max. 4MB par fichier", "Max. 4MB por archivo"),
      readable: text("Your information must be readable", "Vos informations doivent etre lisibles", "La informacion debe ser legible"),
      summaryTitle: text("Summary", "Resume de vos informations", "Resumen"),
      addSomething: text(
        "Would you like to add anything else to your room?",
        "Voulez-vous ajouter quelque chose d'autre a votre chambre ?",
        "Quieres agregar algo mas a tu habitacion?"
      ),
      details: text("Details", "Details", "Detalles"),
      total: text("Total", "Total", "Total"),
      confirmPay: text("Confirm and pay", "Confirmer et payer", "Confirmar y pagar"),
      free: text("Free", "Gratuit", "Gratis"),
      required: text("This field is required.", "Ce champ est requis.", "Este campo es obligatorio."),
      sessionError: text(
        "Backend unreachable. Start `npm run dev:backend` to enable demo mode.",
        "Backend indisponible. Lancez `npm run dev:backend` pour activer le mode demo.",
        "Backend inaccesible. Inicia `npm run dev:backend` para activar el modo demo."
      ),
      validation: {
        invalidField: text("Invalid field.", "Champ invalide.", "Campo invalido."),
        invalidEmail: text("Invalid email address.", "Adresse e-mail invalide.", "Correo electronico invalido."),
        invalidPhone: text("Invalid phone number.", "Numero de telephone invalide.", "Numero de telefono invalido."),
        selectGender: text("Please select an option.", "Veuillez selectionner une option.", "Selecciona una opcion."),
        invalidCardNumber: text("Invalid card number.", "Numero de carte invalide.", "Numero de tarjeta invalido."),
        invalidCardExpiry: text("Invalid expiry date.", "Date d'expiration invalide.", "Fecha de expiracion invalida."),
        invalidCardCvc: text("Invalid CVC.", "Cryptogramme invalide.", "CVC invalido."),
        invalidFileType: text(
          "Unsupported file type (PNG, JPG, or PDF).",
          "Format de fichier non supporte (PNG, JPG ou PDF).",
          "Formato de archivo no compatible (PNG, JPG o PDF)."
        ),
        fileTooLarge: text("File too large (max 4MB).", "Fichier trop volumineux (max 4MB).", "Archivo demasiado grande (max 4MB)."),
        fixFields: text("Please review the fields.", "Veuillez verifier les champs.", "Revisa los campos.")
      },
      submitErrors: {
        unauthorized: text(
          "Please sign in to complete check-in.",
          "Veuillez vous connecter pour finaliser votre check-in.",
          "Inicia sesion para completar el check-in."
        ),
        pmsUnavailable: text("PMS unavailable. Try again later.", "PMS indisponible. Reessayez plus tard.", "PMS no disponible. Intenta mas tarde."),
        couldNotComplete: text("Could not complete check-in.", "Impossible de finaliser le check-in.", "No se pudo completar el check-in."),
        serviceUnavailable: text("Service unavailable.", "Service indisponible.", "Servicio no disponible.")
      },
      paymentFields: {
        cardNameLabel: text("Name on card", "Nom sur la carte", "Nombre en la tarjeta"),
        cardNamePlaceholder: text("Full name", "Nom Prenom", "Nombre completo"),
        cardNumberLabel: text("Card number", "Numero de carte", "Numero de tarjeta"),
        cardNumberPlaceholder: text("1234 1234 1234 1234", "1234 1234 1234 1234", "1234 1234 1234 1234"),
        cardExpiryLabel: text("Expiry date", "Date d'expiration", "Fecha de expiracion"),
        cardExpiryPlaceholder: text("MM/AA", "MM/AA", "MM/AA"),
        cardCvcLabel: text("CVC", "Cryptogramme visuel", "CVC"),
        cardCvcPlaceholder: text("...", "...", "..."),
        submit: text("Validate", "Valider", "Validar")
      },
      baseLineItems: [
        { id: "room", label: text("Sea View Suite", "Suite vue mer", "Suite vista mar"), amountCents: 120000 },
        { id: "breakfast", label: text("Breakfast x2", "Petits dejeuners x2", "Desayuno x2"), amountCents: 20000 }
      ],
      extrasCatalog: [
        { id: "baby_bed", label: text("Baby bed", "Lit bebe", "Cuna"), priceCents: 0 },
        { id: "extra_bed", label: text("Extra bed", "Lit supplementaire", "Cama extra"), priceCents: 20000 },
        { id: "flowers", label: text("Flowers", "Fleurs", "Flores"), priceCents: 20000 }
      ],
      signature: {
        title: text("Sign registration form", "Signer le formulaire d'enregistrement", "Firmar el formulario de registro"),
        subtitle: text("Draw your signature on the screen", "Dessinez votre signature sur l'ecran", "Dibuja tu firma en la pantalla"),
        clear: text("Clear", "Effacer", "Borrar"),
        continue: text("Continue", "Continuer", "Continuar"),
        required: text("Please sign above to continue.", "Veuillez signer ci-dessus pour continuer.", "Firma arriba para continuar.")
      },
      paymentSuccess: {
        title: text("Your payment has been received!", "Votre paiement a bien ete recu !", "Su pago ha sido recibido!"),
        description: text(
          "We wish you a pleasant stay and are at your disposal from the platform.",
          "Nous vous souhaitons un agreable sejour, et sommes a votre entiere disposition depuis la plateforme.",
          "Le deseamos una estancia agradable y estamos a su disposicion desde la plataforma."
        ),
        cta: text("Let's go!", "C'est parti !", "Vamos!")
      }
    },
    checkOut: {
      title: text("Check-out", "Check-out", "Check-out"),
      yourCheckout: text("Your check-out", "Votre check-out", "Tu check-out"),
      roomLabel: text("Room", "Chambre n", "Habitacion"),
      roomNameFallback: text("Suite", "Suite", "Suite"),
      checkInLabel: text("Check-in", "Check-in", "Check-in"),
      checkOutLabel: text("Check-out", "Check-out", "Check-out"),
      checkInTime: text("9:00", "9:00", "9:00"),
      checkOutTime: text("16:00", "16:00", "16:00"),
      detailsTitle: text("Details", "Details", "Detalles"),
      noExtras: text("No extras.", "Aucun extra.", "Sin extras."),
      totalExtras: text("Total extras", "Total des extras", "Total extras"),
      tipLabel: text("Tip", "Pourboire", "Propina"),
      totalLabel: text("Total", "Total", "Total"),
      tipTitle: text("Leave a tip for hotel staff.", "Laissez un pourboire au personnel de l'hotel.", "Deja una propina al personal del hotel."),
      percent5: text("5%", "5 %", "5%"),
      percent10: text("10%", "10 %", "10%"),
      percent15: text("15%", "15 %", "15%"),
      customize: text("Custom", "Personnaliser", "Personalizar"),
      enterAmount: text("Enter an amount", "Entrez un montant", "Ingresa un monto"),
      back: text("Back", "Retour", "Volver"),
      validate: text("Validate", "Valider", "Validar"),
      confirmPay: text("Confirm and pay", "Confirmer et payer", "Confirmar y pagar"),
      thanks: text(
        "Hotel staff thanks you for your tip of",
        "Le personnel de l'hotel vous remercie pour votre pourboire de",
        "El personal del hotel te agradece por tu propina de"
      ),
      removeTip: text("I want to remove my tip", "Je veux retirer mon pourboire", "Quiero quitar mi propina"),
      viewInvoices: text("View invoices", "Voir mes factures", "Ver facturas"),
      loadingLabel: text("Loading...", "Chargement...", "Cargando..."),
      confirmingLabel: text("...", "...", "..."),
      signature: {
        title: text("Sign registration form", "Signer le formulaire de depart", "Firmar el formulario de salida"),
        subtitle: text("Draw your signature on the screen", "Dessinez votre signature sur l'ecran", "Dibuja tu firma en la pantalla"),
        clear: text("Clear", "Effacer", "Borrar"),
        continue: text("Continue", "Continuer", "Continuar"),
        required: text("Please sign above to continue.", "Veuillez signer ci-dessus pour continuer.", "Firma arriba para continuar.")
      },
      errors: {
        couldNotLoad: text("Could not load check-out details.", "Impossible de charger les details du check-out.", "No se pudieron cargar los detalles del check-out."),
        couldNotConfirm: text("Could not confirm check-out.", "Impossible de confirmer le check-out.", "No se pudo confirmar el check-out."),
        serviceUnavailable: text("Service unavailable.", "Service indisponible.", "Servicio no disponible.")
      }
    },
    pay: {
      notAvailableTitle: text("Payment link not available", "Lien de paiement indisponible", "Enlace de pago no disponible"),
      notAvailableDescription: text(
        "It may have expired or been removed.",
        "Il a peut-etre expire ou ete supprime.",
        "Puede haber expirado o sido eliminado."
      ),
      completePaymentTitle: text("Complete payment", "Finaliser le paiement", "Completar pago"),
      paymentRequestFallback: text("Payment request", "Demande de paiement", "Solicitud de pago"),
      paymentCompleted: text("Payment completed.", "Paiement effectue.", "Pago completado."),
      errorPrefix: text("Error", "Erreur", "Error"),
      statusPrefix: text("Status", "Statut", "Estado"),
      statusPaid: text("Paid", "Paye", "Pagado"),
      statusExpired: text("Expired", "Expire", "Expirado"),
      statusCreated: text("Created", "Cree", "Creado"),
      actionAlreadyPaid: text("Already paid", "Deja paye", "Ya pagado"),
      actionExpired: text("Expired", "Expire", "Expirado"),
      actionPayNow: text("Pay now", "Payer maintenant", "Pagar ahora")
    },
    services: {
      title: text("Services", "Services", "Servicios"),
      transportBadge: text("Transport", "Transport", "Transporte"),
      transportBookedMessage: text(
        "Your ride has been booked for {{time}}.",
        "Votre trajet a ete reserve pour {{time}}.",
        "Tu traslado fue reservado para las {{time}}."
      ),
      welcomeBadge: text("Welcome", "Bienvenue", "Bienvenido"),
      welcomeMessage: text(
        "Welcome to {{hotelName}}. How can we help you?",
        "Bienvenue a {{hotelName}}. Comment pouvons-nous vous aider ?",
        "Bienvenido a {{hotelName}}. Como podemos ayudarte?"
      ),
      checkInBadge: text("Check-in", "Check-in", "Check-in"),
      checkInMessage: text(
        "Complete your check-in to access all services.",
        "Effectuez votre check-in pour acceder a tous les services.",
        "Completa tu check-in para acceder a todos los servicios."
      ),
      historyAriaLabel: text("View history", "Voir l'historique", "Ver historial"),
      cards: [
        {
          id: "concierge",
          title: text("Concierge", "Concierge", "Conserjeria"),
          href: "/concierge",
          chatHref: "/messages?department=concierge",
          backgroundImage: "/images/services/concierge_background.png",
          iconImage: "/images/services/icon-concierge.png"
        },
        {
          id: "housekeeping",
          title: text("Housekeeping", "Housekeeping", "Limpieza"),
          href: "/housekeeping",
          chatHref: "/messages?department=housekeeping",
          backgroundImage: "/images/services/housekeeping_background.png",
          iconImage: "/images/services/icon-housekeeping.png"
        },
        {
          id: "restaurants",
          title: text("Restaurant", "Restaurant", "Restaurante"),
          href: "/restaurants",
          chatHref: "/messages?department=restaurants",
          backgroundImage: "/images/services/restaurant_background.png",
          iconImage: "/images/services/icon-restaurant.png"
        },
        {
          id: "reception",
          title: text("Reception", "Reception", "Recepcion"),
          href: "/reception",
          chatHref: "/messages?department=reception",
          backgroundImage: "/images/services/reception_background.png",
          iconImage: "/images/services/icon-reception.png"
        },
        {
          id: "room-service",
          title: text("Room Service", "Room Service", "Room Service"),
          href: "/room-service",
          chatHref: "/messages?department=room-service",
          backgroundImage: "/images/services/roomservice_background.png",
          iconImage: "/images/services/icon-roomservice.png"
        },
        {
          id: "spa",
          title: text("Spa", "Spa", "Spa"),
          href: "/spa",
          chatHref: "/messages?department=spa",
          backgroundImage: "/images/services/spa_gym_background.png",
          iconImage: "/images/services/icon-spa.png"
        },
        {
          id: "gym",
          title: text("Gym", "Gym", "Gym"),
          href: "/gym",
          chatHref: "/messages?department=gym",
          backgroundImage: "/images/services/spa_gym_background.png",
          iconImage: "/images/services/icon-gym.png"
        }
      ],
      catalog: {
        couldNotLoadCategories: text(
          "Could not load service categories.",
          "Impossible de charger les categories de service.",
          "No se pudieron cargar las categorias de servicio."
        ),
        couldNotLoadItems: text(
          "Could not load service items.",
          "Impossible de charger les items de service.",
          "No se pudieron cargar los items de servicio."
        ),
        fallbackLoadError: text(
          "Could not load services.",
          "Impossible de charger les services.",
          "No se pudieron cargar los servicios."
        ),
        retry: text("Retry", "Reessayer", "Reintentar"),
        noServicesAvailable: text(
          "No services available at the moment.",
          "Aucun service disponible pour le moment.",
          "No hay servicios disponibles por ahora."
        ),
        otherRequestTitle: text("Other request", "Autre demande", "Otra solicitud"),
        otherRequestDescription: text(
          "Contact our team directly",
          "Contactez directement notre equipe",
          "Contacta directamente con nuestro equipo"
        ),
        roomNumberRequired: text(
          "Room number is required to submit requests",
          "Le numero de chambre est requis pour envoyer des demandes",
          "El numero de habitacion es obligatorio para enviar solicitudes"
        ),
        submitFailed: text(
          "Could not submit request.",
          "Impossible d'envoyer la demande.",
          "No se pudo enviar la solicitud."
        ),
        networkError: text("Network error.", "Erreur reseau.", "Error de red."),
        estimatedMinutesTemplate: text("~{{minutes}} min", "~{{minutes}} min", "~{{minutes}} min")
      },
      requestForm: {
        noAdditionalOptions: text(
          "No additional options required. Click submit to send your request.",
          "Aucune option supplementaire requise. Cliquez sur valider pour envoyer votre demande.",
          "No se requieren opciones adicionales. Pulsa validar para enviar tu solicitud."
        ),
        submit: text("Submit", "Valider", "Validar"),
        submitting: text("Submitting...", "Envoi en cours...", "Enviando..."),
        estimatedMinutesTemplate: text("~{{minutes}} min", "~{{minutes}} min", "~{{minutes}} min")
      },
      requestDialog: {
        successTitle: text("Request sent!", "Demande envoyee !", "Solicitud enviada!"),
        successMessage: text(
          "Your request has been sent successfully!",
          "Votre demande a ete envoyee avec succes !",
          "Tu solicitud fue enviada con exito!"
        ),
        referenceLabel: text("Reference", "Reference", "Referencia"),
        estimatedTimeTemplate: text(
          "Estimated time: ~{{minutes}} min",
          "Temps estime : ~{{minutes}} min",
          "Tiempo estimado: ~{{minutes}} min"
        ),
        done: text("Done", "Termine", "Listo"),
        errorTitle: text("Request failed", "Echec de l'envoi", "Error al enviar"),
        cancel: text("Cancel", "Annuler", "Cancelar"),
        retry: text("Retry", "Reessayer", "Reintentar"),
        fallbackUnexpectedError: text(
          "An unexpected error occurred.",
          "Une erreur inattendue s'est produite.",
          "Ocurrio un error inesperado."
        )
      },
      widgets: {
        orderTracking: {
          title: text("Order Tracking", "Suivi de commande", "Seguimiento de pedido"),
          orderIdPrefix: text("Order ID:", "Commande ID:", "ID de pedido:"),
          live: text("Live", "En direct", "En vivo"),
          statuses: {
            pending: text("Order Received", "Commande recue", "Pedido recibido"),
            preparing: text("Preparing", "En preparation", "En preparacion"),
            delivering: text("On the Way", "En livraison", "En camino"),
            completed: text("Delivered", "Livree", "Entregado"),
            cancelled: text("Cancelled", "Annulee", "Cancelado")
          },
          updatedPrefix: text("Updated", "Mis a jour", "Actualizado"),
          statusCompleted: text("Completed", "Termine", "Completado"),
          cancelledMessage: text(
            "This order has been cancelled.",
            "Cette commande a ete annulee.",
            "Este pedido fue cancelado."
          )
        },
        tipDialog: {
          leaveATip: text("Leave a Tip", "Laisser un pourboire", "Dejar propina"),
          dialogTitle: text("Leave a Tip", "Laisser un pourboire", "Dejar propina"),
          dialogDescriptionTemplate: text(
            "Show your appreciation for {{staffName}} from {{department}}",
            "Montrez votre appreciation pour {{staffName}} de {{department}}",
            "Muestra tu agradecimiento a {{staffName}} de {{department}}"
          ),
          selectAmount: text("Select Amount", "Selectionner le montant", "Seleccionar cantidad"),
          customAmount: text("Or Enter Custom Amount", "Ou entrer un montant personnalise", "O ingresar una cantidad personalizada"),
          customPlaceholder: text("0.00", "0.00", "0.00"),
          tipAmount: text("Tip Amount", "Montant du pourboire", "Cantidad de propina"),
          cancel: text("Cancel", "Annuler", "Cancelar"),
          sendTip: text("Send Tip", "Envoyer le pourboire", "Enviar propina"),
          processing: text("Processing...", "Traitement...", "Procesando..."),
          invalidAmount: text("Please enter a valid amount", "Veuillez entrer un montant valide", "Ingresa un monto valido"),
          tipFailed: text(
            "Failed to process tip",
            "Echec du traitement du pourboire",
            "No se pudo procesar la propina"
          ),
          unexpectedError: text("An error occurred", "Une erreur est survenue", "Ocurrio un error")
        }
      }
    },
    reception: {
      heroImage: "/images/services/reception_background.png",
      title: text("Reception", "Reception", "Recepcion"),
      signInToAccess: text(
        "Sign in to access reception.",
        "Connectez-vous pour acceder a la reception.",
        "Inicia sesion para acceder a recepcion."
      ),
      resumeConversation: text("Resume your conversation:", "Reprenez votre discussion :", "Retoma tu conversacion:"),
      conversationPreview: text(
        "This is an example message that...",
        "Ceci est un message d'exemple qui...",
        "Este es un mensaje de ejemplo que..."
      ),
      activeRequests: text("Active requests", "Demandes en cours", "Solicitudes activas"),
      checkInComplete: text("Check-in complete", "Check-in complete", "Check-in completado"),
      roomLabel: text("Room {{roomNumber}}", "Chambre {{roomNumber}}", "Habitacion {{roomNumber}}"),
      errors: {
        submitRequest: text(
          "Could not submit request.",
          "Impossible d'envoyer la demande.",
          "No se pudo enviar la solicitud."
        ),
        serviceUnavailable: text("Service unavailable.", "Service indisponible.", "Servicio no disponible.")
      },
      ticketStatus: {
        pending: text("Pending", "En attente", "Pendiente"),
        inProgress: text("In progress", "En cours", "En curso"),
        resolved: text("Done", "Termine", "Completado")
      },
      quickActions: [
        {
          id: "check_in",
          label: text("Complete your check-in", "Completez votre check-in", "Completa tu check-in"),
          icon: "clipboard-check",
          href: "/reception/check-in"
        },
        {
          id: "info",
          label: text("Request information", "Demander un renseignement", "Solicitar informacion"),
          icon: "help-circle",
          action: "info_request",
          requestTitle: text("Information request", "Demande de renseignement", "Solicitud de informacion")
        },
        {
          id: "late_checkout",
          label: text("Late check-out", "Late check-out", "Late check-out"),
          icon: "clock",
          action: "late_checkout",
          requestTitle: text("Late check-out request", "Demande de late check-out", "Solicitud de late check-out")
        }
      ]
    },
    housekeeping: {
      heroImage: "/images/services/housekeeping_background.png",
      title: text("Housekeeping", "Housekeeping", "Limpieza"),
      signInToAccess: text(
        "Sign in to access services.",
        "Connectez-vous pour acceder aux services.",
        "Inicia sesion para acceder a los servicios."
      ),
      quickRequestsTitle: text("Quick requests", "Demandes rapides", "Solicitudes rapidas"),
      activeRequests: text("Active requests", "Demandes en cours", "Solicitudes activas"),
      cleaningPrompt: text(
        "Would you like housekeeping to clean your room during your stay?",
        "Souhaitez-vous que le housekeeping nettoie votre chambre durant votre sejour ?",
        "Deseas que housekeeping limpie tu habitacion durante tu estancia?"
      ),
      yesLabel: text("Yes", "Oui", "Si"),
      noLabel: text("No", "Non", "No"),
      composerPlaceholder: text("Special request...", "Demande speciale...", "Solicitud especial..."),
      errors: {
        submitRequest: text(
          "Could not submit request.",
          "Impossible d'envoyer la demande.",
          "No se pudo enviar la solicitud."
        ),
        sendMessage: text("Could not send message.", "Impossible d'envoyer le message.", "No se pudo enviar el mensaje."),
        serviceUnavailable: text("Service unavailable.", "Service indisponible.", "Servicio no disponible.")
      },
      ticketStatus: {
        pending: text("Pending", "En attente", "Pendiente"),
        inProgress: text("In progress", "En cours", "En curso"),
        resolved: text("Done", "Termine", "Completado")
      },
      quickItems: [
        { id: "shampoo", label: text("Shampoo", "Shampoing", "Shampoo"), icon: "🧴" },
        { id: "pillows", label: text("Pillows", "Oreillers", "Almohadas"), icon: "🛏️" },
        { id: "toilet_paper", label: text("Toilet paper", "Papier toilette", "Papel higienico"), icon: "🧻" },
        { id: "towels", label: text("Towels", "Serviettes", "Toallas"), icon: "🛁" }
      ]
    },
    messages: {
      title: text("Direct messaging", "Messagerie directe", "Mensajeria directa"),
      intro: text(
        "Reach hotel staff instantly. We're listening.",
        "Entrez directement en contact avec notre personnel. Nous sommes a l'ecoute.",
        "Habla con el personal del hotel al instante. Estamos para ayudarte."
      ),
      connect: text("Start check-in", "Demarrer le check-in", "Comenzar check-in"),
      refresh: text("Refresh", "Actualiser", "Actualizar"),
      newChat: text("New conversation", "Nouvelle conversation", "Nueva conversacion"),
      noThreads: text("No conversations yet.", "Aucune conversation pour le moment.", "Aun no hay conversaciones."),
      loading: text("Loading...", "Chargement...", "Cargando..."),
      hotelFallback: text("Hotel Four Seasons", "Hotel Four Seasons", "Hotel Four Seasons"),
      errors: {
        offline: text(
          "Backend unreachable. Start the backend then refresh.",
          "Backend inaccessible. Demarrez le backend puis reessayez.",
          "Backend inaccesible. Inicia el backend y vuelve a intentar."
        ),
        loadThreads: text(
          "Could not load threads.",
          "Impossible de charger les conversations.",
          "No se pudieron cargar las conversaciones."
        ),
        createThread: text(
          "Could not create thread.",
          "Impossible de creer la conversation.",
          "No se pudo crear la conversacion."
        ),
        backendUnreachable: text(
          "Backend unreachable. Start `npm run dev:backend` then try again.",
          "Backend inaccessible. Lancez `npm run dev:backend` puis reessayez.",
          "Backend inaccesible. Inicia `npm run dev:backend` y vuelve a intentar."
        ),
        connectStayFirst: text("Connect a stay first.", "Connectez un sejour d'abord.", "Conecta una estancia primero."),
        threadNotFound: text("Thread not found.", "Conversation introuvable.", "Conversacion no encontrada."),
        loadMessages: text("Could not load messages.", "Impossible de charger les messages.", "No se pudieron cargar los mensajes."),
        sendMessagePrefix: text("Could not send message", "Impossible d'envoyer le message", "No se pudo enviar el mensaje")
      },
      departments: [
        { id: "reception", label: text("Reception", "Reception", "Recepcion") },
        { id: "concierge", label: text("Concierge", "Concierge", "Conserjeria") },
        { id: "housekeeping", label: text("Housekeeping", "Housekeeping", "Limpieza") },
        { id: "room-service", label: text("Room service", "Room service", "Room service") },
        { id: "spa-gym", label: text("Spa & Gym", "Spa & Gym", "Spa y Gym") },
        { id: "restaurants", label: text("Restaurants", "Restaurants", "Restaurantes") }
      ],
      thread: {
        staffFallback: text("Staff", "Staff", "Staff"),
        writePlaceholder: text("Write a message", "Ecrire un message", "Escribe un mensaje"),
        removeAttachmentAria: text("Remove attachment", "Supprimer la piece jointe", "Quitar archivo adjunto"),
        addAttachmentAria: text("Add attachment", "Ajouter une piece jointe", "Agregar archivo adjunto"),
        quickActionAria: text("Quick action", "Action rapide", "Accion rapida"),
        sendAria: text("Send", "Envoyer", "Enviar"),
        sendErrorHint: text(
          "Message failed to send. Tap to retry.",
          "L'envoi a echoue. Appuyez pour reessayer.",
          "No se pudo enviar. Pulsa para reintentar."
        ),
        translateAction: text("Translate", "Traduire", "Traducir")
      }
    },
    concierge: {
      heroImage: "/images/services/concierge_background.png",
      title: text("Concierge", "Concierge", "Conserjeria"),
      errors: {
        createConversation: text(
          "Could not create conversation.",
          "Impossible de creer la conversation.",
          "No se pudo crear la conversacion."
        ),
        sendMessage: text("Could not send message.", "Impossible d'envoyer le message.", "No se pudo enviar el mensaje."),
        serviceUnavailable: text("Service unavailable.", "Service indisponible.", "Servicio no disponible.")
      },
      resumeConversation: text("Resume your conversation:", "Reprenez votre discussion :", "Retoma tu conversacion:"),
      viewFullConversation: text("View full conversation", "Voir la conversation complete", "Ver conversacion completa"),
      activeRequests: text("Active requests", "Demandes en cours", "Solicitudes activas"),
      ticketStatus: {
        inProgress: text(
          "The concierge is processing your request.",
          "Le concierge est en train de traiter votre demande.",
          "El concierge esta procesando tu solicitud."
        ),
        resolved: text("Request completed.", "Demande terminee.", "Solicitud completada."),
        pending: text("Pending.", "En attente.", "Pendiente.")
      },
      tipPrompt: text(
        "Thank your concierge for their service",
        "Remerciez votre concierge pour ses services",
        "Agradece a tu concierge por su servicio"
      ),
      leaveTip: text("Leave a tip", "Laisser un pourboire", "Dejar propina"),
      composerPlaceholder: text("Write to concierge...", "Ecrire au concierge...", "Escribe al concierge..."),
      quickActions: [
        { id: "restaurant", label: text("Book a restaurant", "Reserver un restaurant", "Reservar un restaurante") },
        { id: "transport", label: text("Arrange transport", "Organiser un transport", "Organizar transporte"), href: "/concierge/transport" },
        {
          id: "ticket",
          label: text(
            "Book tickets (show, museum, event)",
            "Reserver un billet (spectacle, musee, evenement)",
            "Reservar entradas (show, museo, evento)"
          )
        },
        {
          id: "airport",
          label: text("Arrange airport transfer", "Organiser un transfert aeroport", "Organizar traslado al aeropuerto"), href: "/concierge/transport?type=airport"
        },
        {
          id: "activities",
          label: text(
            "Request activity recommendations",
            "Demander des recommandations d'activites",
            "Pedir recomendaciones de actividades"
          )
        }
      ]
    },
    transport: {
      title: text("Arrange transport", "Organiser un transport", "Organizar transporte"),
      airportTitle: text("Airport transfer", "Transfert aeroport", "Traslado al aeropuerto"),
      cancelLabel: text("Cancel", "Annuler", "Cancelar"),
      saveLabel: text("Save", "Enregistrer", "Guardar"),
      destinationTitle: text("Where would you like to go?", "Ou desirez-vous aller ?", "Adonde desea ir?"),
      destinationHint: text(
        "You can enter a place name or instructions for the concierge.",
        "Vous pouvez inserer un nom de lieu ou une indication pour le concierge.",
        "Puede insertar un nombre de lugar o una indicacion para el concierge."
      ),
      addressLabel: text("Address", "Adresse", "Direccion"),
      addressPlaceholder: text("Enter destination...", "Saisir une destination...", "Ingrese un destino..."),
      openMapLabel: text("Open map", "Ouvrir la carte", "Abrir mapa"),
      closeMapLabel: text("Close map", "Refermer la carte", "Cerrar mapa"),
      whenTitle: text("When would you like to leave?", "Quand souhaitez-vous partir ?", "Cuando desea salir?"),
      asapLabel: text("As soon as possible", "Des que possible", "Lo antes posible"),
      anotherTimeLabel: text("Another time", "Un autre moment", "Otro momento"),
      passengersTitle: text("How many passengers total?", "Combien de passager au total ?", "Cuantos pasajeros en total?"),
      adultsLabel: text("Adults", "Adultes", "Adultos"),
      childrenLabel: text("Children", "Enfants", "Ninos"),
      returnTitle: text("Also arrange the return?", "Preparer egalement le retour ?", "Preparar tambien el regreso?"),
      yesLabel: text("Yes", "Oui", "Si"),
      noLabel: text("No", "Non", "No"),
      submitButton: text("Send request", "Envoyer la demande", "Enviar la solicitud"),
      submitting: text("Sending...", "Envoi...", "Enviando..."),
      successTitle: text("Request sent!", "Demande envoyee !", "Solicitud enviada!"),
      successMessage: text(
        "The concierge will confirm your transport shortly. Check your messages for updates.",
        "Le concierge confirmera votre transport sous peu. Consultez vos messages pour le suivi.",
        "El concierge confirmara tu transporte en breve. Consulta tus mensajes para actualizaciones."
      ),
      goToMessages: text("View messages", "Voir les messages", "Ver mensajes"),
      backToConcierge: text("Back to concierge", "Retour au concierge", "Volver al concierge"),
      errors: {
        submitFailed: text("Could not submit your request. Please try again.", "La demande n'a pas pu etre envoyee. Veuillez reessayer.", "No se pudo enviar tu solicitud. Por favor, intentalo de nuevo."),
        missingFields: text("Please fill in the destination.", "Veuillez remplir la destination.", "Por favor, complete el destino.")
      }
    },
    roomService: {
      heroImage: "/images/services/roomservice_background.png",
      title: text("Room Service", "Room Service", "Room Service"),
      orderTitlePrefix: text("Order", "Commande", "Pedido"),
      orderButton: text("Order", "Commander", "Pedir"),
      errors: {
        couldNotPlaceOrder: text(
          "Could not place order.",
          "Impossible de passer la commande.",
          "No se pudo realizar el pedido."
        ),
        serviceUnavailable: text("Service unavailable.", "Service indisponible.", "Servicio no disponible.")
      },
      activeOrders: text("Active orders", "Commandes en cours", "Pedidos activos"),
      ticketStatus: {
        inProgress: text("Being prepared...", "En preparation...", "En preparacion..."),
        resolved: text("Delivered", "Livree", "Entregado"),
        pending: text("Order received", "Commande recue", "Pedido recibido")
      },
      categories: [
        { id: "breakfast", label: text("Breakfast", "Petit-dejeuner", "Desayuno") },
        { id: "starters", label: text("Starters", "Entrees", "Entradas") },
        { id: "mains", label: text("Mains", "Plats", "Platos") },
        { id: "desserts", label: text("Desserts", "Desserts", "Postres") },
        { id: "drinks", label: text("Drinks", "Boissons", "Bebidas") },
        { id: "night", label: text("Late night", "Carte de nuit", "Menu nocturno") }
      ],
      menuItems: [
        {
          id: "chocolatine",
          name: text("Chocolatine", "Chocolatine", "Chocolatine"),
          price: 1.5,
          category: "breakfast",
          image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&q=80"
        },
        {
          id: "pain_chocolat",
          name: text("Chocolate bread", "Pain au chocolat boulanger", "Pan de chocolate"),
          price: 1.5,
          category: "breakfast",
          image: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=200&q=80"
        },
        {
          id: "goat_toast",
          name: text(
            "Goat cheese toast with red fruits",
            "Toast au chevre et son assortiment de fruits rouges",
            "Tostada de cabra con frutos rojos"
          ),
          price: 8,
          category: "starters",
          image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&q=80"
        },
        {
          id: "caesar_salad",
          name: text("Chef's Caesar salad", "Salade cesar du chef", "Ensalada Cesar del chef"),
          price: 10,
          category: "starters",
          image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=200&q=80"
        },
        {
          id: "duck_breast",
          name: text("Duck breast", "Magret de canard", "Magret de pato"),
          price: 17.5,
          category: "mains",
          image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=200&q=80"
        },
        {
          id: "pistachio_burger",
          name: text("Pistachio burger", "Burger a la pistache", "Hamburguesa de pistacho"),
          description: text(
            "Vegan - Potato patty",
            "Vegan : Galette de pomme de terre",
            "Vegano - Tortita de papa"
          ),
          price: 15.5,
          category: "mains",
          tags: ["vegan"],
          image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80"
        },
        {
          id: "chocolate_fondant",
          name: text("Chocolate fondant", "Fondant au chocolat", "Fondant de chocolate"),
          price: 3,
          category: "desserts",
          image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&q=80"
        },
        {
          id: "cafe_gourmand",
          name: text("Gourmet coffee", "Cafe gourmand", "Cafe gourmet"),
          price: 2.5,
          category: "desserts",
          image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&q=80"
        },
        {
          id: "sodas",
          name: text("Sodas", "Sodas", "Refrescos"),
          price: 1.5,
          category: "drinks",
          image: "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=200&q=80"
        },
        {
          id: "fruit_juice",
          name: text("Artisanal fruit juice", "Jus de fruits artisanal", "Jugo de frutas artesanal"),
          price: 2,
          category: "drinks",
          image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=200&q=80"
        },
        {
          id: "night_duck",
          name: text("Duck breast", "Magret de canard", "Magret de pato"),
          price: 17.5,
          category: "night",
          image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=200&q=80"
        },
        {
          id: "night_burger",
          name: text("Pistachio burger", "Burger a la pistache", "Hamburguesa de pistacho"),
          price: 15.5,
          category: "night",
          image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80"
        }
      ],
      itemCount: text("{{count}} item(s)", "{{count}} article(s)", "{{count}} articulo(s)"),
      placingOrder: text("Placing order...", "Envoi en cours...", "Enviando pedido..."),
      placeOrder: text("Place order", "Commander", "Realizar pedido")
    },
    restaurants: {
      heroImage: "/images/services/restaurant_background.png",
      title: text("Restaurant", "Restaurant", "Restaurante"),
      experiencesTitle: text(
        "Our culinary experiences",
        "Nos experiences culinaires",
        "Nuestras experiencias culinarias"
      ),
      bookTable: text("Book a table", "Reserver une table", "Reservar una mesa"),
      restaurants: [
        {
          id: "sea_fu",
          name: "SEA FU",
          cuisine: text("Asian Fusion & Seafood", "Fusion asiatique & Fruits de mer", "Fusion asiatica y mariscos"),
          description: text(
            "Contemporary Asian cuisine with stunning ocean views",
            "Cuisine asiatique contemporaine avec vue imprenable sur l'ocean",
            "Cocina asiatica contemporanea con vistas al oceano"
          ),
          image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=80",
          hours: "12:00 - 23:00",
          dressCode: text("Smart casual", "Tenue elegante decontractee", "Elegante casual")
        },
        {
          id: "coya",
          name: "COYA",
          cuisine: text("Peruvian", "Peruvien", "Peruano"),
          description: text(
            "Vibrant Peruvian flavors in an energetic atmosphere",
            "Saveurs peruviennes vibrantes dans une atmosphere dynamique",
            "Sabores peruanos vibrantes en una atmosfera energetica"
          ),
          image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
          hours: "19:00 - 02:00",
          dressCode: text("Smart casual", "Tenue elegante decontractee", "Elegante casual")
        },
        {
          id: "la_terrasse",
          name: "La Terrasse",
          cuisine: text("Mediterranean", "Mediterraneen", "Mediterraneo"),
          description: text(
            "Al fresco dining with Mediterranean specialties",
            "Repas en plein air avec des specialites mediterraneennes",
            "Comida al aire libre con especialidades mediterraneas"
          ),
          image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
          hours: "07:00 - 22:00"
        }
      ]
    },
    spaGym: {
      heroImage: "/images/services/spa_gym_background.png",
      heroImages: {
        spa: "/images/services/wellness/spa-hero-lounge.png",
        gym: "/images/services/wellness/gym-hero-equipment.png"
      },
      galleryImages: {
        gym: [
          "/images/services/wellness/gym-gallery-cardio.png",
          "/images/services/wellness/gym-gallery-strength.png",
          "/images/services/wellness/gym-gallery-closeup.png"
        ]
      },
      title: text("Spa & Gym", "Spa & Gym", "Spa y Gym"),
      tabs: {
        spa: text("Spa", "Spa", "Spa"),
        gym: text("Gym", "Gym", "Gym")
      },
      yourBookings: text("Your bookings", "Vos reservations", "Tus reservas"),
      dateTimeSeparator: text("at", "a", "a"),
      bookingStatus: {
        confirmed: text("Confirmed", "Confirme", "Confirmado"),
        pending: text("Pending", "En attente", "Pendiente")
      },
      sectionTitles: {
        spa: text("Our treatments", "Nos soins", "Nuestros tratamientos"),
        gym: text("Our activities", "Nos activites", "Nuestras actividades")
      },
      messaging: {
        department: "spa-gym",
        availabilityMessage: text(
          "Currently available to chat.",
          "Actuellement disponible pour echanger.",
          "Actualmente disponible para conversar."
        )
      },
      availability: {
        title: text("Availability", "Disponibilites", "Disponibilidad"),
        fromLabel: text("From", "De", "De"),
        toLabel: text("to", "a", "a"),
        allDayLabel: text("All day", "Toute la journee", "Todo el dia"),
        unavailableLabel: text("Unavailable", "Indisponible", "No disponible"),
        expandAriaLabel: text(
          "Show weekly availability",
          "Afficher la disponibilite hebdomadaire",
          "Mostrar disponibilidad semanal"
        ),
        collapseAriaLabel: text(
          "Hide weekly availability",
          "Masquer la disponibilite hebdomadaire",
          "Ocultar disponibilidad semanal"
        ),
        schedule: [
          { day: text("Mon.", "Lun.", "Lun."), mode: "all-day" },
          { day: text("Tue.", "Mar.", "Mar."), mode: "all-day" },
          { day: text("Wed.", "Mer.", "Mie."), mode: "all-day" },
          {
            day: text("Thu.", "Jeu.", "Jue."),
            mode: "range",
            from: text("6h", "6h", "6h"),
            to: text("23h", "23h", "23h")
          },
          {
            day: text("Fri.", "Ven.", "Vie."),
            mode: "range",
            from: text("6h", "6h", "6h"),
            to: text("23h", "23h", "23h"),
            highlighted: true
          },
          {
            day: text("Sat.", "Sam.", "Sab."),
            mode: "range",
            from: text("6h", "6h", "6h"),
            to: text("23h", "23h", "23h")
          },
          { day: text("Sun.", "Dim.", "Dom."), mode: "unavailable" }
        ]
      },
      durationLabels: {
        hour: text("h", "h", "h"),
        minute: text("min.", "min.", "min.")
      },
      bookSession: text("Book a session", "Reserver une session", "Reservar una sesion"),
      quickActions: {
        gym: [
          {
            id: "equipment_question",
            label: text(
              "Ask a question about equipment",
              "Poser une question sur l'equipement",
              "Hacer una pregunta sobre el equipo"
            ),
            href: "/messages?department=spa-gym"
          },
          {
            id: "reschedule_booking",
            label: text(
              "Cancel or reschedule a booking",
              "Annuler ou deplacer une reservation",
              "Cancelar o cambiar una reserva"
            ),
            href: "/messages?department=spa-gym"
          },
          {
            id: "prepare_towels",
            label: text(
              "Prepare towels and water bottles",
              "Preparer des serviettes et bouteilles d'eau",
              "Preparar toallas y botellas de agua"
            ),
            href: "/messages?department=spa-gym"
          }
        ]
      },
      bookingDialog: {
        titleTemplate: text(
          "Book {{serviceName}}",
          "Reserver {{serviceName}}",
          "Reservar {{serviceName}}"
        ),
        descriptionTemplate: text(
          "Select a date and time for {{serviceName}}.",
          "Selectionnez une date et une heure pour {{serviceName}}.",
          "Selecciona una fecha y una hora para {{serviceName}}."
        ),
        dateLabel: text("Date", "Date", "Fecha"),
        timeLabel: text("Time", "Heure", "Hora"),
        notesLabel: text("Special request", "Demande speciale", "Solicitud especial"),
        notesPlaceholder: text(
          "Any details to share with the team?",
          "Un detail a partager avec l'equipe ?",
          "Alguna indicacion para el equipo?"
        ),
        cancel: text("Cancel", "Annuler", "Cancelar"),
        submit: text("Confirm booking", "Confirmer la reservation", "Confirmar reserva"),
        submitting: text("Submitting...", "Envoi en cours...", "Enviando..."),
        done: text("Done", "Termine", "Listo"),
        referenceLabel: text("Reference", "Reference", "Referencia"),
        successTitle: text("Booking request sent", "Demande de reservation envoyee", "Solicitud enviada"),
        successMessage: text(
          "Our team will confirm your session shortly.",
          "Notre equipe confirmera votre session sous peu.",
          "Nuestro equipo confirmara tu sesion pronto."
        ),
        errorTitle: text("Could not submit.", "Envoi impossible.", "No se pudo enviar."),
        ticketTitleTemplate: text(
          "Spa/Gym booking - {{serviceName}} - {{date}} {{time}}",
          "Reservation spa/gym - {{serviceName}} - {{date}} {{time}}",
          "Reserva spa/gym - {{serviceName}} - {{date}} {{time}}"
        ),
        errors: {
          missingDateTime: text(
            "Please select date and time.",
            "Veuillez selectionner une date et une heure.",
            "Selecciona una fecha y una hora."
          ),
          submitFailed: text(
            "Could not submit booking request.",
            "Impossible d'envoyer la demande de reservation.",
            "No se pudo enviar la solicitud."
          ),
          serviceUnavailable: text("Service unavailable.", "Service indisponible.", "Servicio no disponible.")
        }
      },
      chooseTimeSlot: text("Choose a time slot", "Choisir un creneau", "Elegir horario"),
      bookingLoading: text("Booking...", "Reservation...", "Reservando..."),
      bookingAction: text("Book - {{price}} EUR", "Reserver - {{price}} EUR", "Reservar - {{price}} EUR"),
      errors: {
        couldNotBook: text("Could not book.", "Impossible de reserver.", "No se pudo reservar."),
        serviceUnavailable: text("Service unavailable.", "Service indisponible.", "Servicio no disponible.")
      },
      services: [
        {
          id: "relaxing_massage",
          name: text("Relaxing Massage", "Massage relaxant", "Masaje relajante"),
          description: text(
            "A calming full-body treatment.",
            "Une seance relaxante pour le corps.",
            "Un tratamiento relajante de cuerpo completo."
          ),
          duration: 60,
          price: 120,
          category: "spa",
          image: "/images/services/wellness/spa-service-relaxing-massage.png"
        },
        {
          id: "therapeutic_massage",
          name: text("Therapeutic Massage", "Massage therapeutique", "Masaje terapeutico"),
          description: text(
            "Targeted recovery massage for deep tension.",
            "Massage cible pour detendre les tensions profondes.",
            "Masaje especifico para aliviar tension profunda."
          ),
          duration: 90,
          price: 150,
          category: "spa",
          image: "/images/services/wellness/spa-service-therapeutic-massage.png"
        },
        {
          id: "couples_massage",
          name: text("Couples Massage", "Massage en duo", "Masaje en pareja"),
          description: text(
            "Side-by-side treatment for two guests.",
            "Soin a deux dans une ambiance apaisante.",
            "Tratamiento compartido para dos personas."
          ),
          duration: 30,
          price: 220,
          category: "spa",
          image: "/images/services/wellness/spa-service-couples-massage.png"
        },
        {
          id: "face_body_care",
          name: text("Face and Body Care", "Soins visage et corps", "Cuidado de rostro y cuerpo"),
          description: text(
            "A rejuvenating ritual with premium products.",
            "Un rituel revitalisant avec produits premium.",
            "Un ritual rejuvenecedor con productos premium."
          ),
          duration: 30,
          price: 95,
          category: "spa",
          image: "/images/services/wellness/spa-service-face-body-care.png"
        },
        {
          id: "gym_access",
          name: text("Gym Access", "Acces a la salle", "Acceso al gimnasio"),
          description: text(
            "Access to the gym floor and equipment.",
            "Acces a la salle et aux equipements.",
            "Acceso a la sala y al equipamiento."
          ),
          duration: 0,
          price: 0,
          category: "gym",
          image: "/images/services/wellness/gym-gallery-strength.png"
        },
        {
          id: "yoga_class",
          name: text("Yoga Class", "Cours de yoga", "Clase de yoga"),
          description: text(
            "Guided class for balance and mobility.",
            "Cours guide pour l'equilibre et la mobilite.",
            "Clase guiada para equilibrio y movilidad."
          ),
          duration: 60,
          price: 30,
          category: "gym",
          image: "/images/services/wellness/gym-service-yoga.png"
        },
        {
          id: "guided_workout",
          name: text("Guided Workout", "Seance guidee", "Sesion guiada"),
          description: text(
            "Coach-led circuit to boost endurance.",
            "Circuit accompagne pour renforcer l'endurance.",
            "Circuito guiado para mejorar la resistencia."
          ),
          duration: 45,
          price: 40,
          category: "gym",
          image: "/images/services/wellness/gym-gallery-cardio.png"
        }
      ],
      timeSlots: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"]
    },
    hotels: {
      title: text("Explore Hotels", "Explorer les hotels", "Explorar hoteles"),
      description: text(
        "Discover active MyStay hotels.",
        "Decouvrez les hotels MyStay actifs.",
        "Descubre los hoteles MyStay activos."
      ),
      searchPlaceholder: text(
        "Search by hotel name or location...",
        "Rechercher par nom d'hotel ou lieu...",
        "Buscar por nombre de hotel o ubicacion..."
      ),
      featuredSection: text("Featured properties", "Proprietes en vedette", "Propiedades destacadas"),
      allPropertiesSection: text("All properties", "Toutes les proprietes", "Todas las propiedades"),
      viewDetails: text("View details", "Voir les details", "Ver detalles"),
      featuredBadge: text("Featured", "En vedette", "Destacado"),
      noResultsTitle: text("No hotels found", "Aucun hotel trouve", "No se encontraron hoteles"),
      noResultsDescription: text(
        "Try adjusting your search.",
        "Essayez d'ajuster votre recherche.",
        "Intenta ajustar tu busqueda."
      ),
      featuredCount: 2,
      amenities: {
        wifi: text("Wi-Fi", "Wi-Fi", "Wi-Fi"),
        restaurant: text("Restaurant", "Restaurant", "Restaurante"),
        gym: text("Gym", "Salle de sport", "Gimnasio"),
        spa: text("Spa", "Spa", "Spa"),
        pool: text("Pool", "Piscine", "Piscina")
      }
    },
    room: {
      title: text("Your room", "Votre chambre", "Tu habitacion"),
      tailored: text("Tailored experiences", "Plaisirs sur mesure", "Experiencias a medida"),
      completeCheckIn: text("Complete your check-in", "Completez votre check-in", "Completa tu check-in"),
      startCheckOut: text("Start your check-out", "Effectuer votre check-out", "Iniciar tu check-out"),
      suiteNameTemplate: text("Room {{roomNumber}}", "Chambre {{roomNumber}}", "Habitacion {{roomNumber}}"),
      labels: {
        room: text("Room", "Chambre", "Habitacion"),
        adults: text("adults", "adultes", "adultos"),
        child: text("child", "enfant", "nino"),
        checkIn: text("Check-in", "Check-in", "Check-in"),
        checkOut: text("Check-out", "Check-out", "Check-out"),
        reservation: text("Reservation #", "Reservation n", "Reserva n"),
        stayHistory: text("Stay history & invoices", "Historique de sejours et factures", "Historial de estancias y facturas"),
        lateCheckout: text("Late check-out", "Late check-out", "Late check-out"),
        contactReception: text("Contact reception", "Contacter la reception", "Contactar recepcion")
      },
      quickActions: [
        { id: "digital-key", label: text("Digital room key", "Clé digitale de chambre", "Llave digital de habitación"), href: "/reception", icon: "/images/room/digital-key.png" },
        { id: "hotel-info", label: text("Useful information", "Informations utiles", "Información útil"), href: "/hotels", icon: "/images/room/usefull-info.png" },
        { id: "room-control", label: text("Room control", "Contrôle de chambre", "Control de habitación"), href: "/room-service", icon: "/images/room/room-control.png" },
        { id: "directions", label: text("Directions to hotel", "Itinéraire vers l'hôtel", "Indicaciones al hotel"), href: "/hotels", icon: "/images/room/map2.png" },
        { id: "extra-bed", label: text("Request an extra bed", "Demander un lit supplémentaire", "Solicitar una cama extra"), href: "/room-service", icon: "/images/room/bed.png" }
      ],
      promoCards: [
        {
          id: "housekeeping",
          title: text("Housekeeping", "Nettoyage", "Housekeeping"),
          subtitle: text("Based on your schedule.", "Selon votre agenda.", "Segun tu horario."),
          cta: text("Request cleaning", "Demander un nettoyage", "Solicitar limpieza"),
          href: "/housekeeping",
          image: "/images/room/cleaning.png"
        },
        {
          id: "services",
          title: text("Need a service?", "Besoin d'un service ?", "Necesitas un servicio?"),
          subtitle: text(
            "Tell us what you need.",
            "Dites nous ce dont vous avez besoin.",
            "Dinos que necesitas."
          ),
          cta: text("Request a service", "Demander un service", "Solicitar un servicio"),
          href: "/services",
          image: "/images/room/need-service.png"
        }
      ],
      upgrade: {
        title: text("Room upgrade", "Room upgrade", "Room upgrade"),
        subtitle: text("Opt for maximum comfort.", "Optez pour un maximum de confort.", "Opta por maxima comodidad."),
        cta: text("See options", "Consulter les options", "Ver opciones"),
        href: "/services",
        image: "/images/room/room-upgrade.png"
      },
      upsellsTitle: text("Tailored experiences", "Plaisirs sur mesure", "Experiencias a medida"),
      upsells: [
        {
          id: "flowers",
          title: text("FLOWERS", "FLEURS", "FLORES"),
          image: "/uploads/1770222745347-fleurs.png",
          href: "/services"
        },
        {
          id: "champagne",
          title: text("CHAMPAGNE", "CHAMPAGNE", "CHAMPAGNE"),
          image: "/uploads/1770222760416-champagne.png",
          href: "/services"
        },
        {
          id: "letter",
          title: text("LETTER", "LETTRE", "CARTA"),
          image: "/uploads/1770222762080-lettre.png",
          href: "/services"
        },
        {
          id: "magazine",
          title: text("MAGAZINE", "MAGAZINE", "REVISTA"),
          image: "/uploads/1770222764066-magazine.png",
          href: "/services"
        }
      ],
      fallbackHeroImages: [
        "/uploads/roomi1.png",
        "/uploads/roomi2.png",
        "/uploads/roomi3.png",
        "/uploads/roomi4.png"
      ]
    },
    agenda: {
      title: text("Agenda", "Agenda", "Agenda"),
      description: text(
        "Bookings, invites, and reminders synced from backend.",
        "Reservations, invitations et rappels synchronises depuis le backend.",
        "Reservas, invitaciones y recordatorios sincronizados desde backend."
      ),
      refresh: text("Refresh", "Actualiser", "Actualizar"),
      refreshing: text("Refreshing...", "Actualisation...", "Actualizando..."),
      messageStaff: text("Message staff", "Message staff", "Mensaje al personal"),
      startCheckIn: text("Start check-in", "Commencer le check-in", "Comenzar check-in"),
      guestCalendarTitle: text("Guest calendar", "Calendrier client", "Calendario del huesped"),
      guestCalendarBadge: text("Cross-service", "Cross-service", "Multiservicio"),
      guestCalendarDescription: text(
        "Bookings from spa, restaurants, transfers, and housekeeping appear together.",
        "Les reservations spa, restaurants, transferts et housekeeping apparaissent ensemble.",
        "Las reservas de spa, restaurantes, traslados y housekeeping aparecen juntas."
      ),
      connectStay: text("Connect a stay to load your agenda.", "Connectez un sejour pour charger votre agenda.", "Conecta una estancia para cargar tu agenda."),
      loading: text("Loading...", "Chargement...", "Cargando..."),
      noItems: text("No agenda items yet.", "Aucun element d'agenda pour le moment.", "Aun no hay eventos en agenda."),
      roomLabel: text("Room {{roomNumber}}", "Chambre {{roomNumber}}", "Habitacion {{roomNumber}}"),
      views: {
        day: text("Day", "Jour", "Dia"),
        week: text("Week", "Semaine", "Semana"),
        month: text("Month", "Mois", "Mes")
      },
      today: text("Today", "Aujourd'hui", "Hoy"),
      previousRangeAria: text("Previous day", "Jour precedent", "Dia anterior"),
      nextRangeAria: text("Next day", "Jour suivant", "Dia siguiente"),
      emptyTitle: text("No events in this period.", "Aucun evenement sur cette periode.", "No hay eventos en este periodo."),
      emptyDescription: text(
        "Book a service or wait for a staff invitation to populate your agenda.",
        "Reservez un service ou attendez une invitation du staff pour remplir votre agenda.",
        "Reserva un servicio o espera una invitacion del personal para completar tu agenda."
      ),
      invitationLabel: text("Invitation", "Invitation", "Invitacion"),
      suggestionLabel: text("Suggestion", "Suggestion", "Sugerencia"),
      milestones: {
        checkIn: text("Check-in", "Check-in", "Check-in"),
        checkOut: text("Check-out", "Check-out", "Check-out")
      },
      labels: {
        location: text("Location", "Lieu", "Lugar"),
        contact: text("Contact", "Contact", "Contacto"),
        duration: text("Duration", "Duree", "Duracion")
      },
      actions: {
        accept: text("Accept", "Accepter", "Aceptar"),
        decline: text("Another time", "Une autre fois", "Otra vez"),
        viewDetails: text("View", "Voir", "Ver"),
        responding: text("Saving...", "Enregistrement...", "Guardando...")
      },
      statuses: {
        scheduled: text("Scheduled", "Planifie", "Programado"),
        confirmed: text("Confirmed", "Confirme", "Confirmado"),
        pending: text("Pending", "En attente", "Pendiente"),
        declined: text("Declined", "Refuse", "Rechazado"),
        cancelled: text("Cancelled", "Annule", "Cancelado")
      },
      errors: {
        loadAgenda: text("Could not load agenda.", "Impossible de charger l'agenda.", "No se pudo cargar la agenda."),
        respondAction: text(
          "Could not update invitation status.",
          "Impossible de mettre a jour le statut de l'invitation.",
          "No se pudo actualizar el estado de la invitacion."
        ),
        backendUnreachable: text(
          "Backend unreachable. Start `npm run dev:backend` then refresh.",
          "Backend inaccessible. Lancez `npm run dev:backend` puis actualisez.",
          "Backend inaccesible. Inicia `npm run dev:backend` y actualiza."
        )
      },
      notifications: {
        title: text("Notifications", "Notifications", "Notificaciones"),
        description: text("Reminders and escalations.", "Rappels et escalades.", "Recordatorios y escalaciones."),
        preEventTitle: text("Pre-event alerts", "Alertes pre-evenement", "Alertas previas al evento"),
        preEventText: text(
          "Push reminders and SMS for critical events with confirmation buttons.",
          "Rappels push et SMS pour les evenements critiques avec boutons de confirmation.",
          "Recordatorios push y SMS para eventos criticos con botones de confirmacion."
        ),
        servicePrepTitle: text("Service prep", "Preparation service", "Preparacion del servicio"),
        servicePrepText: text(
          "Prompt departments with prep checklists tied to bookings.",
          "Informer les equipes avec des checklists de preparation liees aux reservations.",
          "Avisar a los departamentos con listas de preparacion vinculadas a reservas."
        )
      }
    },
    analytics: {
      title: text("Analytics", "Analytics", "Analitica"),
      description: text("KPIs synced from backend.", "KPIs synchronises depuis le backend.", "KPIs sincronizados desde backend."),
      refresh: text("Refresh", "Actualiser", "Actualizar"),
      refreshing: text("Refreshing...", "Actualisation...", "Actualizando..."),
      startCheckIn: text("Start check-in", "Commencer le check-in", "Comenzar check-in"),
      performanceTitle: text("Performance", "Performance", "Rendimiento"),
      performanceBadge: text("KPIs", "KPIs", "KPIs"),
      performanceDescription: text(
        "Stay-wide metrics for response times, revenue, and satisfaction.",
        "Metriques sejour pour delais de reponse, revenus et satisfaction.",
        "Metricas de estancia para tiempos de respuesta, ingresos y satisfaccion."
      ),
      connectStay: text("Connect a stay to load analytics.", "Connectez un sejour pour charger les analytics.", "Conecta una estancia para cargar analitica."),
      loading: text("Loading...", "Chargement...", "Cargando..."),
      ticketsLabel: text("Tickets", "Tickets", "Tickets"),
      pendingSuffix: text("pending", "en attente", "pendientes"),
      inProgressSuffix: text("in progress", "en cours", "en curso"),
      threadsLabel: text("Threads", "Conversations", "Conversaciones"),
      threadsSubtitle: text("Across all departments", "Tous departements confondus", "En todos los departamentos"),
      revenueLabel: text("Revenue (invoices)", "Revenus (factures)", "Ingresos (facturas)"),
      pointsTemplate: text("+{{points}} points", "+{{points}} points", "+{{points}} puntos"),
      upcomingEventsLabel: text("Upcoming events", "Evenements a venir", "Proximos eventos"),
      generatedTemplate: text("Generated {{time}}", "Genere {{time}}", "Generado {{time}}"),
      errors: {
        loadAnalytics: text("Could not load analytics.", "Impossible de charger les analytics.", "No se pudo cargar analitica."),
        backendUnreachable: text(
          "Backend unreachable. Start `npm run dev:backend` then refresh.",
          "Backend inaccessible. Lancez `npm run dev:backend` puis actualisez.",
          "Backend inaccesible. Inicia `npm run dev:backend` y actualiza."
        )
      },
      health: {
        title: text("Health indicators", "Indicateurs de sante", "Indicadores de salud"),
        description: text("Operational readiness and alerts.", "Etat operationnel et alertes.", "Estado operativo y alertas."),
        capacityTitle: text("Capacity", "Capacite", "Capacidad"),
        capacityText: text(
          "Occupancy, staffing coverage, and backlog by service type.",
          "Occupation, couverture equipe et backlog par type de service.",
          "Ocupacion, cobertura de personal y backlog por tipo de servicio."
        ),
        forecastsTitle: text("Forecasts", "Previsions", "Pronosticos"),
        forecastsText: text(
          "Predictive cues for rush hours with staffing suggestions.",
          "Signaux predictifs pour les pics avec suggestions de staffing.",
          "Senales predictivas para horas pico con sugerencias de personal."
        )
      }
    },
    profile: {
      title: text("Profile", "Profil", "Perfil"),
      description: text(
        "Identity, preferences, and stay history synced from backend.",
        "Identite, preferences et historique synchronises depuis le backend.",
        "Identidad, preferencias e historial sincronizados desde backend."
      ),
      refresh: text("Refresh", "Actualiser", "Actualizar"),
      refreshing: text("Refreshing...", "Actualisation...", "Actualizando..."),
      changeReservation: text("Change reservation", "Changer de reservation", "Cambiar reserva"),
      startCheckIn: text("Start check-in", "Commencer le check-in", "Comenzar check-in"),
      roomLabel: text("Room {{roomNumber}}", "Chambre {{roomNumber}}", "Habitacion {{roomNumber}}"),
      avatarHint: text(
        "Add a photo so staff can identify you.",
        "Pensez a ajouter une photo de vous pour permettre au personnel de vous identifier.",
        "Anade una foto para que el personal pueda identificarte."
      ),
      hub: {
        historyCard: text("Stay history and invoices", "Historique de sejours et factures", "Historial de estancias y facturas"),
        preferencesCard: text("Account preferences", "Preferences de compte", "Preferencias de cuenta"),
        loyaltyPointsTemplate: text("{{points}} points", "{{points}} points", "{{points}} puntos"),
        loyaltyDiscover: text("Discover my loyalty benefits", "Decouvrir mes avantages fidelite", "Descubrir mis ventajas de fidelidad"),
        reviewPrompt: text("Enjoying your stay?", "Vous profitez bien de votre sejour ?", "Disfrutas de tu estancia?"),
        reviewCta: text("Leave us a review!", "Laissez nous un avis !", "Dejanos tu opinion!"),
        reviewTitle: text("Your stay at {{hotelName}}", "Votre sejour a {{hotelName}}", "Tu estancia en {{hotelName}}"),
        reviewSubtitle: text("Leave a comment (optional)", "Laissez un commentaire (facultatif)", "Deja un comentario (opcional)"),
        reviewPlaceholder: text(
          "Your feedback helps us improve our services and meet your needs.",
          "Vos avis nous aide a ameliorer nos services et repondre a vos besoins.",
          "Tu opinion nos ayuda a mejorar nuestros servicios y atender tus necesidades."
        ),
        reviewSubmit: text("Submit", "Envoyer", "Enviar"),
        reviewThankYou: text("Thank you!", "Merci !", "Gracias!"),
        reviewThankYouSub: text("Your feedback helps us improve.", "Votre avis nous aide a nous ameliorer.", "Tu opinion nos ayuda a mejorar."),
        reviewConsentLabel: text(
          "I agree to be contacted by email following my request to provide more information if necessary.",
          "Je suis d'accord d'etre recontacte par email suite a ma demande pour donner plus d'informations si necessaire.",
          "Acepto ser contactado por correo electronico para proporcionar mas informacion si es necesario."
        ),
        privacyPolicy: text("Privacy policy", "Politique de confidentialite", "Politica de privacidad"),
        aboutApp: text("About StayOn", "A propos de StayOn", "Acerca de StayOn")
      },
      account: {
        title: text("Account", "Compte", "Cuenta"),
        description: text(
          "Manage your personal details.",
          "Gerez vos informations personnelles.",
          "Gestiona tus datos personales."
        ),
        editAction: text("Edit profile", "Modifier le profil", "Editar perfil"),
        saveAction: text("Save changes", "Enregistrer", "Guardar cambios"),
        savingAction: text("Saving...", "Enregistrement...", "Guardando..."),
        cancelAction: text("Cancel", "Annuler", "Cancelar"),
        updatedSuccess: text(
          "Profile updated successfully.",
          "Profil mis a jour avec succes.",
          "Perfil actualizado correctamente."
        ),
        updatedError: text(
          "Could not update profile.",
          "Impossible de mettre a jour le profil.",
          "No se pudo actualizar el perfil."
        ),
        fields: {
          firstName: text("First name", "Prenom", "Nombre"),
          lastName: text("Last name", "Nom", "Apellido"),
          email: text("Email address", "Adresse e-mail", "Correo electronico"),
          phone: text("Phone number", "Numero de telephone", "Numero de telefono")
        }
      },
      preferences: {
        title: text("Preferences", "Preferences", "Preferencias"),
        description: text(
          "Language and communication context for your stay.",
          "Langue et contexte de communication pour votre sejour.",
          "Idioma y contexto de comunicacion para tu estancia."
        ),
        languageLabel: text("Interface language", "Langue de l'interface", "Idioma de la interfaz"),
        currencyLabel: text("Billing currency", "Devise de facturation", "Moneda de facturacion"),
        localeNames: {
          en: text("English", "Anglais", "Ingles"),
          fr: text("French", "Francais", "Frances"),
          es: text("Spanish", "Espagnol", "Espanol")
        },
        menuItems: {
          personalInfo: text("Personal information", "Informations personnelles", "Informacion personal"),
          interfaceSettings: text("Interface settings", "Reglages de l'interface", "Ajustes de la interfaz"),
          communications: text("Communications", "Communications", "Comunicaciones"),
          paymentMethods: text("Saved payment methods", "Moyens de paiement enregistres", "Metodos de pago guardados")
        }
      },
      status: {
        title: text("Identity & payment status", "Statut identite et paiement", "Estado de identidad y pago"),
        description: text(
          "Verification and payment readiness from backend.",
          "Verification et statut de paiement depuis le backend.",
          "Verificacion y estado de pago desde backend."
        ),
        documentLabel: text("ID document", "Piece d'identite", "Documento de identidad"),
        paymentLabel: text("Payment method", "Moyen de paiement", "Metodo de pago"),
        verified: text("Verified", "Verifie", "Verificado"),
        missing: text("Missing", "Manquant", "Faltante"),
        onFile: text("On file", "Enregistre", "Registrado")
      },
      billing: {
        title: text("Billing history", "Historique de facturation", "Historial de facturacion"),
        description: text(
          "Invoices generated during your stay.",
          "Factures generees pendant votre sejour.",
          "Facturas generadas durante tu estancia."
        ),
        empty: text("No invoices yet.", "Aucune facture pour le moment.", "Aun no hay facturas."),
        pointsTemplate: text("+{{points}} pts", "+{{points}} pts", "+{{points}} pts")
      },
      loyalty: {
        title: text("Loyalty", "Fidelite", "Fidelidad"),
        pointsLabel: text("loyalty points", "points de fidelite", "puntos de fidelidad"),
        silverTier: text("Silver", "Silver", "Silver"),
        goldTier: text("Gold", "Gold", "Gold"),
        progressTemplate: text("Only {{points}} more points.", "Plus que {{points}} points.", "Solo {{points}} puntos mas."),
        discountsTitle: text("Discounts with your benefits", "En reduction avec a vos avantages", "Descuentos con tus beneficios")
      },
      security: {
        title: text("Security", "Securite", "Seguridad"),
        description: text(
          "Session and reservation management.",
          "Gestion de session et reservation.",
          "Gestion de sesion y reserva."
        ),
        signOut: text("Sign out", "Se deconnecter", "Cerrar sesion")
      },
      guestIdentityTitle: text("Guest identity", "Identite client", "Identidad del huesped"),
      guestIdentityBadge: text("Secure", "Securise", "Seguro"),
      guestIdentityDescription: text("Documents, signatures, and stay history.", "Documents, signatures et historique.", "Documentos, firmas e historial."),
      connectStay: text("Connect a stay to see invoices.", "Connectez un sejour pour voir les factures.", "Conecta una estancia para ver facturas."),
      loading: text("Loading...", "Chargement...", "Cargando..."),
      noInvoices: text("No invoices yet.", "Aucune facture pour le moment.", "Aun no hay facturas."),
      loyaltyPointsTemplate: text("Loyalty points earned: +{{points}} pts", "Points fidelite gagnes : +{{points}} pts", "Puntos de fidelidad ganados: +{{points}} pts"),
      invoiceDownloadAria: text("Download invoice", "Telecharger la facture", "Descargar factura"),
      errors: {
        loadInvoices: text("Could not load invoices.", "Impossible de charger les factures.", "No se pudieron cargar las facturas."),
        backendUnreachable: text(
          "Backend unreachable. Start `npm run dev:backend` then refresh.",
          "Backend inaccessible. Lancez `npm run dev:backend` puis actualisez.",
          "Backend inaccesible. Inicia `npm run dev:backend` y actualiza."
        )
      },
      payments: {
        title: text("Payments & notifications", "Paiements & notifications", "Pagos y notificaciones"),
        description: text("Control channels and saved cards.", "Controle des canaux et cartes enregistrees.", "Control de canales y tarjetas guardadas."),
        paymentMethodsTitle: text("Payment methods", "Moyens de paiement", "Metodos de pago"),
        paymentMethodsText: text(
          "On-file cards with tokenized storage and 3DS where required.",
          "Cartes enregistrees avec stockage tokenise et 3DS si necessaire.",
          "Tarjetas guardadas con almacenamiento tokenizado y 3DS cuando aplique."
        ),
        alertsTitle: text("Alerts", "Alertes", "Alertas"),
        alertsText: text(
          "Control push, SMS, and email preferences per department.",
          "Controle des preferences push, SMS et email par departement.",
          "Controla preferencias push, SMS y email por departamento."
        ),
        localizationTitle: text("Localization", "Localisation", "Localizacion"),
        localizationText: text(
          "Language and currency toggles for consistent communications.",
          "Options langue et devise pour une communication coherente.",
          "Opciones de idioma y moneda para una comunicacion coherente."
        )
      }
    },
    operations: {
      title: text("Operations", "Operations", "Operaciones"),
      description: text(
        "Staff consoles per department with routing, permissions, and audit trails.",
        "Consoles staff par departement avec routage, permissions et audits.",
        "Consolas de staff por departamento con enrutamiento, permisos y auditoria."
      ),
      configureRoles: text("Configure roles", "Configurer les roles", "Configurar roles"),
      createWorkflow: text("Create workflow", "Creer un workflow", "Crear flujo"),
      departmentConsolesTitle: text("Department consoles", "Consoles departements", "Consolas por departamento"),
      departmentConsolesBadge: text("Staff", "Staff", "Staff"),
      departmentConsolesDescription: text(
        "Concierge, reception, housekeeping, spa, and F&B views.",
        "Vues concierge, reception, housekeeping, spa et F&B.",
        "Vistas de concierge, recepcion, housekeeping, spa y F&B."
      ),
      departmentBullets: [
        text(
          "Role-based access with department-scoped visibility by default.",
          "Acces par role avec visibilite limitee au departement par defaut.",
          "Acceso por rol con visibilidad por departamento por defecto."
        ),
        text(
          "Task assignment, status updates, and SLA tracking for each request.",
          "Affectation des taches, suivi des statuts et SLA pour chaque demande.",
          "Asignacion de tareas, actualizacion de estado y seguimiento SLA."
        ),
        text(
          "Internal notes and tags for escalations across teams.",
          "Notes internes et tags pour les escalades inter-equipes.",
          "Notas internas y etiquetas para escalaciones entre equipos."
        )
      ],
      governanceTitle: text("Governance", "Gouvernance", "Gobernanza"),
      governanceDescription: text("Security, payments, and data protection.", "Securite, paiements et protection des donnees.", "Seguridad, pagos y proteccion de datos."),
      complianceTitle: text("Compliance", "Conformite", "Cumplimiento"),
      complianceText: text(
        "Audit logs for ID capture, payments, and consent; strict separation of duties.",
        "Journaux d'audit pour identite, paiements et consentement; separation stricte des roles.",
        "Registros de auditoria para identidad, pagos y consentimiento; separacion estricta."
      ),
      workflowsTitle: text("Workflows", "Workflows", "Flujos"),
      workflowsText: text(
        "Reusable workflows for check-in, escalations, maintenance, and service recovery.",
        "Workflows reutilisables pour check-in, escalades, maintenance et recuperation.",
        "Flujos reutilizables para check-in, escalaciones, mantenimiento y recuperacion."
      )
    }
  }
};

export function resolveGuestContent(locale = "en", override = null) {
  const normalizedLocale = localeCodes.includes(locale) ? locale : "en";
  const merged = deepMerge(defaultGuestContent, isPlainObject(override) ? override : {});
  return localizeNode(merged, normalizedLocale);
}
