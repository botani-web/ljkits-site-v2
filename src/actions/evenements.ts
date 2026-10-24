'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { EtatFormulaire } from '@/actions/etat'
import { exigerAdmin } from '@/actions/garde'
import { prisma } from '@/lib/prisma'

/**
 * Les événements (24/10/2026) : création, modification, manches exclues, suppression.
 * Chaque action commence par exigerAdmin() (cf. garde.ts).
 */

function dateIso(v: string, ctx: z.RefinementCtx) {
  const d = new Date(v)
  if (v === '' || Number.isNaN(d.getTime())) {
    ctx.addIssue({ code: 'custom', message: 'Date illisible.' })
    return z.NEVER
  }
  return d
}

const schema = z
  .object({
    id: z.coerce.number().int().min(0),
    nom: z.string().trim().min(3, '3 caractères au moins.').max(80),
    nomEn: z.string().trim().max(80),
    slug: z
      .string()
      .trim()
      .max(60)
      .regex(/^[a-z0-9]*(?:-[a-z0-9]+)*$/, 'Minuscules, chiffres et tirets.'),
    description: z.string().trim().max(1200),
    descriptionEn: z.string().trim().max(1200),
    debut: z.string().trim().transform(dateIso),
    fin: z.string().trim().transform(dateIso),
    cashprize: z.string().trim().max(20),
    prix: z.string().trim().max(600),
    prixEn: z.string().trim().max(600),
    points: z
      .string()
      .trim()
      .transform((v, ctx) => {
        const l = v.split(/[\s,;/]+/).filter(Boolean).map(Number)
        if (l.length === 0 || l.length > 40 || l.some((n) => !Number.isInteger(n) || n < 0 || n > 1000)) {
          ctx.addIssue({ code: 'custom', message: 'Des nombres entiers séparés par des virgules (1er, 2e, …).' })
          return z.NEVER
        }
        return l
      }),
    pointsKill: z.coerce.number().int().min(0).max(100),
    publie: z.boolean(),
  })
  .refine((v) => v.fin > v.debut, { path: ['fin'], message: 'La fin doit venir après le début.' })

/** « Tournoi HG Run #1 » → « tournoi-hg-run-1 ». */
function slugDe(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function rafraichir(slug?: string) {
  revalidateTag('evenements')
  revalidatePath('/admin/evenements')
  for (const l of ['fr', 'en']) {
    revalidatePath(`/${l}/evenements`)
    if (slug) revalidatePath(`/${l}/evenements/${slug}`)
  }
}

export async function enregistrerEvenement(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerAdmin()
  const r = schema.safeParse({
    id: String(formData.get('id') ?? '0'),
    nom: String(formData.get('nom') ?? ''),
    nomEn: String(formData.get('nomEn') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    description: String(formData.get('description') ?? ''),
    descriptionEn: String(formData.get('descriptionEn') ?? ''),
    // Convertis en ISO par le navigateur (heure de l'admin, Paris) : le serveur est en UTC.
    debut: String(formData.get('debutIso') ?? ''),
    fin: String(formData.get('finIso') ?? ''),
    cashprize: String(formData.get('cashprize') ?? ''),
    prix: String(formData.get('prix') ?? ''),
    prixEn: String(formData.get('prixEn') ?? ''),
    points: String(formData.get('points') ?? ''),
    pointsKill: String(formData.get('pointsKill') ?? '2'),
    publie: formData.get('publie') === 'on',
  })
  if (!r.success) return { champs: r.error.flatten().fieldErrors }
  const { id, ...v } = r.data
  const slug = v.slug || slugDe(v.nom)
  if (!slug) return { champs: { slug: ['Choisis une adresse.'] } }
  const deja = await prisma.evenement.findUnique({ where: { slug } })
  if (deja && deja.id !== id) return { champs: { slug: ['Cette adresse est déjà prise.'] } }

  const donnees = { ...v, slug }
  if (id > 0) {
    await prisma.evenement.update({ where: { id }, data: donnees })
    rafraichir(slug)
    return { succes: 'Événement enregistré.' }
  }
  const cree = await prisma.evenement.create({ data: donnees })
  rafraichir(slug)
  redirect(`/admin/evenements/${cree.id}`)
}

/** Une partie du créneau compte / ne compte plus (test, manche boguée). */
export async function basculerManche(formData: FormData) {
  await exigerAdmin()
  const id = Number(formData.get('id'))
  const partie = String(formData.get('partie') ?? '')
  if (!Number.isInteger(id) || !/^\d+$/.test(partie)) return
  const e = await prisma.evenement.findUnique({ where: { id } })
  if (!e) return
  const p = BigInt(partie)
  const exclues = e.exclues.some((x) => x === p) ? e.exclues.filter((x) => x !== p) : [...e.exclues, p]
  await prisma.evenement.update({ where: { id }, data: { exclues } })
  rafraichir(e.slug)
}

export async function supprimerEvenement(formData: FormData) {
  await exigerAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return
  if (formData.get('confirmer') !== 'SUPPRIMER') return
  const e = await prisma.evenement.delete({ where: { id } }).catch(() => null)
  rafraichir(e?.slug)
  redirect('/admin/evenements')
}
