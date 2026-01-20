import type { Locale } from "./locales";

export type CheckInStrings = {
  topbarTitle: string;
  hotelNameFallback: string;
  personalTitle: string;
  identityTitle: string;
  finalizeTitle: string;
  interfaceLanguage: string;
  stayReason: string;
  reasonPersonal: string;
  reasonBusiness: string;
  yourInfo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  genderMale: string;
  genderFemale: string;
  genderNonBinary: string;
  validate: string;
  idLabel: string;
  uploadHint: string;
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
  sessionError: string;
};

export function localeLabel(locale: Locale) {
  switch (locale) {
    case "fr":
      return "Français";
    case "en":
      return "English";
    case "es":
      return "Español";
  }
}

export function requiredMessage(locale: Locale) {
  return locale === "fr" ? "Ce champ est requis." : "This field is required.";
}

export function formatMoney(locale: Locale, amountCents: number) {
  const languageTag = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.NumberFormat(languageTag, { style: "currency", currency: "EUR" }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} EUR`;
  }
}

export function getCheckInStrings(locale: Locale): CheckInStrings {
  if (locale === "fr") {
    return {
      topbarTitle: "Check-in",
      hotelNameFallback: "Hôtel Four Seasons",
      personalTitle: "Informations personnelles",
      identityTitle: "Justificatif d'identité",
      finalizeTitle: "Finalisez votre check-in",
      interfaceLanguage: "Langue de l'interface",
      stayReason: "Raison de votre séjour",
      reasonPersonal: "Personnel",
      reasonBusiness: "Travail",
      yourInfo: "Vos informations",
      firstName: "Prénom",
      lastName: "Nom de famille",
      email: "Adresse e-mail",
      phone: "Téléphone",
      gender: "Vous préférez être identifié comme…",
      genderMale: "Homme",
      genderFemale: "Femme",
      genderNonBinary: "Non-binaire",
      validate: "Valider",
      idLabel: "Pièce d'identité",
      uploadHint: "Déposez vos fichiers…",
      accepted: "Fichiers acceptés: PNG, JPG ou PDF",
      maxFiles: "Max. 2 fichiers",
      maxSize: "Max. 4MB par fichier",
      readable: "Vos informations doivent être lisibles",
      summaryTitle: "Résumé de vos informations",
      addSomething: "Voulez-vous ajouter quelques chose d’autre à votre chambre ?",
      details: "Détails",
      total: "Total",
      confirmPay: "Confirmer et payer",
      free: "Gratuit",
      sessionError: "Backend indisponible. Lancez `npm run dev:backend` pour activer le mode démo."
    };
  }

  return {
    topbarTitle: "Check-in",
    hotelNameFallback: "Four Seasons Hotel",
    personalTitle: "Personal information",
    identityTitle: "ID document",
    finalizeTitle: "Finish your check-in",
    interfaceLanguage: "Interface language",
    stayReason: "Reason for your stay",
    reasonPersonal: "Personal",
    reasonBusiness: "Business",
    yourInfo: "Your details",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone",
    gender: "You prefer to be identified as…",
    genderMale: "Male",
    genderFemale: "Female",
    genderNonBinary: "Non-binary",
    validate: "Continue",
    idLabel: "Identity document",
    uploadHint: "Drop your files…",
    accepted: "Accepted files: PNG, JPG, or PDF",
    maxFiles: "Max. 2 files",
    maxSize: "Max. 4MB per file",
    readable: "Your information must be readable",
    summaryTitle: "Summary",
    addSomething: "Would you like to add anything else to your room?",
    details: "Details",
    total: "Total",
    confirmPay: "Confirm and pay",
    free: "Free",
    sessionError: "Backend unreachable. Start `npm run dev:backend` to enable demo mode."
  };
}

