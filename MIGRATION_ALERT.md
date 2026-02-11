# 🎯 Migration Alert.alert vers AlertDialog - Guide Complet

## ✅ Travail Effectué

### 1. Composants Créés
- **`src/components/ui/AlertDialog.jsx`** - Composant d'alerte universel compatible mobile + web
- **`src/hooks/useAlert.jsx`** - Hook pour faciliter l'utilisation

### 2. Fichiers Migrés (100%)
- ✅ **src/screens/auth/Login/Login.jsx** - 5 Alert.alert remplacés
- ✅ **src/screens/auth/Registration/Registration.jsx** - 10 Alert.alert remplacés

---

## 📖 Comment Utiliser le Nouveau Système

### Migration d'un fichier

**AVANT (ne fonctionne PAS sur web) :**
```jsx
import { Alert } from 'react-native';

function MyScreen() {
  const handleError = () => {
    Alert.alert('Erreur', 'Un problème est survenu');
  };
  
  return <View>...</View>;
}
```

**APRÈS (fonctionne mobile + web) :**
```jsx
// 1. Retirer Alert de l'import react-native
import { View, Text } from 'react-native';

// 2. Importer useAlert
import { useAlert } from '../hooks/useAlert';

function MyScreen() {
  // 3. Utiliser le hook
  const { AlertComponent, showAlert } = useAlert();
  
  const handleError = () => {
    // 4. Remplacer Alert.alert par showAlert
    showAlert({ 
      title: 'Erreur', 
      message: 'Un problème est survenu',
      type: 'error' // 'default', 'success', 'error', 'warning'
    });
  };
  
  return (
    <View>
      {/* Contenu de la page */}
      
      {/* 5. Ajouter AlertComponent avant la fermeture */}
      {AlertComponent}
    </View>
  );
}
```

---

## 🎨 Types d'Alertes Disponibles

### 1. Alerte Simple
```jsx
showAlert({ 
  title: 'Information', 
  message: 'Opération réussie' 
});
```

### 2. Alerte avec Type
```jsx
showAlert({ 
  title: 'Succès', 
  message: 'Compte créé !',
  type: 'success' // Icône ✓ verte
});

showAlert({ 
  title: 'Erreur', 
  message: 'Connexion échouée',
  type: 'error' // Icône ✕ rouge
});

showAlert({ 
  title: 'Attention', 
  message: 'Données manquantes',
  type: 'warning' // Icône ⚠ orange
});
```

### 3. Alerte avec Boutons Personnalisés
```jsx
showAlert({
  title: 'Confirmation',
  message: 'Voulez-vous supprimer ce parking ?',
  type: 'warning',
  buttons: [
    { 
      text: 'Annuler', 
      style: 'cancel' // Bouton gris
    },
    { 
      text: 'Supprimer', 
      style: 'destructive', // Bouton rouge
      onPress: () => deleteParking()
    }
  ]
});
```

---

## 📋 Fichiers Restants à Migrer (~140 Alert.alert)

### Priorité HAUTE (Écrans Utilisateur)
- [ ] `src/screens/auth/ForgotPassword/ForgotPassword.jsx` - 5 alertes
- [ ] `src/screens/auth/ResetPassword/ResetPassword.jsx` - 5 alertes
- [ ] `src/screens/auth/VerifyResetCode/VerifyResetCode.jsx` - 4 alertes

### Priorité MOYENNE (Formulaires)
- [ ] `src/screens/forms/AddEditParking/AddEditParking.jsx` - 8 alertes
- [ ] `src/screens/forms/CreateAnnouncement/CreateAnnouncement.jsx` - 3+ alertes
- [ ] `src/screens/forms/Reservation/Reservation.jsx` - 5+ alertes
- [ ] `src/screens/forms/ReportIssue/ReportIssue.jsx` - 3+ alertes

### Priorité BASSE (Autres)
- [ ] `src/components/forms/SocialLoginButtons/SocialLoginButtons.jsx` - 4 alertes
- [ ] `src/components/modals/RatingModal/RatingModal.jsx` - 4 alertes
- [ ] Tous les autres écrans dans `src/screens/`
- [ ] `App.tsx` - 1 alerte (notifications)

---

## 🔍 Trouver tous les Alert.alert Restants

