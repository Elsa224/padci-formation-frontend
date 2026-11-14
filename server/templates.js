// Templates email EMSP — module PUR (aucun effet de bord, importable pour
// prévisualisation/tests). Charte : bleu #274E8F + orange #E07B00.

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export const BRAND = {
  blue: '#274E8F',
  blueSoft: '#eef2f8',
  lightBlue: '#9DABD1',
  gold: '#E7A950',
  orange: '#E07B00',
  text: '#1f2937',
  muted: '#6b7280',
  faint: '#9aa3af',
  border: '#e9ecf1',
}

// Coquille HTML email (table-based, styles inline — compatible clients mail)
export function emailLayout({ title, preheader = '', body, footerNote }) {
  const note =
    footerNote ||
    'Ceci est un message automatique, merci de ne pas y répondre directement.'
  const year = new Date().getFullYear()
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(
    title,
  )}</title></head>
<body style="margin:0;padding:0;background:#eef1f6;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${BRAND.border};font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="background:${BRAND.blue};padding:26px 32px;">
          <div style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:.5px;">EMSP <span style="color:${BRAND.gold};">Formation</span></div>
          <div style="font-size:12px;color:${BRAND.lightBlue};margin-top:4px;">Éducation routière des coursiers</div>
        </td></tr>
        <tr><td style="height:4px;background:${BRAND.orange};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:32px;color:${BRAND.text};font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          ${body}
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid ${BRAND.border};padding:18px 32px;color:${BRAND.faint};font-size:12px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          ${esc(note)}
          <div style="margin-top:6px;">&copy; ${year} EMSP Formation &middot; emsp.scbsystems.org</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// Encadré "info clé" (bandeau bleu à gauche)
export function highlight(label, value) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;"><tr>
    <td style="background:${BRAND.blueSoft};border-left:4px solid ${BRAND.blue};border-radius:6px;padding:14px 18px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:${BRAND.muted};">${esc(label)}</div>
      <div style="font-size:16px;font-weight:bold;color:${BRAND.blue};margin-top:3px;">${esc(value || '—')}</div>
    </td></tr></table>`
}

// Table de données (zébrée, colonne label colorée)
export function dataTable(pairs) {
  const body = pairs
    .filter(([, v]) => v !== undefined && v !== null)
    .map(
      ([k, v], i) =>
        `<tr style="background:${i % 2 ? '#ffffff' : '#f7f9fc'};">
          <td style="padding:9px 14px;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-weight:bold;width:42%;vertical-align:top;">${esc(k)}</td>
          <td style="padding:9px 14px;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};">${esc(v || '—')}</td>
        </tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;font-size:14px;">${body}</table>`
}
