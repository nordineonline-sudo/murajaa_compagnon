# Murajaa Compagnon

**Version 0.9** — Gestionnaire de révision du Coran

## Description

Murajaa Compagnon est une application mobile (Android/iOS) et web construite avec Expo / React Native. Elle vous aide à organiser et suivre votre révision du Coran au quotidien, sans dépendre d'une connexion internet.

## Fonctionnalités (v0.9)

- **Tableau de bord** : vue d'ensemble de la progression (taux de complétion, statistiques hebdomadaires)
- **Tâches du jour** : liste des révisions planifiées, marquer comme fait ou passer
- **Plan de révision** : configuration du nombre d'unités par jour et du rythme
- **Paramètres** : rappels quotidiens, thème, préférences
- **Onboarding** : configuration initiale guidée (objectif, rythme, heures de rappel)

## Limitations connues (v0.9)

- Les notifications sont partiellement supportées sur web (mock)
- La base de données est simulée sur web (les données ne persistent pas entre sessions web)

## Stack technique

- [Expo](https://expo.dev) SDK 54
- React Native 0.76
- expo-router (navigation)
- expo-sqlite (stockage local natif)
- Zustand (state management)
- TypeScript

## Lancer l'application

```bash
# Installer les dépendances
npm install

# Android / iOS via tunnel (Expo Go)
npx expo start --tunnel

# Web
npx expo start --web
```

## Compatibilité

- Expo Go SDK 54 (Android & iOS)
- Navigateurs modernes (Chrome, Firefox, Safari) via `--web`
