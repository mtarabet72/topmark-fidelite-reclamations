# Schéma Appwrite Databases — TOP MARK Fidélité & Réclamations

Base de données : `topmark_main` (1 seule base, collections séparées par domaine).
Permissions par défaut : lecture/écriture au niveau **document**, pas collection —
chaque client ne voit que ses propres documents (`Permission.read(Role.user(userId))`).

## 1. `clients`
Profil client, lié 1:1 au compte Appwrite Auth (`userId`).

| Attribut | Type | Notes |
|---|---|---|
| userId | string | ID du compte Auth Appwrite (clé de liaison) |
| fullName | string | |
| phone | string | format E.164, utilisé pour OTP SMS |
| email | string | |
| locale | enum(fr, ar, zgh) | langue préférée — pilote l'UI et les notifs |
| createdAt | datetime | auto |

Permissions : `read/update` par le propriétaire (profil uniquement — voir
`client_loyalty` pour le solde). Aucun champ sensible ici : c'est
volontaire, car Appwrite ne permet pas de restreindre l'`update` à certains
champs seulement, et le client a besoin de ce droit pour ses propres
actions (ex. compléter sa fiche technique).

## 1bis. `client_loyalty`
Solde de fidélité, séparé de `clients` pour empêcher toute falsification :
un utilisateur malveillant ne peut plus se créditer de points ou changer
son palier via un appel direct au SDK, même en connaissant l'ID de son
document.

| Attribut | Type | Notes |
|---|---|---|
| clientId | string | référence `clients.userId` |
| loyaltyPoints | integer | solde courant |
| tier | enum(bronze, argent, or) | palier fidélité |

Permissions : `read` par le propriétaire et par l'équipe `support-agents` ;
**aucun `update` accordé au client**. Seules les Appwrite Functions
`award-points` et `spin-wheel` (clé API serveur, voir `functions/README.md`)
peuvent écrire ce solde.

## 2. `loyalty_transactions`
Historique immuable des mouvements de points (append-only).

| Attribut | Type | Notes |
|---|---|---|
| clientId | string | référence `clients.userId` |
| type | enum(gain, roue, correction, expiration) | |
| points | integer | signé (+/-) |
| reason | string | ex: "Achat #4521" |
| createdAt | datetime | auto |

Permissions : `create` réservé aux **Appwrite Functions** (jamais en écriture directe côté client) — c'est ce qui empêche un client de se créditer des points lui-même.

## 3. `wheel_prizes`
Catalogue des lots de la roue de la fortune, gérable depuis la console admin.

| Attribut | Type | Notes |
|---|---|---|
| label | string | traduit côté client via table de traduction ou 3 champs (labelFr/labelAr/labelZgh) |
| probability | float | poids de tirage, somme = 1.0 |
| pointsValue | integer | 0 si lot physique |
| stock | integer | décrémenté à chaque gain, null = illimité |
| active | boolean | |

## 4. `wheel_spins`
Historique des tirages, un par client par période (anti-triche).

| Attribut | Type | Notes |
|---|---|---|
| clientId | string | |
| prizeId | string | référence `wheel_prizes` |
| spunAt | datetime | |

Permissions : `create`/`update` réservés à la Function `spin-wheel` (clé API
serveur) — le client n'a plus aucun droit d'écriture direct sur cette
collection, ce qui l'empêche de forcer le lot gagnant depuis la console du
navigateur. La Function vérifie l'éligibilité (solde/palier débloqué,
nombre d'essais) avant d'insérer ou de modifier un tirage.

## 5. `complaint_categories`
| Attribut | Type | Notes |
|---|---|---|
| labelFr / labelAr / labelZgh | string | |
| slaHours | integer | délai de traitement cible |

## 6. `complaints`
| Attribut | Type | Notes |
|---|---|---|
| clientId | string | |
| categoryId | string | |
| description | string | |
| status | enum(nouveau, en_cours, resolu, rejete) | |
| attachmentFileIds | string[] | références au bucket `complaint_attachments` |
| createdAt / updatedAt | datetime | |

Permissions : `create/read` par le client propriétaire ; `update` (statut) réservé à l'équipe support via une Team Appwrite dédiée (`support-agents`).

## 7. `notifications`
| Attribut | Type | Notes |
|---|---|---|
| clientId | string | |
| titleFr/titleAr/titleZgh | string | |
| read | boolean | |
| relatedType | enum(complaint, loyalty) | |
| relatedId | string | |
| createdAt | datetime | |

---

## Buckets Storage
- `complaint_attachments` — photos jointes aux réclamations, max 5 Mo/fichier, antivirus activé
- `avatars` — photo de profil client

## Functions
- `award-points` — calcule et crédite les points après un achat. Implémentée
  dans `functions/award-points/` ; voir `functions/README.md` pour le
  déploiement et la config des permissions (Execute Access =
  `support-agents`).
- `spin-wheel` — logique serveur complète du tirage (tirage pondéré,
  éligibilité, remise à zéro du solde). Implémentée dans
  `functions/spin-wheel/` ; voir `functions/README.md` (Execute Access =
  `Role.users()`, chaque appel n'agit que sur le solde de l'appelant).
- `notify-status-change` — envoie une notif (push/SMS/email) quand une réclamation change de statut. Pas encore implémentée (Phase suivante).