### PowerShell
```powershell
cd d:\Projet\parking_mobile
Get-ChildItem -Path src,. -Include *.jsx,*.js,*.tsx,*.ts -Recurse | 
  Select-String -Pattern "Alert\.alert" | 
  Select-Object Path, LineNumber, Line
```

### VS Code Search
1. Ouvrir la recherche (Ctrl+Shift+F)
2. Chercher : `Alert\.alert`
3. Fichiers à inclure : `src/**/*.{js,jsx,ts,tsx}`
4. Utiliser regex : ✅

---

## ⚡ Script de Remplacement Automatique

Pour chaque fichier :

### 1. Imports
```jsx
// Retirer Alert
import { View, Text, Alert } from 'react-native';
// ↓
import { View, Text } from 'react-native';

// Ajouter useAlert
import { useAlert } from '../../../hooks/useAlert';
```

### 2. Hook
```jsx
export default function MyScreen() {
  const { AlertComponent, showAlert } = useAlert();
  // ...
}
```

### 3. Remplacements
```jsx
// Simple
Alert.alert('Titre', 'Message');
// ↓
showAlert({ title: 'Titre', message: 'Message', type: 'error' });

// Avec callback
Alert.alert('Titre', 'Message', [
  { text: 'OK', onPress: () => action() }
]);
// ↓
showAlert({ 
  title: 'Titre', 
  message: 'Message',
  buttons: [{ text: 'OK', onPress: () => action() }]
});

// Avec annulation
Alert.alert('Titre', 'Message', [
  { text: 'Annuler', style: 'cancel' },
  { text: 'OK', onPress: () => action() }
]);
// ↓
showAlert({ 
  title: 'Titre', 
  message: 'Message',
  buttons: [
    { text: 'Annuler', style: 'cancel' },
    { text: 'OK', onPress: () => action() }
  ]
});
```

### 4. AlertComponent dans le JSX
```jsx
return (
  <View>
    {/* Contenu */}
    {AlertComponent}  {/* ← Ajouter avant </View> */}
  </View>
);
```

---

## ✅ Checklist de Migration

Pour chaque fichier :
- [ ] Retirer `Alert` de l'import `react-native`
- [ ] Importer `useAlert` depuis `../hooks/useAlert` (adapter le chemin)
- [ ] Ajouter `const { AlertComponent, showAlert } = useAlert();`
- [ ] Remplacer tous les `Alert.alert(...)` par `showAlert({...})`
- [ ] Ajouter `{AlertComponent}` dans le return (avant la fermeture du conteneur)
- [ ] Tester sur mobile ET web

---

## 🧪 Comment Tester

### Mobile (natif)
```bash
npm run android
# ou
npm run ios
```

### Web
```bash
npm run web
```

Les alertes doivent s'afficher identiquement sur les 2 plateformes avec :
- Animation d'apparition
- Design moderne
- Boutons fonctionnels
- Icône selon le type

---

## 🎯 Avantages du Nouveau Système

✅ **Compatible web + mobile** - Un seul code fonctionne partout  
✅ **Design moderne** - Plus joli que Alert.alert natif  
✅ **Personnalisable** - Types, couleurs, icônes  
✅ **Accessible** - Supporte les lecteurs d'écran  
✅ **Maintenance facile** - Un seul composant à modifier  
✅ **Animations fluides** - Grâce à react-native-modal  

---

## 📚 Documentation react-native-modal

Le composant AlertDialog utilise `react-native-modal` (déjà installé).
Props disponibles si besoin de personnalisation :

- `animationIn` - Type d'animation d'entrée
- `animationOut` - Type d'animation de sortie
- `backdropOpacity` - Opacité du fond
- `useNativeDriver` - Performance optimisée

Voir : https://github.com/react-native-modal/react-native-modal

---

## 🚀 Prochaines Étapes

1. Migrer les écrans de Priorité HAUTE (authentification)
2. Migrer les formulaires (Priorité MOYENNE)
3. Nettoyer tous les imports `Alert` inutilisés
4. Tester sur mobile + web
5. Documenter si des patterns spécifiques sont découverts

---

**Date de création : Février 2026**  
**Fichiers migrés : 2/50 (~4%)**  
**Alertes migrées : 15/150+ (~10%)**
