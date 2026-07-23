# TOP MARK — Fidélité & Réclamations

PWA bilingue (FR / AR / Tamazight) pour la gestion du programme fidélité et des
réclamations clients de TOP MARK Distribution sarl.

**Stack** : React + Vite · Appwrite Cloud (Auth, Databases, Storage, Functions, Messaging) · Appwrite Sites (hébergement) · GitHub (source + CI)

## Mise en route — étape par étape

### 1. Créer le dépôt GitHub
```bash
git init
git add .
git commit -m "Initial scaffold"
gh repo create topmark-fidelite-reclamations --private --source=. --push
```
(ou créez le dépôt manuellement sur github.com puis `git remote add origin ...`)

### 2. Créer le projet Appwrite Cloud
1. Aller sur https://cloud.appwrite.io et créer un compte / une organisation
2. Créer un nouveau projet : "TOP MARK Fidélité"
3. Copier l'**Endpoint** et le **Project ID** depuis Project Settings

### 3. Configurer les variables d'environnement
```bash
cp .env.example .env
# remplir VITE_APPWRITE_PROJECT_ID avec la valeur copiée à l'étape 2
```

### 4. Créer la base de données et les collections
Suivre `appwrite/schema.md` — soit manuellement dans la console Appwrite,
soit via le CLI Appwrite (`appwrite databases create`, `appwrite databases
create-collection`, etc. — recommandé pour garder le schéma versionné).

### 5. Activer les méthodes d'authentification
Dans Appwrite Console > Auth > Settings, activer :
- Email/Mot de passe
- SMS OTP (nécessite un provider SMS — Twilio ou Vonage, à connecter dans Messaging)

### 6. Connecter Appwrite Sites à GitHub
1. Appwrite Console > Sites > "Create Site"
2. Connecter le dépôt GitHub créé à l'étape 1
3. Framework : Vite / React — build command `npm run build`, output `dist`
4. Renseigner les variables d'environnement (mêmes valeurs que `.env`) dans les
   Site Settings d'Appwrite (elles ne viennent pas du `.env` local en production)
5. Chaque `git push` sur `main` déclenche désormais un build + déploiement automatique

### 7. Développement local
```bash
npm install
npm run dev
```

## Structure du projet
```
src/
  lib/appwrite.js       — client Appwrite centralisé (Auth, DB, Storage, Functions)
  pages/                — écrans de l'application (Phase 1+)
appwrite/
  schema.md             — plan des collections, attributs, permissions
.github/workflows/
  ci.yml                — vérifie lint + build avant chaque push
```

## Prochaine étape
Phase 1 : Authentification (email/mdp + OTP SMS) et dashboards client/admin.
