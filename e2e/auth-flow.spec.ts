import { test, expect } from './fixtures'
import { getMockResetToken } from './mock-api'

const MAILPIT_API = 'http://localhost:8071/api/v1'

const password = 'E2eSecret!2026'

function uniqueEmail(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}@padci.test`
}

async function mailpitMessagesTo(email: string): Promise<Array<{ ID: string }>> {
  try {
    const res = await fetch(`${MAILPIT_API}/search?query=to:${email}`)
    const body = (await res.json()) as { messages?: Array<{ ID: string }> }
    return body.messages ?? []
  } catch {
    return []
  }
}

async function mailpitMessage(id: string): Promise<{ Text?: string; HTML?: string }> {
  try {
    const res = await fetch(`${MAILPIT_API}/message/${id}`)
    return (await res.json()) as { Text?: string; HTML?: string }
  } catch {
    return {}
  }
}

async function waitForResetToken(email: string, timeoutMs = 10000): Promise<string> {
  const mockToken = getMockResetToken(email)
  if (mockToken) return mockToken

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const token = getMockResetToken(email)
    if (token) return token

    const messages = await mailpitMessagesTo(email)
    for (const { ID } of messages) {
      const message = await mailpitMessage(ID)
      const raw = `${message.Text ?? ''}${message.HTML ?? ''}`
      const match = raw.match(/token=([A-Za-z0-9_-]+)/)
      if (match) return match[1]
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`aucun email de réinitialisation avec ?token= pour ${email} après ${timeoutMs}ms`)
}

test('inscription → email non vérifié → vérification → connexion', async ({ page }) => {
  const email = uniqueEmail('verify')

  // 1. Inscription (état : formulaire)
  await page.goto('/inscription')
  await page.getByPlaceholder('Nom *').fill('Vérification')
  await page.getByPlaceholder('Prénoms *').fill('E2E')
  await page.getByPlaceholder('Email *').fill(email)
  await page.getByPlaceholder('Mot de passe *', { exact: true }).fill(password)
  await page.getByPlaceholder('Confirmer le mot de passe *').fill(password)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()

  // État honnête : compte créé, PAS de "connexion possible" mentie —
  // et en local le backend renvoie le lien signé, affiché comme lien dev.
  await expect(page.getByText('Compte créé !')).toBeVisible()
  const devLink = page.getByRole('link', { name: /\[dev\] Vérifier l'adresse maintenant/ })
  await expect(devLink).toBeVisible()

  // Le lien signé est lu MAINTENANT : dès la navigation suivante l'écran
  // succès n'existe plus côté SPA.
  await expect(devLink).toHaveAttribute('href', /.+/)
  const href = (await devLink.getAttribute('href'))!

  // 2. Connexion refusée tant que l'email n'est pas vérifié :
  //    le 403 AUTH_EMAIL_NOT_VERIFIED ouvre l'état "non vérifié", pas une
  //    erreur générique d'identification.
  await page.getByRole('link', { name: 'Aller à la connexion' }).click()
  await expect(page).toHaveURL('/')
  await page.getByPlaceholder('Email professionnel').fill(email)
  await page.locator('input[placeholder="Mot de passe"]').fill(password)
  await page.getByRole('button', { name: /Se connecter/ }).click()
  await expect(page.getByText('Adresse email non vérifiée', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: /Renvoyer l'e-mail/ })).toBeVisible()

  // 3. Vérification via le lien signé (le navigateur est renvoyé sur
  //    /connexion?verified=1 par l'API — le redirect backend doit tomber sur
  //    un chemin SPA qui existe).
  await page.goto(href)
  await expect(page).toHaveURL(/\/connexion\?verified=1/)
  await expect(page.getByText('Adresse vérifiée ✓', { exact: false })).toBeVisible()

  // 4. Connexion cette fois acceptée → dashboard apprenant.
  await page.getByPlaceholder('Email professionnel').fill(email)
  await page.locator('input[placeholder="Mot de passe"]').fill(password)
  await page.getByRole('button', { name: /Se connecter/ }).click()
  await expect(page).toHaveURL(/\/formations\/dashboard/)
})

test('règles serveur : confirmation ≠ mot de passe et mot de passe faible', async ({ page }) => {
  const email = uniqueEmail('validation')
  await page.goto('/inscription')
  await page.getByPlaceholder('Nom *').fill('Validation')
  await page.getByPlaceholder('Prénoms *').fill('E2E')
  await page.getByPlaceholder('Email *').fill(email)
  await page.getByPlaceholder('Mot de passe *', { exact: true }).fill('E2eSecret!2026')
  await page.getByPlaceholder('Confirmer le mot de passe *').fill('AutreChose!2026')

  // Validation client/serveur : bouton désactivé et message de non correspondance affiché
  await expect(page.getByText('Les deux mots de passe ne correspondent pas.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Créer mon compte' })).toBeDisabled()

  // Mot de passe trop court : bouton désactivé
  await page.getByPlaceholder('Mot de passe *', { exact: true }).fill('court')
  await page.getByPlaceholder('Confirmer le mot de passe *').fill('court')
  await expect(page.getByRole('button', { name: 'Créer mon compte' })).toBeDisabled()
  // Toujours sur l'écran d'inscription — pas de faux succès.
  await expect(page.getByText('Créer un compte')).toBeVisible()
  await expect(page.getByText('Compte créé !')).toHaveCount(0)
})

test('mot de passe oublié → email (Mailpit) → réinitialisation → connexion avec le nouveau', async ({
  page,
}) => {
  const email = uniqueEmail('reset')

  // Pré-requis : un compte vérifié. Créé via le flow UI (test 1) puis la
  // vérification via le lien dev — même parcours qu'un nouvel utilisateur.
  await page.goto('/inscription')
  await page.getByPlaceholder('Nom *').fill('Reset')
  await page.getByPlaceholder('Prénoms *').fill('E2E')
  await page.getByPlaceholder('Email *').fill(email)
  await page.getByPlaceholder('Mot de passe *', { exact: true }).fill(password)
  await page.getByPlaceholder('Confirmer le mot de passe *').fill(password)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByText('Compte créé !')).toBeVisible()
  const devLink = page.getByRole('link', { name: /\[dev\] Vérifier l'adresse maintenant/ })
  await expect(devLink).toHaveAttribute('href', /.+/)
  const verifyHref = (await devLink.getAttribute('href'))!
  await page.goto(verifyHref)
  await expect(page.getByText('Adresse vérifiée ✓', { exact: false })).toBeVisible()

  // 1. Mot de passe oublié
  await page.goto('/mot-de-passe-oublie')
  await page.getByPlaceholder('Email professionnel').fill(email)
  await page.getByRole('button', { name: 'Envoyer le lien' }).click()
  await expect(page.getByText('Email envoyé !')).toBeVisible()

  // 2. Extraire le jeton du lien
  const token = await waitForResetToken(email)

  // 3. Réinitialisation sur le chemin consommé par l'email.
  await page.goto(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`)
  const newPassword = 'E2eNewPass!2027'
  await page.locator('input[placeholder="Nouveau mot de passe"]').fill(newPassword)
  await page.locator('input[placeholder="Confirmer le mot de passe"]').fill(newPassword)
  await page.getByRole('button', { name: 'Réinitialiser le mot de passe' }).click()
  await expect(page.getByText('Mot de passe modifié !')).toBeVisible()

  // 4. Connexion avec le nouveau mot de passe (l'ancien est révoqué côté backend).
  await page.goto('/connexion')
  await page.getByPlaceholder('Email professionnel').fill(email)
  await page.locator('input[placeholder="Mot de passe"]').fill(newPassword)
  await page.getByRole('button', { name: /Se connecter/ }).click()
  await expect(page).toHaveURL(/\/formations\/dashboard/)
})
