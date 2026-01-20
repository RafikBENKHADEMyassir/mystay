# Recommandation Système de Clé Digitale – MyStay

**Date :** Décembre 2024  
**Objet :** Choix d'une solution de clé digitale agnostique (indépendante du fabricant de serrures)

---

## 📋 Contexte

Dans le cadre du développement de l'application MyStay, nous devons intégrer une solution de clé digitale permettant aux clients d'accéder à leur chambre via leur smartphone. 

**Critère principal :** La solution doit être **agnostique** — c'est-à-dire compatible avec différents fabricants de serrures électroniques (ASSA ABLOY/Vingcard, Salto, Dormakaba, Onity, etc.) afin de s'adapter aux équipements existants des hôtels partenaires.

---

## 🏆 Notre Recommandation : Alliants Digital Key

Après analyse comparative des solutions disponibles sur le marché, nous recommandons **Alliants Digital Key** comme solution privilégiée pour MyStay.

### Pourquoi Alliants ?

| Critère | Alliants Digital Key |
|---------|---------------------|
| **Compatibilité serrures** | ✅ ASSA ABLOY, Salto, Dormakaba, Onity, et autres |
| **Intégration PMS** | ✅ Opera, Mews, Cloudbeds, et la plupart des PMS majeurs |
| **Sans application tierce** | ✅ Fonctionne via Apple Wallet / Google Wallet |
| **Fonctionne hors-ligne** | ✅ Oui, même appareil verrouillé ou sans connexion |
| **Technologie** | BLE (Bluetooth Low Energy) + NFC |
| **Sécurité** | Chiffrement AES de niveau entreprise |
| **API disponible** | ✅ Oui, pour intégration personnalisée |

---

## ✅ Avantages Clés

### 1. Expérience Client Simplifiée
- **Aucun téléchargement d'application supplémentaire** : la clé est stockée directement dans le portefeuille digital du smartphone (Apple Wallet / Google Wallet)
- Activation instantanée après le check-in digital
- Partage de clé possible avec accompagnants (famille, amis)
- Fonctionne même si le téléphone est verrouillé ou hors connexion

### 2. Compatibilité Universelle
- S'intègre avec **les serrures existantes** des hôtels partenaires
- Pas de remplacement matériel nécessaire dans la majorité des cas
- Compatible avec les principaux PMS du marché (Oracle Opera, Mews, Cloudbeds, Protel, etc.)

### 3. Sécurité Renforcée
- Chiffrement de niveau entreprise
- Clés individuelles et révocables à tout moment
- Désactivation automatique au check-out
- Traçabilité complète des accès

### 4. Personnalisation & Fidélisation
- Possibilité de personnaliser l'apparence de la clé digitale selon le branding de l'hôtel
- Différenciation visuelle selon le statut fidélité (Silver, Gold, Platinum)
- Renforce l'image premium de l'établissement

### 5. Écologie & Réduction des Coûts
- Élimination des cartes-clés en plastique (environ 6 milliards produites chaque année dans le monde)
- Réduction des coûts de remplacement des cartes perdues
- Contribution aux objectifs RSE de l'hôtel

---

## 🔄 Alternatives Évaluées

| Solution | Points forts | Points faibles |
|----------|-------------|----------------|
| **OpenKey** | Large compatibilité, API robuste | Nécessite une app dédiée |
| **4SUITES** | API-first, moderne | Moins mature sur le marché |
| **Mews Digital Key** | Excellente si PMS Mews | Limité à l'écosystème Mews |
| **Onity DirectKey** | Bonne sécurité | Limité aux serrures Onity |

---

## 🔧 Intégration Technique avec MyStay

L'intégration d'Alliants Digital Key dans MyStay suivra ce flux :

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MyStay App    │────▶│  Alliants API   │────▶│   PMS Hôtel     │
│  (Check-in OK)  │     │  (Génère clé)   │     │ (Synchro accès) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Apple Wallet / │     │ Serrure chambre │
│  Google Wallet  │────▶│   (BLE/NFC)     │
└─────────────────┘     └─────────────────┘
```

### Étapes d'intégration :
1. **Connexion API** entre MyStay et Alliants
2. **Synchronisation PMS** pour récupérer les données de réservation
3. **Génération automatique** de la clé après check-in validé
4. **Envoi au wallet** du client (Apple Wallet / Google Wallet)
5. **Désactivation automatique** au moment du check-out

---

## 💰 Modèle Économique

Le pricing d'Alliants est généralement basé sur :
- **Frais de setup initial** (intégration technique)
- **Abonnement mensuel** par chambre ou par établissement
- **Frais par transaction** (optionnel selon le contrat)

> 📌 *Une demande de devis personnalisé auprès d'Alliants est nécessaire pour obtenir les tarifs exacts selon le nombre d'hôtels et de chambres à équiper.*

---

## 📞 Prochaines Étapes

1. **Valider le choix** d'Alliants Digital Key avec le client
2. **Contacter Alliants** pour obtenir un devis et les conditions d'intégration
3. **Planifier un POC** (Proof of Concept) sur un hôtel pilote
4. **Intégrer l'API** dans l'architecture MyStay
5. **Tester** le flux complet check-in → clé digitale → accès chambre

---

## 📎 Ressources

- Site officiel : [https://alliants.com/products/digital-key](https://alliants.com/products/digital-key)
- Documentation API : à demander lors du contact commercial

---

**Conclusion**

Alliants Digital Key représente la solution la plus adaptée pour MyStay grâce à son approche véritablement agnostique, son intégration native avec les portefeuilles digitaux (sans app tierce), et sa compatibilité étendue avec les différents écosystèmes PMS et serrures du marché hôtelier. Cette solution permettra à MyStay de proposer une expérience client fluide et moderne, quel que soit l'équipement existant de l'hôtel partenaire.


