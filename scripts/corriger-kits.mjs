/**
 * Corrige les fiches kits divergentes et ajoute les dix nouveaux exclusifs.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  POURQUOI UN SCRIPT ET PAS L'ADMIN
 * ═══════════════════════════════════════════════════════════════════════
 * Onze kits à écrire ou reprendre, chacun avec un texte long et trois
 * caractéristiques. À la main dans l'admin, c'est une heure de
 * copier-coller et une occasion de se tromper. Ici, la source est lisible,
 * relisible, et rejouable si la base est restaurée.
 *
 * IDEMPOTENT : chaque kit est écrit par `upsert` sur son slug, et ses
 * caractéristiques sont remplacées en bloc. Relancer le script deux fois
 * donne exactement le même résultat.
 *
 * NE TOUCHE PAS : visible, achetable, bientot, kitDeDepart, tebexPackageId,
 * ordre des kits existants. Ce sont des réglages qui t'appartiennent, pris
 * depuis l'admin ; le script ne connaît que ce que kits.yml sait.
 *
 *   node scripts/corriger-kits.mjs           # aperçu, n'écrit rien
 *   node scripts/corriger-kits.mjs --ecrire  # applique
 */
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()
const ECRIRE = process.argv.includes('--ecrire')

/* ═══════════════════════════════════════════════════════════════════════
   1. LES CORRECTIONS — six fiches qui ne disent plus la vérité du jeu
   ═══════════════════════════════════════════════════════════════════════ */
