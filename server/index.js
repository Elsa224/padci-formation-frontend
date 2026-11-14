// EMSP mailer — mini-API SES (inscriptions + contact)
//
// Auth SES: via le rôle IAM de l'instance (Express54-EC2-Role), qui porte
// ses:SendEmail/SendRawEmail sur l'identité scbsystems.org. AUCUN identifiant
// statique ici. Le SDK AWS résout les credentials depuis le rôle d'instance.
//
// Routes (montées sous /api, Apache reverse-proxy /api -> 127.0.0.1:PORT/api):
//   GET  /api/health      -> {ok:true}
//   POST /api/inscription -> dossier (multipart + pièces jointes) -> admin + accusé candidat
//   POST /api/contact     -> message (JSON) -> admin

import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import nodemailer from 'nodemailer'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { esc, emailLayout, highlight, dataTable } from './templates.js'

const PORT = Number(process.env.PORT || 3082)
const HOST = process.env.HOST || '127.0.0.1'
const REGION = process.env.AWS_REGION || 'us-east-1'
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@scbsystems.org'
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'EMSP Formation'
const MAIL_ADMIN = process.env.MAIL_ADMIN || 'formation@scbsystems.org'

const MAX_FILE_BYTES = Number(process.env.MAX_FILE_BYTES || 10 * 1024 * 1024) // 10 Mo/fichier
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
])

// --- SES transport (rôle d'instance, SESv2) ---
const ses = new SESv2Client({ region: REGION })
const transporter = nodemailer.createTransport({
  SES: { sesClient: ses, SendEmailCommand },
})

// --- app ---
const app = express()
app.set('trust proxy', 1) // derrière Apache reverse-proxy
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requêtes / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Trop de requêtes, réessayez plus tard.' },
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true)
    cb(new Error(`Type de fichier non autorisé: ${file.originalname} (${file.mimetype})`))
  },
})

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ''))

const fromHeader = `${MAIL_FROM_NAME} <${MAIL_FROM}>`

// Couleur bleue de marque, pour les titres de corps construits ici.
const BRAND_BLUE = '#274E8F'
const BRAND_MUTED = '#6b7280'
const BRAND_SOFT = '#eef2f8'
const BRAND_TEXT = '#1f2937'

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'emsp-mailer' }))

// --- Inscription ---
const inscriptionFields = upload.fields([
  { name: 'carteIdentite', maxCount: 1 },
  { name: 'attestationIdentite', maxCount: 1 },
  { name: 'photoIdentite', maxCount: 1 },
  { name: 'extraitNaissance', maxCount: 1 },
])

