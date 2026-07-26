# Appwrite Functions — award-points & spin-wheel

Ces deux Functions ferment la faille de sécurité où un client pouvait
modifier directement son solde de points (`loyaltyPoints`) et son palier
(`tier`) depuis la console du navigateur, puisque le SDK Appwrite ne permet
pas de restreindre les permissions champ par champ — seulement au niveau du
document entier.

**Ce changement casse l'app tant que les étapes ci-dessous n'ont pas été
appliquées dans la Appwrite Console** (inscription, achats et roue de la
fortune dépendent de la nouvelle collection `client_loyalty` et de ces deux
Functions). Je n'ai pas d'accès à votre projet Appwrite Cloud depuis cet
environnement — ces étapes doivent être faites manuellement.

## 1. Créer la collection `client_loyalty`

Dans Appwrite Console > Databases > `topmark_main` > Create collection :

| Attribut | Type | Requis |
|---|---|---|
| clientId | string | oui |
| loyaltyPoints | integer (défaut 0) | oui |
| tier | string (défaut "bronze") | oui |

Permissions **au niveau collection** :
- `create` : `Role.users()` (le client crée son propre document à l'inscription)
- Ne rien ajouter d'autre au niveau collection — les permissions par
  document (lecture seule pour le propriétaire, lecture pour l'équipe
  `support-agents`) sont posées par le code à la création de chaque document.

Index recommandé : `clientId` (key, ordre asc) pour accélérer les recherches.

## 2. Retirer `loyaltyPoints`/`tier` de la collection `clients`

Ces deux attributs ne sont plus utilisés dans `clients` (le code ne les lit
ni les écrit plus dessus). Vous pouvez les supprimer de la collection une
fois la migration validée, ou les laisser en place pour l'historique — ils
seront simplement ignorés.

## 3. Migrer les clients existants

Pour chaque document existant dans `clients`, créer le document
`client_loyalty` correspondant (`clientId` = `clients.userId`,
`loyaltyPoints`/`tier` = valeurs actuelles), avec les permissions décrites
ci-dessus. Un script one-off avec le SDK serveur (`node-appwrite`) est le
plus simple si vous avez plus que quelques clients.

## 4. Déployer `award-points`

- Appwrite Console > Functions > Create function
  - Runtime : Node.js 18+ (ou plus récent disponible)
  - Entrypoint : `src/main.js`
  - Dossier source : `functions/award-points`
  - Build commands : `npm install`
- **Execute Access** : équipe `support-agents` uniquement. C'est cette
  permission — vérifiée par Appwrite avant même d'invoquer la Function — qui
  empêche un client normal de créditer des points, pas une vérification dans
  le code.
- Variables d'environnement de la Function :
  - `APPWRITE_DATABASE_ID` = `topmark_main` (ou votre valeur)
  - `APPWRITE_API_KEY` = une clé API serveur dédiée avec les scopes
    `databases.read` + `databases.write` uniquement (Console > Overview >
    Integrations > API keys). Ne pas réutiliser une clé avec plus de scopes
    que nécessaire.
  - `APPWRITE_FUNCTION_API_ENDPOINT` / `APPWRITE_FUNCTION_PROJECT_ID` sont
    déjà injectées automatiquement par Appwrite.
- L'ID de la Function dans la Console doit être `award-points` (celui utilisé
  par `functions.createExecution` côté client dans `src/lib/appwrite.js`) —
  ou mettez à jour `FUNCTIONS.AWARD_POINTS` si vous choisissez un autre ID.

## 5. Déployer `spin-wheel`

- Mêmes étapes que ci-dessus, dossier source `functions/spin-wheel`, ID de
  Function `spin-wheel`.
- **Execute Access** : `Role.users()` (tout utilisateur connecté peut
  lancer/valider son propre tirage — la Function vérifie elle-même que
  `clientUserId` correspond à l'utilisateur appelant).
- Mêmes variables d'environnement (`APPWRITE_DATABASE_ID`, `APPWRITE_API_KEY`).

## 6. Retirer la permission `create` client sur `wheel_spins`

Une fois `spin-wheel` déployée, la collection `wheel_spins` n'a plus besoin
d'autoriser `Role.users()` en `create`/`update` au niveau collection — seule
la Function (clé API serveur) y écrit désormais. Retirer cette permission
ferme définitivement la possibilité de forcer un lot gagnant en appelant
`databases.createDocument` depuis la console du navigateur.

## Test après déploiement

1. Inscrire un compte de test → vérifier qu'un document `client_loyalty`
   est bien créé avec `loyaltyPoints: 0`.
2. Enregistrer un achat depuis un compte `support-agents` → le solde du
   client doit augmenter.
3. Depuis le compte client, tenter `databases.updateDocument(...,
   "client_loyalty", <id>, { loyaltyPoints: 999999 })` dans la console du
   navigateur → doit être refusé (401/403 Appwrite), confirmant que la
   faille est fermée.
4. Tourner la roue une fois un palier débloqué → confirmer un lot → vérifier
   que le solde repasse à 0 et qu'une ligne `loyalty_transactions` de type
   `roue` est créée.