const CORRECTIONS = [
  {
    slug: 'anchor',
    // LE PLUS GRAVE. L'aura de Lenteur a été SUPPRIMÉE du kit ; la fiche
    // l'annonçait encore. Des joueurs l'ont acheté pour ça.
    role: 'Encaisse',
    descriptionCourte:
      "Le recul ne te déplace plus. Là où les autres reculent d'un mètre à chaque coup, tu ne bouges pas.",
    descriptionLongue: `Ton **recul est ramené à zéro**, horizontalement comme verticalement. Un coup d'épée te fait mal, mais il ne te déplace plus.

Sur un serveur soup, le recul est ce qui décide de la distance. Un joueur repoussé perd le contact, doit revancer, et boit pendant ce temps. L'Anchor supprime cette respiration : une fois collé, il reste collé.

Le revers est entier. Tu ne peux plus te servir du recul pour décrocher, ni être projeté hors d'un mauvais échange. Tu prends le combat que tu as engagé, jusqu'au bout.

> **Note du 03/09/2026** — l'aura de Lenteur annoncée par cette fiche jusqu'ici a été retirée du kit. Cumuler un ralentissement de zone et une immunité au recul en aurait fait le meilleur kit du serveur, sans contre.`,
    caracteristiques: [
      { libelle: 'Recul subi', valeur: 'Aucun' },
      { libelle: 'Recul vertical', valeur: 'Aucun' },
      { libelle: 'Cooldown', valeur: 'Passif permanent' },
    ],
  },
  {
    slug: 'berserker',
    // La caractéristique disait 3,5 ❤ ; le texte long et le jeu disent 2,5.
    caracteristiques: [
      { libelle: 'Effet', valeur: 'Force I' },
      { libelle: 'Seuil', valeur: 'Sous 2,5 ❤' },
    ],
  },
  {
    slug: 'kenshi',
    // Le jeu applique 1,55 / 1,45 / 1,30 : le premier coup fait +55 %, pas +60.
    caracteristiques: [
      { libelle: '1er coup', valeur: '+55 % de dégâts' },
      { libelle: '2e coup', valeur: '+45 %' },
      { libelle: '3e coup', valeur: '+30 %' },
    ],
    remplacer: [['+60 % de dégâts**', '+55 % de dégâts**']],
  },
  {
    slug: 'reaper',
    // duree-secondes vaut 6 dans kits.yml, la fiche annonçait 3.
    caracteristiques: [
      { libelle: 'Item', valeur: 'Houe en fer' },
      { libelle: 'Effet', valeur: 'Wither I · 6 s' },
      { libelle: 'Cooldown', valeur: '6 s' },
    ],
  },
  {
    slug: 'gladiator',
    // duree-secondes vaut 0 : le duel va jusqu'à la mort, il n'y a plus
    // de match nul au bout de 30 secondes.
    descriptionCourte:
      "Tu enfermes ta cible avec toi dans une cage. Plus de gank, plus de fuite : un vrai 1v1, jusqu'à la mort.",
    descriptionLongue: `Un bâton de blaze qui vous enferme, toi et ta cible, dans une cage. **Le duel va jusqu'à la mort** : il n'y a pas de minuteur, pas de match nul. Rechargement : **45 secondes**.

Le Gladiator isole. Il sort un joueur d'une mêlée où tu serais à trois contre un, ou coince un fuyard qui allait rejoindre sa team. Une fois la cage posée, il n'y a plus que deux joueurs et une seule issue.

C'est un engagement des deux côtés : tu ne peux pas en sortir non plus. Six cages seulement existent en même temps sur le serveur — si elles sont toutes prises, ton bâton ne fait rien, et ton rechargement n'est pas consommé pour autant.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Bâton de blaze' },
      { libelle: 'Durée', valeur: "Jusqu'à la mort" },
      { libelle: 'Cooldown', valeur: '45 s' },
    ],
  },
  {
    slug: 'tanuki',
    // Le cooldown de 20 s n'était affiché nulle part.
    caracteristiques: [
      { libelle: 'Item', valeur: 'Plume' },
      { libelle: 'Durée du leurre', valeur: '4 s' },
      { libelle: 'Cooldown', valeur: '20 s' },
    ],
  },
]

/* ═══════════════════════════════════════════════════════════════════════
   2. LES DIX NOUVEAUX EXCLUSIFS
   ═══════════════════════════════════════════════════════════════════════ */
const NOUVEAUX = [
  {
    slug: 'karasu', nom: 'Karasu', kanji: '烏', role: 'Fuite', prixCoins: 25000,
    descriptionCourte: "Cinq secondes de vitesse et de saut pour décrocher — mais tu ne peux pas frapper pendant ce temps.",
    descriptionLongue: `En t'accroupissant, tu gagnes **Vitesse III et Saut II pendant 5 secondes**. Pendant tout ce temps, **tes attaques sont annulées** — à l'épée comme à l'arc.

C'est ce qui empêche le Karasu d'être un kit de vitesse déguisé. Foncer sur ta cible ne sert à rien : tu arriveras désarmé, et il faudra attendre la fin de l'envol pour porter le premier coup. La capacité sert à **sortir** d'une position, jamais à en prendre une.

Le saut compte autant que la vitesse : sans lui, on bute sur le premier muret et on se fait rattraper. Avec, le terrain s'ouvre.

Le contre est simple : le suivre. Le corbeau ne devient pas invisible et ne traverse pas les murs — il court vite, sans arme, pendant cinq secondes.`,
    caracteristiques: [
      { libelle: 'Activation', valeur: 'Accroupissement' },
      { libelle: 'Effets', valeur: 'Vitesse III · Saut II' },
      { libelle: 'Durée', valeur: '5 s, désarmé' },
      { libelle: 'Cooldown', valeur: '20 s' },
    ],
  },
  {
    slug: 'ishi', nom: 'Ishi', kanji: '石', role: 'Encaisse', prixCoins: 25000,
    descriptionCourte: "Trois secondes de pierre : tu ne bouges plus, mais tu encaisses presque tout.",
    descriptionLongue: `En t'accroupissant, tu prends **60 % de dégâts en moins pendant 3 secondes**. En échange, tu es **totalement immobile**.

La réduction vaut contre tout : épée, flèche, feu, chute. Un rocher qui ne résisterait qu'aux épées n'aurait aucun sens.

**Relâcher l'accroupissement interrompt la posture immédiatement.** Toute capacité qui retire le contrôle doit pouvoir être rendue par celui qui l'a prise. Le rechargement part quand même : interrompre ne rembourse pas.

En 1v1 c'est un outil ; au milieu d'une mêlée, c'est offrir sa position à tout le monde pendant trois secondes. Le même bouton fait les deux, et c'est au joueur de savoir quand il est bon.`,
    caracteristiques: [
      { libelle: 'Activation', valeur: 'Accroupissement' },
      { libelle: 'Réduction', valeur: '−60 % de dégâts' },
      { libelle: 'Durée', valeur: '3 s, immobile' },
      { libelle: 'Cooldown', valeur: '25 s' },
    ],
  },
  {
    slug: 'baku', nom: 'Baku', kanji: '獏', role: 'Usure', prixCoins: 25000,
    descriptionCourte: "Tes coups volent la soupe de ta victime. Ce n'est pas ce que tu gagnes qui compte, c'est ce qu'elle perd.",
    descriptionLongue: `Un coup sur quatre retire **une soupe** de l'inventaire adverse et la met dans le tien. Au plus **un vol toutes les 4 secondes**, quelle que soit ta vitesse de clic.

L'intérêt n'est pas la soupe gagnée : c'est la soupe **perdue** par l'autre. Sur un long combat, le Baku transforme une guerre d'usure en avantage matériel, sans jamais frapper plus fort.

Au-delà de **24 soupes** sur toi, la soupe volée est **détruite** au lieu d'être prise. Tu prives toujours ta victime, mais tu ne dépasses jamais ce qu'un kit te donne au départ — le Baku économise des allers-retours au refill, il ne s'en passe pas.

Le contre : il ne finit pas les combats, il les prépare. Contre quelqu'un qui tue vite, il n'a pas le temps d'accumuler.`,
    caracteristiques: [
      { libelle: 'Chance', valeur: '25 % par coup' },
      { libelle: 'Cadence', valeur: '1 vol / 4 s max' },
      { libelle: 'Plafond', valeur: '24 soupes' },
      { libelle: 'Portée', valeur: 'Mêlée uniquement' },
    ],
  },
  {
    slug: 'hachi', nom: 'Hachi', kanji: '蜂', role: 'Harcèlement', prixCoins: 25000,
    descriptionCourte: "Chaque kill libère trois guêpes qui partent chasser le joueur suivant.",
    descriptionLongue: `À chaque kill, **trois guêpes** se lancent à la poursuite de l'adversaire le plus proche pendant **5 secondes**. Chacune inflige un **demi-cœur** et disparaît en piquant.

Tuer ne te donne rien à toi : pas de soin comme le Vampire, pas de queue comme le Kitsune. Tu gagnes du **temps** — trois guêpes qui vont chercher le suivant pendant que tu souffles.

Sur un serveur où l'on enchaîne les combats, empêcher l'adversaire suivant de refill tranquillement vaut souvent plus que deux cœurs.

Un cœur et demi au total si les trois touchent : c'est de la pression, pas une exécution.`,
    caracteristiques: [
      { libelle: 'Déclenchement', valeur: 'À chaque kill' },
      { libelle: 'Guêpes', valeur: '3 · 5 s de vol' },
      { libelle: 'Dégâts', valeur: '½ ❤ chacune' },
      { libelle: 'Portée', valeur: '25 blocs' },
    ],
  },
  {
    slug: 'kappa', nom: 'Kappa', kanji: '河童', role: 'Contrôle', prixCoins: 25000,
    descriptionCourte: "Un puits qui aspire vers toi tout ce qui t'entoure. Aucun dégât — tu décides juste où sont les autres.",
    descriptionLongue: `En t'accroupissant, tous les joueurs dans un rayon de **6 blocs** sont **aspirés de 3 blocs vers toi**. Le Kappa n'inflige rien.

Sa valeur est ailleurs : annuler un décrochage, ramener une cible qui court vers son refill, rassembler deux adversaires au même endroit. C'est le seul kit du serveur qui décide de la **position** des autres sans les toucher.

Le puits ne trie pas. Aspirer pour rattraper un fuyard ramène aussi les trois joueurs que tu n'avais pas vus. En 1v1 c'est un outil, en mêlée générale c'est une prise de risque — et c'est la même touche.

Le rechargement part même si le puits est vide : sinon ce serait un détecteur de présence gratuit, utilisable en boucle.`,
    caracteristiques: [
      { libelle: 'Activation', valeur: 'Accroupissement' },
      { libelle: 'Rayon', valeur: '6 blocs' },
      { libelle: 'Effet', valeur: 'Aspiration, aucun dégât' },
      { libelle: 'Cooldown', valeur: '25 s' },
    ],
  },
  {
    slug: 'mushin', nom: 'Mushin', kanji: '無心', role: "Tout ou rien", prixCoins: 25000,
    descriptionCourte: "Tu frappes 30 % plus fort quand il ne te reste presque plus de soupe. Le courage, littéralement récompensé.",
    descriptionLongue: `Tant qu'il te reste **2 soupes ou moins**, tes coups en mêlée font **+30 % de dégâts**. Rien à activer, rien à recharger : ton état décide, en permanence.

C'est le seul kit qui récompense le fait de ne pas se soigner. Le coût est entier — sur un serveur soup, jouer presque à sec, c'est jouer sans filet, et une erreur ne se répare pas. Les 30 % ne compensent pas la perte du soin : ils compensent le **risque** de ne plus pouvoir se tromper.

Un Mushin qui garde ses soupes est un kit sans capacité. C'est exactement l'intention : le bonus se mérite à chaque seconde.

Le contre est de le voir venir. Un Mushin qui frappe fort est un Mushin sans réserve : il suffit de tenir. C'est le seul kit du serveur où la bonne réponse est parfois de reculer et d'attendre.`,
    caracteristiques: [
      { libelle: 'Condition', valeur: '2 soupes ou moins' },
      { libelle: 'Bonus', valeur: '+30 % de dégâts' },
      { libelle: 'Portée', valeur: 'Mêlée uniquement' },
      { libelle: 'Cooldown', valeur: 'Passif permanent' },
    ],
  },
  {
    slug: 'kagami', nom: 'Kagami', kanji: '鏡', role: 'Riposte', prixCoins: 25000,
    descriptionCourte: "Cinq secondes pendant lesquelles la moitié de ce que tu prends repart à l'expéditeur.",
    descriptionLongue: `Clic droit sur la vitre : pendant **5 secondes**, **la moitié des dégâts que tu subis revient à ton attaquant**.

Le Kagami n'encaisse pas moins — il prend tout, comme avant. Il rend simplement la pareille. La différence avec l'Ishi est entière : l'Ishi survit, le Kagami échange. Les deux peuvent mourir de leur propre capacité, pour des raisons opposées.

**Le reflet peut tuer, et le kill te revient** — avec ses coins, sa série et son Elo. Un kit qui tue sans que personne ne reçoive le kill serait un bug, pas une subtilité.

L'activation est volontairement voyante : éclat argenté et son de verre, perçus par tous autour. Un bon adversaire arrête de frapper et attend la fin. C'est exactement le duel qu'on veut créer.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Vitre' },
      { libelle: 'Renvoi', valeur: '50 % des dégâts' },
      { libelle: 'Durée', valeur: '5 s' },
      { libelle: 'Cooldown', valeur: '30 s' },
    ],
  },
  {
    slug: 'kusari', nom: 'Kusari', kanji: '鎖', role: 'Anti-fuite', prixCoins: 25000,
    descriptionCourte: "Tu enchaînes un adversaire pendant six secondes. Au-delà de cinq blocs, la chaîne vous tire tous les deux.",
    descriptionLongue: `Clic droit sur la laisse : tu **enchaînes** un joueur proche pendant **6 secondes**. Si l'un de vous s'éloigne à plus de **5 blocs**, **vous êtes tirés tous les deux** vers le milieu.

Elle attache les deux bouts, et c'est le point d'équilibre du kit. Enchaîner plus fort que soi, c'est signer : on ne peut plus décrocher non plus. La Kusari ne dit pas « je te rattrape », elle dit « on règle ça maintenant » — et ce n'est une bonne idée que si tu es en train de gagner.

Rien ne se passe tant que vous êtes à moins de cinq blocs : on se bat normalement. La chaîne ne se tend qu'au-delà, et **proportionnellement à l'écart** — un pas de trop se corrige à peine, une fuite franche se paie cher.

Une action bar affiche en permanence chez les deux joueurs qui est enchaîné, la distance et le temps restant.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Laisse' },
      { libelle: 'Durée', valeur: '6 s' },
      { libelle: 'Tension', valeur: 'Au-delà de 5 blocs' },
      { libelle: 'Cooldown', valeur: '30 s' },
    ],
  },
  {
    slug: 'tokei', nom: 'Tokei', kanji: '時計', role: 'Seconde chance', prixCoins: 25000,
    descriptionCourte: "Tu mémorises un instant — position et points de vie — et tu peux y revenir dans les huit secondes.",
    descriptionLongue: `Premier clic droit sur la montre : ta **position et tes points de vie** sont mémorisés. Second clic dans les **8 secondes** : tu y reviens.

Ce n'est pas une fuite, c'est un pari. Marquer à 10 cœurs puis plonger, c'est s'offrir un all-in gratuit. Marquer trop tard, à 2 cœurs, c'est ne rien sauver du tout.

**Le rechargement démarre à la marque, pas au retour.** C'est ce qui rend le kit honnête : s'il partait au retour, marquer serait gratuit, on poserait une marque en permanence, et le kit deviendrait un filet de sécurité plutôt qu'une décision. Ici, une marque gâchée coûte 60 secondes.

Le soin ne peut jamais être une perte : la vie n'est rendue que si elle est **plus basse** que celle mémorisée.

**La marque est visible par tous** — des particules au sol. Ton adversaire sait qu'un retour est armé et où il aboutira : il doit te tuer avant les huit secondes, ou tenir la position. Une marque invisible ferait de ce kit une frustration pure.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Montre' },
      { libelle: 'Fenêtre', valeur: '8 s pour revenir' },
      { libelle: 'Restaure', valeur: 'Position et vie' },
      { libelle: 'Cooldown', valeur: '60 s, dès la marque' },
    ],
  },
  {
    slug: 'shio', nom: 'Shio', kanji: '塩', role: 'Anti-soin', prixCoins: 25000,
    descriptionCourte: "Tes coups coupent parfois le soin de ta victime. Sur un serveur soup, c'est sa barre de vie que tu touches.",
    descriptionLongue: `Un coup sur trois environ **empêche ta victime de boire pendant 1 seconde**. Au plus **un blocage toutes les 2,5 secondes**, quelle que soit ta vitesse de clic.

Sur un serveur soup, la soupe **est** la barre de vie. Bloquer le soin ne fait pas « un peu plus de dégâts » : ça change la nature du combat.

Le hasard est délibéré. Un blocage à chaque coup rendait la victime incapable de boire en continu, sans aucun contre. En le rendant imprévisible, elle ne peut plus compter les coups pour savoir quand tenter sa gorgée — mais elle sait qu'elle boira dans trois secondes au pire.

Le contre-jeu est de reculer : le sel ne se renouvelle qu'au contact. Un Shio qui arrête de frapper perd son effet en une seconde. Le kit force l'agression permanente, ce qui l'expose.

Mêlée uniquement — un Shio à l'arc pourrait bloquer le soin à quarante blocs sans jamais s'exposer.`,
    caracteristiques: [
      { libelle: 'Chance', valeur: '30 % par coup' },
      { libelle: 'Blocage', valeur: '1 s de soin coupé' },
      { libelle: 'Cadence', valeur: '1 blocage / 2,5 s max' },
      { libelle: 'Portée', valeur: 'Mêlée uniquement' },
    ],
  },
]

/* ═══════════════════════════════════════════════════════════════════════ */
async function main() {
  console.log(ECRIRE ? '── ÉCRITURE ──\n' : '── APERÇU (rien n\'est écrit) ──\n')

  console.log('CORRECTIONS')
  for (const c of CORRECTIONS) {
    const kit = await prisma.kit.findUnique({ where: { slug: c.slug } })
    if (!kit) { console.log(`  ${c.slug.padEnd(11)} ABSENT — ignoré`); continue }

    const donnees = {}
    if (c.role) donnees.role = c.role
    if (c.descriptionCourte) donnees.descriptionCourte = c.descriptionCourte
    if (c.descriptionLongue) donnees.descriptionLongue = c.descriptionLongue
    if (c.remplacer) {
      let texte = kit.descriptionLongue
      for (const [de, vers] of c.remplacer) texte = texte.split(de).join(vers)
      donnees.descriptionLongue = texte
    }
    console.log(`  ${c.slug.padEnd(11)} ${Object.keys(donnees).join(', ') || '—'}`
      + (c.caracteristiques ? ` + ${c.caracteristiques.length} caractéristiques` : ''))

    if (!ECRIRE) continue
    if (Object.keys(donnees).length) await prisma.kit.update({ where: { slug: c.slug }, data: donnees })
    if (c.caracteristiques) {
      await prisma.caracteristiqueKit.deleteMany({ where: { kitId: kit.id } })
      await prisma.caracteristiqueKit.createMany({
        data: c.caracteristiques.map((x, i) => ({ kitId: kit.id, libelle: x.libelle, valeur: x.valeur, ordre: i })),
      })
    }
  }

  const dernier = await prisma.kit.findFirst({ orderBy: { ordre: 'desc' } })
  let ordre = (dernier?.ordre ?? 0) + 1

  console.log('\nNOUVEAUX')
  for (const k of NOUVEAUX) {
    const existant = await prisma.kit.findUnique({ where: { slug: k.slug } })
    console.log(`  ${k.slug.padEnd(11)} ${existant ? 'mise à jour' : 'création'} · ${k.caracteristiques.length} caractéristiques`)
    if (!ECRIRE) continue

    const base = {
      nom: k.nom, kanji: k.kanji, role: k.role,
      descriptionCourte: k.descriptionCourte, descriptionLongue: k.descriptionLongue,
      prixCoins: k.prixCoins, type: 'EXCLUSIF',
    }
    const kit = await prisma.kit.upsert({
      where: { slug: k.slug },
      // À la création seulement : visible, et jamais achetable en euros —
      // plus aucun kit ne se vend sur le site.
      create: { slug: k.slug, ...base, visible: true, achetable: false, ordre: ordre++ },
      // À la mise à jour : on ne touche NI à l'ordre, NI aux drapeaux.
      update: base,
    })
    await prisma.caracteristiqueKit.deleteMany({ where: { kitId: kit.id } })
    await prisma.caracteristiqueKit.createMany({
      data: k.caracteristiques.map((x, i) => ({ kitId: kit.id, libelle: x.libelle, valeur: x.valeur, ordre: i })),
    })
  }

  const total = await prisma.kit.count()
  console.log(`\nTotal en base : ${total} kits${ECRIRE ? '' : ' (inchangé, aperçu)'}`)
}

main()
  .catch((e) => { console.error('ÉCHEC :', e.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
