import { describe, expect, it } from 'vitest'
import {
  etatCriteres,
  motDePasseValide,
  confirmationValide,
  peutEnvoyerMotDePasse,
} from '../passwordRules'

describe('passwordRules', () => {
  it('met tous les criteres au-repos si le mot de passe est vide', () => {
    const criteres = etatCriteres('')
    expect(criteres.every((c) => c.etat === 'au-repos')).toBe(true)
    expect(motDePasseValide('')).toBe(false)
  })

  it('detecte les criteres manquants individuellement', () => {
    // Manque majuscule
    const sansMaj = etatCriteres('azerty123!')
    expect(sansMaj.find((c) => c.cle === 'majuscule')?.etat).toBe('manquante')

    // Manque minuscule
    const sansMin = etatCriteres('AZERTY123!')
    expect(sansMin.find((c) => c.cle === 'minuscule')?.etat).toBe('manquante')

    // Manque chiffre
    const sansChiffre = etatCriteres('Azertyuiop!')
    expect(sansChiffre.find((c) => c.cle === 'chiffre')?.etat).toBe('manquante')

    // Manque special
    const sansSpecial = etatCriteres('Azerty1234')
    expect(sansSpecial.find((c) => c.cle === 'special')?.etat).toBe('manquante')

    // Trop court
    const tropCourt = etatCriteres('Az1!')
    expect(tropCourt.find((c) => c.cle === 'longueur')?.etat).toBe('manquante')
  })

  it('valide un mot de passe complet respectant les 5 regles', () => {
    const valide = etatCriteres('Passw0rd!2026')
    expect(valide.every((c) => c.etat === 'remplie')).toBe(true)
    expect(motDePasseValide('Passw0rd!2026')).toBe(true)
  })

  it('verifie la confirmation et la possibilite denvoi', () => {
    expect(confirmationValide('', '')).toBe(false)
    expect(confirmationValide('Passw0rd!', 'AutrePass!')).toBe(false)
    expect(confirmationValide('Passw0rd!', 'Passw0rd!')).toBe(true)

    expect(peutEnvoyerMotDePasse('Passw0rd!2026', 'Passw0rd!2026')).toBe(true)
    expect(peutEnvoyerMotDePasse('court', 'court')).toBe(false)
  })
})
