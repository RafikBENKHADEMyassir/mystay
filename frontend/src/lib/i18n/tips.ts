import type { Locale } from "./locales";

export type TipStrings = {
  dialogTitle: string;
  dialogDescription: (staffName: string, department: string) => string;
  selectAmount: string;
  customAmount: string;
  customPlaceholder: string;
  tipAmount: string;
  cancel: string;
  sendTip: string;
  processing: string;
  leaveATip: string;
};

export function getTipStrings(locale: Locale): TipStrings {
  if (locale === "fr") {
    return {
      dialogTitle: "Laisser un pourboire",
      dialogDescription: (staffName, department) => 
        `Montrez votre appréciation pour ${staffName} de ${department}`,
      selectAmount: "Sélectionner le montant",
      customAmount: "Ou entrer un montant personnalisé",
      customPlaceholder: "0.00",
      tipAmount: "Montant du pourboire",
      cancel: "Annuler",
      sendTip: "Envoyer le pourboire",
      processing: "Traitement...",
      leaveATip: "Laisser un pourboire",
    };
  }

  if (locale === "es") {
    return {
      dialogTitle: "Dejar propina",
      dialogDescription: (staffName, department) => 
        `Muestre su aprecio por ${staffName} de ${department}`,
      selectAmount: "Seleccionar cantidad",
      customAmount: "O ingrese una cantidad personalizada",
      customPlaceholder: "0.00",
      tipAmount: "Cantidad de propina",
      cancel: "Cancelar",
      sendTip: "Enviar propina",
      processing: "Procesando...",
      leaveATip: "Dejar propina",
    };
  }

  return {
    dialogTitle: "Leave a Tip",
    dialogDescription: (staffName, department) => 
      `Show your appreciation for ${staffName} from ${department}`,
    selectAmount: "Select Amount",
    customAmount: "Or Enter Custom Amount",
    customPlaceholder: "0.00",
    tipAmount: "Tip Amount",
    cancel: "Cancel",
    sendTip: "Send Tip",
    processing: "Processing...",
    leaveATip: "Leave a Tip",
  };
}
