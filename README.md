# 🇨🇳 CHINA 2027 — Carnet de Bord & Candidatures Universitaires

> **Plateforme interactive et carnet de route pour la préparation de nos candidatures universitaires en Chine (Rentrée Septembre 2027).**

[![Online Demo](https://img.shields.io/badge/Site%20en%20Ligne-GitHub%20Pages-DE2910?style=for-the-badge&logo=github)](https://ofggout880.github.io/China-2027/)
[![Intake](https://img.shields.io/badge/Rentrée-Septembre%202027-FFDE00?style=for-the-badge&labelColor=161b22)](https://ofggout880.github.io/China-2027/)
[![License](https://img.shields.io/badge/Projet-Personnel-0052D9?style=for-the-badge)](https://ofggout880.github.io/China-2027/)

---

## 🌟 Présentation du Projet

Ce site web interactif a été conçu comme le **centre de pilotage unique** de notre projet d'expatriation étudiante en République Populaire de Chine pour **Septembre 2027**.

Il permet de structurer, documenter et suivre chaque étape de notre préparation sur 2 ans :
- 🎯 **Double espace candidat individualisé** permettant de séparer nos recherches, nos universités favorites, nos checklists de documents et nos notes personnelles.
- 👦 **Parcours Matthieu** : Spécialisation en **STIM, Informatique & Intelligence Artificielle** (Master / immersion au sein des meilleures universités d'ingénierie de la Ligue C9).
- 👧 **Parcours Agathe** : Spécialisation en **Management, Commerce International & Langues** (Programmes d'excellence en gestion et affaires sino-européennes).

---

## ✨ Fonctionnalités Principales

### 1. 🌐 Environnement 3D Immersif & Identité Visuelle
- Globe terrestre 3D interactif développé avec **Three.js** avec balise lumineuse sur Pékin et champ stellaire animé.
- Interface moderne en *Dark Theme* sublimée par les teintes officielles rouge impérial (`#DE2910`) et or éclatant (`#FFDE00`).
- Architecture **Mobile-First** fluide et optimisée pour smartphones, tablettes et écrans larges.

### 2. ⏳ Compte à Rebours & Dashboard Stratégique
- Compteur en temps réel (jours, heures, minutes, secondes) ciblant les dates limites d'inscription de **Septembre 2027**.
- Données macroéconomiques et statistiques clés sur l'enseignement supérieur chinois (bourses CSC, répartition des disciplines, flux d'étudiants internationaux).
- Flux d'actualités universitaires et d'opportunités d'études.

### 3. 🎓 Explorateur d'Universités & Carte Interactive
- Répertoire complet des universités prestigieuses de la **Ligue C9** (Tsinghua, Peking University, Fudan, SJTU, Zhejiang, USTC, Harbin, Xi'an Jiaotong, Nanjing) et partenaires clés.
- Moteur de recherche multicritères instantané : recherche par nom en **Français**, **Anglais**, **Pinyin** ou **Caractères chinois (Hanzi)**, par ville et par domaine d'études.
- **Carte interactive Google Maps** intégrée pour visualiser et géolocaliser instantanément les campus à travers la Chine.
- Système de mise en favoris personnalisable par profil.

### 4. 📈 Plan d'Apprentissage Linguistique (HSK 1 à 6)
- Timeline pédagogique échelonnée par niveau du HSK 1 au HSK 6 (objectifs de vocabulaire, délais et ressources recommandées).
- Suivi d'avancement interactif avec calcul de progression en temps réel.

### 5. 📋 Checklist Complète des Dossiers de Candidature
- Suivi rigoureux de l'ensemble des pièces requises pour l'admission et le visa :
  - Passeport valide & photos d'identité biométriques.
  - Diplômes et relevés de notes traduits et légalisés / apostillés.
  - Certificats de langue (HSK, IELTS / TOEFL).
  - Lettres de recommandation académiques et lettre de motivation (*Personal Statement*).
  - Formulaire de santé internationale (Bilan médical d'expatriation).
  - Formulaire de visa étudiant (**JW202 / JW201**) et visa **X1**.

### 6. 📝 Bloc-Notes & Espace Candidat Dédié (Menu Burger)
- Bloc-notes personnel indépendant pour Matthieu et pour Agathe.
- Outils de saisie rapide : insertion de liens URL, puces, cases à cocher (`[ ]`) et horodatage automatique.
- Sauvegarde locale automatique instantanée (*autosave*).

---

## 🛠️ Architecture & Technologies

- **Frontend Core** : JavaScript ES2022 modulaire (sans framework lourd, performances et réactivité optimales).
- **Rendu 3D** : Three.js (WebGL avec fallback 2D).
- **Cartographie** : Google Maps JavaScript API.
- **State Management** : Store réactif sur-mesure avec persistance `localStorage` compartimentée par profil.
- **Internationalisation** : Module i18n bilingue (Français 🇫🇷 / Anglais 🇬🇧).
- **Tests Automatisés** : Suite complète de 139 tests unitaires, stress tests et validation de schéma (Node.js test runner).
- **Déploiement** : GitHub Pages avec build automatisé et optimisé.

---

## 🚀 Démarrage en Local

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- npm

### Installation & Lancement

```bash
# 1. Cloner le dépôt
git clone https://github.com/ofggout880/China-2027.git
cd China-2027/website

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement local
npm run dev

# 4. Lancer la suite de tests
npm run test

# 5. Compiler pour la production
npm run build
```

---

## 👥 Auteurs & Candidats

- **👦 Matthieu GOUT** — STIM & Intelligence Artificielle  
- **👧 Agathe** — Management & Commerce International  

*Projet préparé pour la rentrée universitaire de Septembre 2027.*