app.post('/api/inscription', limiter, (req, res) => {
  inscriptionFields(req, res, async (err) => {
    if (err) return res.status(400).json({ ok: false, error: err.message })
    try {
      const b = req.body || {}
      const required = ['nom', 'prenom', 'email', 'telephone', 'dateNaissance', 'formation']
      const missing = required.filter((k) => !String(b[k] || '').trim())
      if (missing.length)
        return res.status(400).json({ ok: false, error: `Champs manquants: ${missing.join(', ')}` })
      if (!isEmail(b.email))
        return res.status(400).json({ ok: false, error: 'Adresse email invalide.' })

      const files = req.files || {}
      const attachments = []
      for (const key of Object.keys(files)) {
        for (const f of files[key]) {
          attachments.push({ filename: `${key}-${f.originalname}`, content: f.buffer })
        }
      }

      const nomComplet = `${b.prenom || ''} ${b.nom || ''}`.trim()
      const adminHtml = emailLayout({
        title: 'Nouvelle inscription — EMSP',
        preheader: `Dossier de ${nomComplet || b.email}`,
        footerNote:
          'Répondez directement à ce message pour contacter le candidat (Reply-To configuré).',
        body: `
          <h1 style="margin:0 0 6px;font-size:20px;color:${BRAND_BLUE};">Nouvelle inscription</h1>
          <p style="margin:0 0 18px;color:${BRAND_MUTED};">Un candidat a soumis un dossier d'inscription.</p>
          ${highlight('Formation demandée', b.formation)}
          ${dataTable([
            ['Nom', b.nom],
            ['Prénom', b.prenom],
            ['Nationalité', b.nationalite],
            ['NNI', b.nni],
            ['Email', b.email],
            ['Téléphone', b.telephone],
            ['Date de naissance', b.dateNaissance],
            ['Nom de la mère', b.nomMere],
            ['Nom du père', b.nomPere],
            ['Fonction', b.fonction],
            ['Adresse', b.adresse],
            ['Carte d’identité', b.pasCarteIdentite === 'true' ? 'Non fournie (attestation jointe)' : 'Fournie'],
          ])}
          <p style="margin:18px 0 0;font-size:13px;color:${BRAND_MUTED};">
            ${attachments.length} pièce(s) jointe(s) à ce message.
          </p>`,
      })

      await transporter.sendMail({
        from: fromHeader,
        to: MAIL_ADMIN,
        replyTo: b.email,
        subject: `Nouvelle inscription EMSP — ${nomComplet || b.email}`,
        html: adminHtml,
        attachments,
      })

      // Accusé de réception au candidat (sans pièces jointes)
      const ackHtml = emailLayout({
        title: 'Confirmation de votre demande — EMSP',
        preheader: 'Votre dossier d’inscription a bien été reçu.',
        body: `
          <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND_BLUE};">Demande d'inscription bien reçue</h1>
          <p style="margin:0 0 14px;">Bonjour <strong>${esc(b.prenom || '')}</strong>,</p>
          <p style="margin:0 0 4px;">Nous confirmons la bonne réception de votre dossier d'inscription.
             Notre équipe va l'étudier et reviendra vers vous dans les meilleurs délais.</p>
          ${highlight('Formation demandée', b.formation)}
          <p style="margin:0;">Merci de votre confiance,<br/><strong style="color:${BRAND_BLUE};">L'équipe EMSP Formation</strong></p>`,
      })

      try {
        await transporter.sendMail({
          from: fromHeader,
          to: b.email,
          subject: 'Confirmation de votre demande d’inscription — EMSP',
          html: ackHtml,
        })
      } catch (ackErr) {
        // L'accusé est secondaire : on ne fait pas échouer la soumission si seul l'accusé échoue.
        console.error('[inscription] accusé candidat échoué:', ackErr?.message)
      }

      return res.json({ ok: true })
    } catch (e) {
      console.error('[inscription] erreur:', e)
      return res.status(500).json({ ok: false, error: "Échec de l'envoi. Réessayez plus tard." })
    }
  })
})

// --- Contact ---
app.post('/api/contact', limiter, async (req, res) => {
  try {
    const b = req.body || {}
    const required = ['nom', 'email', 'message']
    const missing = required.filter((k) => !String(b[k] || '').trim())
    if (missing.length)
      return res.status(400).json({ ok: false, error: `Champs manquants: ${missing.join(', ')}` })
    if (!isEmail(b.email)) return res.status(400).json({ ok: false, error: 'Adresse email invalide.' })

    const html = emailLayout({
      title: 'Nouveau message de contact — EMSP',
      preheader: `${b.nom} — ${b.sujet || 'Contact'}`,
      footerNote:
        "Répondez directement à ce message pour contacter l'expéditeur (Reply-To configuré).",
      body: `
        <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND_BLUE};">Nouveau message de contact</h1>
        ${dataTable([
          ['Nom', b.nom],
          ['Email', b.email],
          ['Téléphone', b.telephone],
          ['Sujet', b.sujet],
        ])}
        <div style="margin:18px 0 0;padding:16px 18px;background:${BRAND_SOFT};border-left:4px solid ${BRAND_BLUE};border-radius:6px;white-space:pre-wrap;color:${BRAND_TEXT};">${esc(
          b.message,
        )}</div>`,
    })

    await transporter.sendMail({
      from: fromHeader,
      to: MAIL_ADMIN,
      replyTo: b.email,
      subject: `Contact EMSP — ${b.sujet ? b.sujet : b.nom}`,
      html,
    })
    return res.json({ ok: true })
  } catch (e) {
    console.error('[contact] erreur:', e)
    return res.status(500).json({ ok: false, error: "Échec de l'envoi. Réessayez plus tard." })
  }
})

app.listen(PORT, HOST, () => {
  console.log(`emsp-mailer en écoute sur ${HOST}:${PORT} (region=${REGION}, from=${MAIL_FROM}, admin=${MAIL_ADMIN})`)
})
