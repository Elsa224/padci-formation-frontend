/** Les cinq conditions de mot de passe requises par le backend. */
export const CLES_REGLES = ['longueur', 'majuscule', 'minuscule', 'chiffre', 'special'] as const

export type CleRegle = (typeof CLES_REGLES)[number]

const TESTS: Record<CleRegle, (valeur: string) => boolean> = {
  longueur: (valeur) => valeur.length >= 8,
  majuscule: (valeur) => /\p{Lu}/u.test(valeur),
  minuscule: (valeur) => /\p{Ll}/u.test(valeur),
  chiffre: (valeur) => /\p{N}/u.test(valeur),
  special: (valeur) => /[\p{P}\p{S}\p{Z}]/u.test(valeur),
}

export type EtatCritere = 'au-repos' | 'remplie' | 'manquante'

export interface Critere {
  readonly cle: CleRegle
  readonly etat: EtatCritere
}

export function etatCriteres(valeur: string): Critere[] {
  return CLES_REGLES.map((cle) => ({ cle, etat: etatCritere(cle, valeur) }))
}

function etatCritere(cle: CleRegle, valeur: string): EtatCritere {
  if (valeur === '') {
    return 'au-repos'
  }

  return TESTS[cle](valeur) ? 'remplie' : 'manquante'
}

export function motDePasseValide(valeur: string): boolean {
  return CLES_REGLES.every((cle) => TESTS[cle](valeur))
}

export function confirmationValide(motDePasse: string, confirmation: string): boolean {
  return motDePasse !== '' && motDePasse === confirmation
}

export function peutEnvoyerMotDePasse(motDePasse: string, confirmation: string): boolean {
  return motDePasseValide(motDePasse) && confirmationValide(motDePasse, confirmation)
}
