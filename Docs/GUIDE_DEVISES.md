# Guide de Gestion des Devises 💱

## 📋 Vue d'ensemble

Le système de gestion des devises utilise l'API native `Intl.NumberFormat` pour un formatage international correct, conforme aux recommandations **FormatJS/react-intl**.

## ✨ Avantages de cette approche

### ✅ Recommandations Context7 (FormatJS)
- ✅ Utilise l'API standard JavaScript (`Intl.NumberFormat`)
- ✅ Formatage automatique selon la locale (position du symbole, séparateurs)
- ✅ Support natif de 150+ devises
- ✅ Pas de dépendance externe
- ✅ Changement dynamique de devise sans redémarrage

### ❌ Ancienne approche manuelle
- ❌ Formatage manuel avec `.toFixed()`
- ❌ Position du symbole hardcodée
- ❌ Pas de support des règles locales
- ❌ Modification nécessite changement de code

## 📦 Devises disponibles

Par défaut, 4 devises sont configurées :

```javascript
EUR - Euro (€)           - Locale: fr-FR - Format: 1 234,56 €
USD - Dollar américain ($) - Locale: en-US - Format: $1,234.56
MGA - Ariary malgache (Ar) - Locale: fr-MG - Format: 1 235 Ar
GBP - Livre sterling (£)   - Locale: en-GB - Format: £1,234.56
```

## 🔧 Utilisation

### 1. Formater un prix (recommandé)

```javascript
import { formatPrice } from './src/config/constants';

// Formatage simple
formatPrice(1234.56)  // "1 234,56 €" (selon la devise actuelle)

// Sans décimales
formatPrice(1234.56, false)  // "1 235 €"

// Prix horaire
formatHourlyRate(25)  // "25,00 €/h"
```

### 2. Changer la devise de l'application

```javascript
import { setCurrency } from './src/config/constants';

// Changer en Dollar
await setCurrency('USD');

// Changer en Ariary
await setCurrency('MGA');
```

### 3. Composant de sélection de devise

Intégrer dans un écran de paramètres :

```jsx
import CurrencySelector from './src/components/settings/CurrencySelector';

function SettingsScreen() {
  return (
    <View>
      <Text style={styles.header}>Paramètres</Text>
      <CurrencySelector />
    </View>
  );
}
```

## 🎨 Interface utilisateur

Le composant `CurrencySelector` fournit :
- ✅ Liste visuelle des devises disponibles
- ✅ Symbole + nom + code ISO
- ✅ Indication visuelle de la devise sélectionnée
- ✅ Sauvegarde automatique dans AsyncStorage
- ✅ Message de confirmation

## 🔄 Persistance

La devise choisie est automatiquement :
1. ✅ Sauvegardée dans AsyncStorage
2. ✅ Chargée au démarrage de l'app (App.tsx)
3. ✅ Appliquée à tous les prix affichés

## 🌍 Ajouter une nouvelle devise

Modifier `src/config/constants.js` :

```javascript
export const AVAILABLE_CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'fr-FR' },
  { code: 'USD', name: 'Dollar américain', symbol: '$', locale: 'en-US' },
  { code: 'MGA', name: 'Ariary malgache', symbol: 'Ar', locale: 'fr-MG' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£', locale: 'en-GB' },
  
  // Ajouter ici :
  { code: 'JPY', name: 'Yen japonais', symbol: '¥', locale: 'ja-JP' },
  { code: 'CAD', name: 'Dollar canadien', symbol: '$', locale: 'fr-CA' },
];
```

## 🔧 Backend (API) - Optionnel

Pour stocker la préférence utilisateur côté serveur :

### 1. Ajouter le champ dans la base

```sql
ALTER TABLE users ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'EUR';
```

### 2. Retourner dans la réponse d'authentification

```java
// AuthenticationResponse.java
public class AuthenticationResponse {
    private String token;
    private Long userId;
    private String userName;
    private String email;
    private String preferredCurrency;  // EUR, USD, MGA, etc.
}
```

### 3. Synchroniser côté frontend

```javascript
// Après login réussi
const response = await authService.login(email, password);
if (response.preferredCurrency) {
  await setCurrency(response.preferredCurrency);
}
```

## 📊 Exemples de formatage

| Montant | Devise | Résultat |
|---------|--------|----------|
| 1234.56 | EUR    | 1 234,56 € |
| 1234.56 | USD    | $1,234.56 |
| 1234.56 | MGA    | 1 235 Ar |
| 1234.56 | GBP    | £1,234.56 |
| 25.50   | EUR /h | 25,50 €/h |

## 🎯 Migrations

L'ancien code continue de fonctionner grâce à la compatibilité :

```javascript
// ✅ Ancienne syntaxe toujours fonctionnelle
import { CURRENCY } from './src/config/constants';

console.log(CURRENCY.symbol);  // "€"
console.log(CURRENCY.code);    // "EUR"
console.log(CURRENCY.name);    // "Euro"
```

## 🚀 Prochaines étapes

1. ✅ Intégrer `CurrencySelector` dans un écran de paramètres
2. ⏳ Ajouter le champ `preferred_currency` dans la base (optionnel)
3. ⏳ Synchroniser avec le backend lors du login (optionnel)
4. ⏳ Ajouter d'autres devises selon les besoins

## 📝 Notes techniques

- Le formatage utilise `Intl.NumberFormat` avec fallback manuel
- Compatible React Native (iOS, Android, Web)
- Pas de dépendance externe (API native)
- Performance optimale (pas de calcul complexe)

## 🔗 Références

- [FormatJS Documentation](https://formatjs.io/docs/react-intl/components#formattednumber)
- [Intl.NumberFormat MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [ISO 4217 Currency Codes](https://en.wikipedia.org/wiki/ISO_4217)
