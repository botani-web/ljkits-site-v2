/**
 * Écrit les traductions anglaises en base.
 *
 * Ne touche QUE les colonnes `...En` : le français reste intact, quoi qu'il
 * arrive. Idempotent, et bavard sur ce qui ne correspond à rien — une clé
 * qui ne retrouve pas sa ligne est signalée plutôt qu'ignorée.
 */
import { PrismaClient } from '@prisma/client'
import { KITS_EN } from '../prisma/traductions/kits-en'
import {
  GRADES_EN,
  PACKS_EN,
  QUESTIONS_RECRUTEMENT_EN,
  REGLEMENT_EN,
  SECTIONS_RECRUTEMENT_EN,
} from '../prisma/traductions/contenu-en'

const prisma = new PrismaClient()
const alertes: string[] = []
let ecrits = 0

async function kits() {
  const kits = await prisma.kit.findMany({
    include: { caracteristiques: { orderBy: { ordre: 'asc' } } },
  })
  const connus = new Set(Object.keys(KITS_EN))
  for (const kit of kits) {
    const t = KITS_EN[kit.slug]
    if (!t) {
      alertes.push(`kit sans traduction : ${kit.slug}`)
      continue
    }
    connus.delete(kit.slug)
    await prisma.kit.update({
      where: { id: kit.id },
      data: {
        roleEn: t.role,
        descriptionCourteEn: t.descriptionCourte,
        descriptionLongueEn: t.descriptionLongue,
      },
    })
    ecrits++
    if (t.caracteristiques.length !== kit.caracteristiques.length) {
      alertes.push(
        `${kit.slug} : ${kit.caracteristiques.length} caractéristiques en base, ` +
          `${t.caracteristiques.length} traduites — appariement abandonné`,
      )
      continue
    }
    for (const [i, carac] of kit.caracteristiques.entries()) {
      await prisma.caracteristiqueKit.update({
        where: { id: carac.id },
        data: {
          libelleEn: t.caracteristiques[i].libelle,
          valeurEn: t.caracteristiques[i].valeur,
        },
      })
      ecrits++
    }
  }
  for (const restant of connus) alertes.push(`traduction sans kit en base : ${restant}`)
}

async function reglement() {
  const sections = await prisma.sectionReglement.findMany()
  const connus = new Set(Object.keys(REGLEMENT_EN))
  for (const s of sections) {
    const t = REGLEMENT_EN[s.titre]
    if (!t) {
      alertes.push(`règlement sans traduction : « ${s.titre} »`)
      continue
    }
    connus.delete(s.titre)
    await prisma.sectionReglement.update({
      where: { id: s.id },
      data: { titreEn: t.titre, contenuEn: t.contenu },
    })
    ecrits++
  }
  for (const r of connus) alertes.push(`traduction de règlement sans section : « ${r} »`)
}

async function grades() {
  for (const [slug, t] of Object.entries(GRADES_EN)) {
    const grade = await prisma.grade.findUnique({
      where: { slug },
      include: { avantages: { orderBy: { ordre: 'asc' } } },
    })
    if (!grade) {
      alertes.push(`grade absent en base : ${slug}`)
      continue
    }
    await prisma.grade.update({
      where: { id: grade.id },
      data: { sousTitreEn: t.sousTitre, etiquetteEn: t.etiquette },
    })
    ecrits++
    if (t.avantages.length !== grade.avantages.length) {
      alertes.push(
        `grade ${slug} : ${grade.avantages.length} avantages en base, ${t.avantages.length} traduits`,
      )
      continue
    }
    for (const [i, a] of grade.avantages.entries()) {
      await prisma.avantageGrade.update({ where: { id: a.id }, data: { texteEn: t.avantages[i] } })
      ecrits++
    }
  }
}

async function packs() {
  for (const [slug, t] of Object.entries(PACKS_EN)) {
    const pack = await prisma.pack.findUnique({ where: { slug } })
    if (!pack) {
      alertes.push(`pack absent en base : ${slug}`)
      continue
    }
    await prisma.pack.update({
      where: { id: pack.id },
      data: { nomEn: t.nom, descriptionEn: t.description },
    })
    ecrits++
  }
}

async function recrutement() {
  for (const s of await prisma.sectionRecrutement.findMany()) {
    const t = SECTIONS_RECRUTEMENT_EN[s.nom]
    if (!t) {
      alertes.push(`section de recrutement sans traduction : « ${s.nom} »`)
      continue
    }
    await prisma.sectionRecrutement.update({ where: { id: s.id }, data: { nomEn: t } })
    ecrits++
  }
  for (const q of await prisma.questionRecrutement.findMany()) {
    const t = QUESTIONS_RECRUTEMENT_EN[q.libelle]
    if (!t) {
      alertes.push(`question sans traduction : « ${q.libelle.slice(0, 50)}… »`)
      continue
    }
    await prisma.questionRecrutement.update({
      where: { id: q.id },
      data: { libelleEn: t.libelle, aideEn: t.aide ?? null },
    })
    ecrits++
  }
}

await kits()
await reglement()
await grades()
await packs()
await recrutement()

console.log(`\n${ecrits} enregistrement(s) traduits.`)
if (alertes.length) {
  console.log(`\n⚠ ${alertes.length} point(s) à regarder :`)
  for (const a of alertes) console.log(`   ${a}`)
} else {
  console.log('Aucune anomalie : tout le contenu a trouvé sa traduction.')
}
await prisma.$disconnect()
