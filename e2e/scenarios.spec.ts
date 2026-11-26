import { test, expect, loginAs } from './fixtures'

test.describe('Scénarios E2E Plateforme EMSP', () => {
  test('Scénario 1 : Un apprenant passe un quiz (avec expiration notée automatiquement)', async ({
    page,
  }) => {
    // 1. Apprenant authentifié
    await loginAs(page, 'apprenant')

    // 2. Accès à l'évaluation en cours
    await page.goto('/formations/crs_cyber_sec/evaluations/att_quiz_auto')

    // Vérification de l'affichage de l'évaluation
    await expect(page.getByRole('heading', { name: 'Quiz Réseaux et Sécurité' })).toBeVisible()
    await expect(
      page.getByText('Quel port par défaut est utilisé par le protocole HTTPS ?'),
    ).toBeVisible()

    // 3. Réponse à la première question
    await page.locator('label', { hasText: 'Port 443' }).click()

    // 4. Attente de l'expiration automatique (expires_at est configuré dans mock-api)
    // Le composant AttemptView détecte remaining <= 5s et déclenche automatiquement finish()
    const autoNotice = page.getByTestId('auto-submitted-notice')
    await expect(autoNotice).toBeVisible({ timeout: 12000 })
    await expect(autoNotice).toHaveText(
      'Temps écoulé : vos réponses enregistrées ont été notées automatiquement',
    )

    // 5. Vérification de l'affichage du score
    const scoreLocator = page.getByTestId('score')
    await expect(scoreLocator).toBeVisible()
    await expect(scoreLocator).toContainText('10 / 20')
  })

  test('Scénario 2 : Un formateur crée un cours et dépose un PDF', async ({ page }) => {
    // 1. Formateur authentifié
    await loginAs(page, 'formateur')

    // 2. Accès à la gestion des cours formateur
    await page.goto('/formateur/cours')
    await expect(page.getByRole('heading', { name: 'Mes cours et supports' })).toBeVisible()

    // 3. Création d'un nouveau cours
    await page.getByRole('button', { name: 'Nouveau cours' }).click()
    await expect(page.getByRole('heading', { name: 'Nouveau cours' })).toBeVisible()

    await page
      .getByPlaceholder('Ex : Introduction au support informatique')
      .fill('Architecture et Sécurité des Réseaux')
    await page.locator('select').first().selectOption('pth_cyber')
    await page
      .getByPlaceholder("Ce que l'apprenant saura faire à la fin du cours.")
      .fill('Maîtriser le déploiement sécurisé des équipements réseaux.')

    await page.getByRole('button', { name: 'Créer le brouillon' }).click()

    // 4. Redirection vers la page de détail du cours
    await expect(page).toHaveURL(/\/formateur\/cours\/crs_/)
    await expect(
      page.getByRole('heading', { name: 'Architecture et Sécurité des Réseaux' }),
    ).toBeVisible()

    // 5. Ajout d'un module
    await page.getByPlaceholder('Titre du nouveau module').fill('Module 1 : Protocoles de routage')
    await page.getByRole('button', { name: 'Ajouter un module' }).click()

    await expect(page.getByTestId('course-module')).toBeVisible()
    await expect(page.getByText('Module 1 : Protocoles de routage')).toBeVisible()

    // 6. Ajout d'un chapitre dans le module
    await page.getByRole('button', { name: '+ Ajouter un chapitre' }).click()
    await page.getByPlaceholder('Titre de la leçon').fill('Chapitre 1 : OSPF et BGP')
    await page.getByRole('button', { name: 'Ajouter le chapitre' }).click()

    await expect(page.getByText('Chapitre 1 : OSPF et BGP')).toBeVisible()

    // 7. Dépose d'un support PDF
    await page.getByTestId('open-document-form').click()
    await page.getByLabel('Titre du document').fill('Support OSPF BGP')

    // Upload d'un fichier PDF virtuel
    await page.locator('input[type="file"]').setInputFiles({
      name: 'support-cours.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF'),
    })

    await page.getByRole('button', { name: 'Déposer' }).click()

    // 8. Vérification que le document PDF est enregistré et visible
    await expect(page.getByText('Support OSPF BGP')).toBeVisible()
    await expect(page.getByText('support-cours.pdf')).toBeVisible()
  })

  test('Scénario 3 : Un admin publie un cours et révoque une attestation', async ({ page }) => {
    // 1. Administrateur authentifié
    await loginAs(page, 'admin')

    // 2. Accès à la modération des cours
    await page.goto('/admin/moderation-cours')
    await expect(page.getByRole('heading', { name: 'Modération des cours' })).toBeVisible()

    // 3. Publication d'un cours soumis
    await expect(
      page.getByRole('heading', { name: "Administration Systèmes et Réseaux d'Entreprise" }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Examiner' }).first().click()
    await expect(page.getByRole('heading', { name: 'Contenu du cours' })).toBeVisible()

    // Choix de la décision "Approuver et publier"
    await page.getByRole('button', { name: 'Approuver et publier' }).click()

    // 4. Accès à la gestion des attestations
    await page.goto('/admin/attestations')
    await expect(
      page.getByRole('heading', { name: 'Attestations et certifications' }),
    ).toBeVisible()

    // 5. Révocation d'une attestation avec un motif
    const certRow = page.getByTestId('certificate-row').first()
    await expect(certRow).toContainText('Jean Dupont')
    await expect(certRow).toContainText('Introduction à la Cybersécurité')

    await certRow.getByTestId('revoke').click()

    const revokeForm = certRow.getByTestId('revoke-form')
    await expect(revokeForm).toBeVisible()

    await revokeForm
      .getByPlaceholder("Motif de la révocation (visible par l'apprenant)")
      .fill("Fraude avérée lors de l'examen final")

    await revokeForm.getByRole('button', { name: 'Révoquer' }).click()

    // 6. Vérification que l'attestation passe au statut révoquée
    await expect(certRow).toContainText('Révoquée le')
    await expect(certRow).toContainText('par Demo Admin')
    await expect(certRow).toContainText("Fraude avérée lors de l'examen final")
    await expect(certRow.getByTestId('revoke')).toHaveCount(0)
  })

  test('Scénario 4 : La vérification publique /verifier', async ({ page }) => {
    // Visiteur anonyme (aucune authentification)
    await page.goto('/verifier')
    await expect(page.getByRole('heading', { name: 'Vérifier une attestation' })).toBeVisible()

    // 1. Code valide
    await page.getByLabel("Code de l'attestation").fill('CERT-VALID-123')
    await page.getByRole('button', { name: 'Vérifier' }).click()

    const validResult = page.getByTestId('verify-result')
    await expect(validResult).toBeVisible()
    await expect(validResult.getByText('Attestation valide')).toBeVisible()
    await expect(validResult.getByText('Jean Dupont')).toBeVisible()
    await expect(validResult.getByText('Introduction à la Cybersécurité')).toBeVisible()

    // 2. Code révoqué
    await page.getByLabel("Code de l'attestation").fill('CERT-REVOKED-456')
    await page.getByRole('button', { name: 'Vérifier' }).click()

    const revokedResult = page.getByTestId('verify-result')
    await expect(revokedResult).toBeVisible()
    await expect(revokedResult.getByText('Attestation non valide')).toBeVisible()
    await expect(revokedResult.getByText(/révoquée le/)).toBeVisible()

    // 3. Code inexistant
    await page.getByLabel("Code de l'attestation").fill('CODE-INCONNU-999')
    await page.getByRole('button', { name: 'Vérifier' }).click()

    const notFoundAlert = page.getByTestId('verify-not-found')
    await expect(notFoundAlert).toBeVisible()
    await expect(notFoundAlert).toHaveText(
      'Aucune attestation ne correspond à ce code. Vérifiez la saisie.',
    )
  })
})
