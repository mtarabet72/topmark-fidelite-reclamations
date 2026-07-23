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
| loyaltyPoints | integer | solde courant (dénormalisé pour lecture rapide) |
| tier | enum(bronze, argent, or) | palier fidélité |
| createdAt | datetime | auto |

Permissions : `read/update` par le propriétaire uniquement ; `create` via Function (pas côté client, pour éviter la falsification du solde de points).

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

Permissions : `create` via Function uniquement — la Function vérifie l'éligibilité (délai depuis le dernier tirage) avant d'insérer.

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

## Functions prévues (Phase suivante)
- `award-points` — calcule et crédite les points après un achat (déclenchée par webhook/API)
- `spin-wheel` — logique serveur du tirage (empêche la triche côté client)
- `notify-status-change` — envoie une notif (push/SMS/email) quand une réclamation change de statut

