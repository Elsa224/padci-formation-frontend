import { test, expect } from './fixtures'

const token = 'mock-learner-token'

test.describe('Public Catalog & Cohort Availability (ADR-012)', () => {
  test('Catalog lists pathways and pathway detail shows sessions with live availability', async ({
    page,
  }) => {
    // 1. Visiteur sur le catalogue public
    await page.goto('/catalogue')
    await expect(page.getByRole('heading', { name: 'Trouvez votre parcours' })).toBeVisible()
    await expect(page.getByText('Cyber Sécurité')).toBeVisible()
    await expect(page.getByText('Artificial Intelligence')).toBeVisible()

    // 2. Ouvrir la fiche Cyber Sécurité
    await page.getByRole('link', { name: 'Voir le parcours' }).first().click()
    await expect(page.getByRole('heading', { name: /Équipement à prévoir/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Rejoindre cette filière' })).toBeVisible()
  })
})

test.describe('Learner Application Flow & Dynamic Learning Space', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((authToken) => {
      sessionStorage.setItem('padci.session_token', authToken)
    }, token)
  })

  test('Learner submits an application and follows it on Mes Candidatures', async ({ page }) => {
    // 1. Se rendre directement sur la fiche filière Cyber Sécurité
    await page.goto('/catalogue/pth_cyber')
    await expect(page.getByRole('heading', { name: 'Cyber Sécurité', exact: true })).toBeVisible()

    const applyBtn = page.getByRole('button', { name: /Participer à cette formation/ }).first()
    await expect(applyBtn).toBeVisible()
    await applyBtn.click()

    // Formulaire étape 1
    await expect(page.getByRole('heading', { name: /Votre filière/ })).toBeVisible()
    const motivation = page.locator('textarea').first()
    await motivation.fill('Je souhaite me perfectionner en sécurité réseau.')
    await page.getByRole('button', { name: /Continuer/ }).click()

    // Formulaire étape 2
    await page.getByRole('button', { name: /Continuer|Vérifier/ }).click()

    // Formulaire étape 3
    await page.getByRole('button', { name: /Confirmer et envoyer/ }).click()

    // Écran de succès
    await expect(page.getByRole('heading', { name: /Candidature enregistrée/ })).toBeVisible()
    await page.getByRole('link', { name: 'Voir mes candidatures' }).click()
    await expect(page.getByRole('heading', { name: /Mes candidatures/i })).toBeVisible()
  })

  test('Learner accesses LearnerDashboard and views dynamic course structure', async ({ page }) => {
    await page.goto('/formations/dashboard')
    await expect(page.getByRole('heading', { name: 'Ma formation' })).toBeVisible()

    // Vérifier la présence d'au moins un cours ou bouton
    const courseCard = page.getByRole('link', { name: /Accéder au cours/ }).first()
    await expect(courseCard).toBeVisible()
    await courseCard.click()
    await expect(page).toHaveURL(/\/formations\/crs_/)
  })
})
