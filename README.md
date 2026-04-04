# Suivi des Marchés Publics

Application web de suivi des marchés publics avec React + Supabase.

## Fonctionnalités

- 📊 **Dashboard** — KPIs, graphiques, alertes deadlines
- 🔄 **Pipeline Kanban** — Vue par statut, glisser-déposer
- 📁 **Liste des marchés** — Recherche, filtres, export CSV
- ✏️ **Formulaire complet** — Création/modification avec audit
- 📝 **Journal d'audit** — Qui a modifié quoi et quand
- 🔐 **Multi-utilisateurs** — Rôles admin/commercial/lecture

## Stack technique

- **Frontend** : React 18 + Vite
- **Base de données** : Supabase (PostgreSQL)
- **Hosting** : Vercel (frontend) + Supabase (BDD)
- **Auth** : Supabase Auth

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` à partir de `.env.example` :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Développement

```bash
npm run dev
```

## Déploiement

1. Pusher sur GitHub
2. Connecter à Vercel
3. Ajouter les variables d'environnement Supabase
4. Déployer !

## Administration

Pour définir un admin, dans Supabase → Table Editor → profiles → changer `role` en `admin`.
