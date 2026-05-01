# 🏥 Sozal - Modern Medical Dashboard

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.2-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Bun](https://img.shields.io/badge/Bun-1.1-fbf0df?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh)
[![Nuxt UI Pro](https://img.shields.io/badge/Nuxt_UI_Pro-Dashboard-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://ui.nuxt.com/pro)

**Sozal** est un tableau de bord médical de nouvelle génération, conçu pour offrir une expérience fluide et performante aux professionnels de santé. Bâti sur les dernières technologies web (Nuxt 4, Supabase, Bun), il permet une gestion centralisée et sécurisée des activités hospitalières.

---

## ✨ Fonctionnalités Clés

- **🩺 Espace Consultation** : Interface optimisée pour les médecins, permettant un suivi précis des patients en temps réel, la prise de notes cliniques et la prescription.
- **👥 Gestion des Patients** : Centralisation complète des dossiers médicaux (DPI), historiques de santé, allergies, antécédents et fiches d'admission détaillées.
- **📅 Gestion des Rendez-vous** : Système de planification intelligent pour organiser les consultations, minimiser les temps d'attente et gérer les annulations.
- **📦 Gestion des Stocks & Pharmacie** : Contrôle rigoureux des stocks de médicaments et matériels médicaux, gestion des réceptions, des alertes de péremption et des inventaires.
- **📩 Inbox Intégrée** : Centre de messagerie interne sécurisé pour faciliter la communication entre les différents services (médecins, infirmiers, administration).
- **🤝 Partenaires & Réseaux** : Gestion des conventions et relations avec les laboratoires partenaires, centres d'imagerie et autres prestataires externes.
- **🏥 Salle d'Examen** : Suivi opérationnel des salles de soins, monitorage du flux des patients et optimisation de l'occupation des locaux.
- **⚙️ Paramètres Avancés** : Configuration granulaire du système (unités de soin, types d'actes, rôles) et personnalisation des préférences utilisateurs.
- **🌓 Mode Sombre/Clair & UX Premium** : Interface moderne basée sur Nuxt UI v4, offrant un confort visuel optimal et une réactivité exceptionnelle.

---

## 🚀 Stack Technologique

Le projet s'appuie sur une stack moderne et robuste :

- **Framework** : [Nuxt 4](https://nuxt.com) (Ecosystem Nuxt UI Pro)
- **Backend & Auth** : [Supabase](https://supabase.com) (PostgreSQL + Auth)
- **Gestion d'État** : [Pinia](https://pinia.vuejs.org)
- **Styles & UI** : [Nuxt UI](https://ui.nuxt.com) avec Vanilla CSS
- **Runtime & Package Manager** : [Bun](https://bun.sh)

---

## 🛠️ Installation & Développement

Assurez-vous d'avoir [Bun](https://bun.sh) installé sur votre machine.

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd sozal
```

### 2. Installer les dépendances
```bash
bun install
```

### 3. Configuration des variables d'environnement
Copiez le fichier `.env.example` en `.env` et complétez vos clés Supabase :
```bash
cp .env.example .env
```

### 4. Lancer le serveur de développement
```bash
bun run dev
```
Accédez au dashboard sur `http://localhost:3000`.

---

## 🏗️ Structure du Projet

```text
sozal/
├── app/              # Code source de l'application (Nuxt 4)
│   ├── components/   # Composants réutilisables (Patients, Consultation, etc.)
│   ├── pages/        # Routes de l'application
│   ├── stores/       # Gestion d'état avec Pinia
│   └── assets/       # Styles CSS et assets statiques
├── server/           # Logique côté serveur (Nitro)
├── supabase/         # Migrations et types de base de données
├── public/           # Fichiers statiques
└── nuxt.config.ts    # Configuration Nuxt
```

---

## 📝 Licence

Ce projet est la propriété de Jeydi243. Tous droits réservés.

---
*Fait avec ❤️ par la team Sozal.*
