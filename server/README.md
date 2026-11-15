# EMSP mailer

Mini-API d'envoi de mail pour le site EMSP (`emsp.scbsystems.org`). Sert les
formulaires **inscription** et **contact** de la SPA et envoie via **Amazon SES**.

## Pourquoi

La SPA est statique : elle ne peut pas envoyer de mail elle-même sans exposer
des identifiants dans le navigateur. Ce service reçoit les soumissions côté
serveur et relaie par SES.

## Authentification SES

**Aucun identifiant statique.** Le service tourne sur `shared-prod`, dont le
rôle d'instance `Express54-EC2-Role` porte déjà
`ses:SendEmail`/`ses:SendRawEmail` sur l'identité `scbsystems.org`. Le SDK AWS
résout les credentials depuis le rôle. Rien à déposer sur la box.

## Routes

| Méthode | Route | Corps | Effet |
|---|---|---|---|
| GET | `/api/health` | — | sonde |
| POST | `/api/inscription` | `multipart/form-data` (champs + pièces jointes) | dossier → admin (`MAIL_ADMIN`), Reply-To candidat + accusé → candidat |
| POST | `/api/contact` | JSON `{nom,email,telephone?,sujet?,message}` | message → admin, Reply-To expéditeur |

Pièces jointes acceptées : pdf/jpg/png, 10 Mo max/fichier. Rate-limit 30 req / 15 min / IP.

## Déploiement (shared-prod)

```bash
cd ~/apps/emsp-mailer          # (clone server/ ou rsync)
cp .env.example .env           # ajuster PORT si besoin
npm ci --omit=dev
pm2 start ecosystem.config.cjs
pm2 save
```

Apache (`emsp.scbsystems.org`) reverse-proxy `/api` → `127.0.0.1:$PORT`, **avant**
le `FallbackResource /index.html`.

## Config (.env)

Voir `.env.example`. `PORT` par défaut 3082 ; pas de secret.
