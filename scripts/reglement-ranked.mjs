import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Le reglement de la saison competitive.
 *
 * IL REMPLACE L'ANCIEN, il ne s'y ajoute pas : un reglement en deux
 * parties, l'une ecrite avant le classement Elo et l'autre apres, se
 * contredirait sur les points qui comptent — ce qui compte comme
 * combat, ce qui vaut disqualification.
 *
 * L'ORDRE SUIT LA LECTURE D'UN JOUEUR, pas la gravite : ce qu'il
 * gagne, comment il y arrive, ce qui l'en prive. Les regles de
 * conduite generales viennent apres, parce qu'on ne les lit qu'une
 * fois.
 *
 * `{discord}` est remplace par le lien Discord a l'affichage.
 */
const SECTIONS = [
  {
    titre: 'La compétition',
    contenu: `Chaque mois, **150 € sont répartis entre les 5 premiers** du classement Elo.

Tout le monde démarre à **1000 Elo**. Battre un joueur mieux classé rapporte beaucoup, battre un joueur moins bien classé rapporte peu — et l'inverse pour les défaites. Ce que tu gagnes, ton adversaire le perd : le total ne bouge jamais.

> **Répartition :** 1ᵉʳ **60 €** · 2ᵉ **35 €** · 3ᵉ **25 €** · 4ᵉ **20 €** · 5ᵉ **10 €**

La saison se termine le **1ᵉʳ de chaque mois à 00h00** (heure de Paris). Le classement est figé à cet instant précis, puis tout le monde repart à 1000 Elo.

Les kits, les cosmétiques et les coins **ne sont jamais remis à zéro**. Seul l'Elo l'est.`,
  },
  {
    titre: 'Être éligible au cashprize',
    contenu: `Trois conditions, toutes obligatoires :

> **1.** Avoir disputé au moins **100 combats classés** dans la saison.
> **2.** Avoir **lié son compte Discord** — tape \`/discord\` en jeu. Sans liaison, tu joues et tu progresses normalement, mais tu **n'apparais pas au classement**.
> **3.** N'avoir **aucune sanction en cours** au moment de la clôture.

Les 100 combats écartent le compte créé la veille de la fin de saison. Ils se comptent en **combats classés**, pas en kills : une mort compte autant qu'un kill.

En cas d'**égalité parfaite d'Elo**, c'est le joueur ayant le **plus de combats** qui passe devant. Si l'égalité persiste, celui qui a atteint cet Elo **en premier**.`,
  },
  {
    titre: 'Ce qui compte comme combat classé',
    contenu: `Un combat ne fait bouger l'Elo que si **toutes** ces conditions sont réunies :

> **Les deux joueurs sont en mode ranked.** Si l'un des deux l'a coupé, le combat ne compte pour personne.
> **Les deux joueurs ont un kit actif.** Tuer quelqu'un qui n'a pas encore pris son kit ne rapporte rien — et ne lui fait rien perdre.
> **Ce n'est pas un suicide.** Le \`/suicide\`, les chutes et le vide ne comptent ni comme mort, ni comme kill.

Ces règles valent **dans les deux sens**. Un joueur désarmé ne peut pas devenir un distributeur de points, et couper son mode ranked ne permet pas de faire perdre les autres sans rien risquer.

L'action bar t'indique à chaque fois qu'un combat n'a pas compté, et pourquoi.`,
  },
  {
    titre: 'Le mode ranked',
    contenu: `Tu peux **désactiver ton Elo** pour jouer avec des amis sans risquer ton classement : tape \`/ranked\`, ou passe par ta fiche en jeu.

> **Le changement se fait au spawn uniquement.** Impossible de couper son Elo en plein combat quand le duel tourne mal — il faut mourir et revenir.
> **Pas de bascule en combat**, ni dans les 10 secondes qui suivent un coup donné ou reçu.
> **5 minutes minimum** entre deux changements.

Un combat n'est classé que si **les deux joueurs** sont en ranked. Désactiver le tien ne te protège pas seulement toi : il neutralise aussi le gain de ton adversaire.`,
  },
  {
    titre: 'Anti-farm',
    contenu: `Retuer la même personne rapporte de moins en moins : **moitié** au 2ᵉ kill, **un quart** au 3ᵉ, puis **plus rien** pendant deux heures.

Le coefficient s'applique aussi **à la perte**. Se faire tuer en boucle par un ami ne vide pas ton Elo, mais ne remplit pas le sien non plus.

> S'arranger pour monter au classement ne fonctionne pas, et n'a jamais fonctionné.`,
  },
  {
    titre: 'Arrangements et boost de classement',
    contenu: `Sont **interdits**, et entraînent une **disqualification de la saison** :

> **Les combats arrangés** — se donner des kills à tour de rôle, se laisser tuer volontairement.
> **Le double compte**, quel qu'en soit l'usage : se donner des points, gonfler ses combats, occuper deux places du top 5.
> **Le partage de compte.** Le classement récompense un joueur, pas un pseudo.
> **Le refus délibéré de combattre** pour protéger une place, en fin de saison.

Le serveur enregistre **chaque combat** : les deux kits, l'Elo échangé, l'heure et les points de vie restants. Un schéma anormal se voit dans les données, même si personne ne le signale.`,
  },
  {
    titre: 'Triche — tolérance zéro',
    contenu: `Tout client ou module donnant un avantage en combat est **interdit** : **killaura**, **reach**, **autoclicker**, **anti-knockback**, **velocity**, **aimbot**, **backtrack**, **autosoup**, **x-ray**, et assimilés.

> **Autorisés :** Optifine, les clients PvP (Lunar, Badlion, CheatBreaker…) sans modules interdits, les packs de textures.

> **Sanction :** bannissement définitif, sans avertissement. **L'Elo est annulé et le cashprize perdu**, y compris si la triche est découverte après la fin de la saison.

Un joueur exclu pour triche est retiré du classement, et **les places suivantes remontent**.`,
  },
  {
    titre: 'Bugs et exploits',
    contenu: `Tu trouves un bug ? **Signale-le sur le [Discord]({discord})** — les signalements utiles sont récompensés.

L'exploiter à ton avantage, c'est la **sanction assurée**. Utiliser un bug pour gagner de l'Elo entraîne l'**annulation des gains concernés** et, selon l'ampleur, la disqualification.`,
  },
  {
    titre: 'Le versement du cashprize',
    contenu: `Les gagnants sont contactés **sur Discord**, sur le compte lié à leur pseudo — c'est la raison pour laquelle la liaison est obligatoire.

> **Délai de réclamation : 30 jours** après la fin de la saison. Passé ce délai, le lot est perdu.
> **Mineurs :** l'accord d'un représentant légal est demandé avant tout versement.
> Le moyen de paiement est convenu avec le gagnant (PayPal ou carte cadeau).

Le lot est **personnel et incessible**. Il ne peut pas être versé à un tiers, ni échangé contre des avantages en jeu.

En cas de disqualification d'un gagnant, **son lot revient au joueur suivant** au classement.`,
  },
  {
    titre: 'Un seul joueur, un seul compte',
    contenu: `Contourner un bannissement avec un autre compte transforme un ban temporaire en **ban définitif**.

Un seul compte par personne participe au classement. Si plusieurs comptes sont rattachés à un même joueur, **tous** sont retirés du classement de la saison.`,
  },
  {
    titre: 'Respect',
    contenu: `Le trashtalk fait partie du PvP, les attaques personnelles non. Sont sanctionnés : **insultes ciblées et répétées**, **racisme**, **homophobie**, **harcèlement**, **menaces** — en jeu comme sur le Discord.

Pseudos et skins offensants **interdits**.

Une sanction pour comportement **en cours à la clôture** rend inéligible au cashprize.`,
  },
  {
    titre: 'Chat',
    contenu: `Pas de **publicité** pour d'autres serveurs, pas de **spam**, pas de **flood**.

Le chat est en français ou en anglais.`,
  },
  {
    titre: 'Le staff et les litiges',
    contenu: `Les décisions du staff s'appliquent **immédiatement**.

Tu contestes une sanction, ou un résultat de classement ? **Ouvre un ticket sur le [Discord]({discord})** — pas de débat dans le chat du serveur.

Toute contestation liée à la saison doit être déposée **avant la fin des 30 jours** de réclamation. Le staff tranche à partir de l'historique des combats enregistré par le serveur, qui fait foi.`,
  },
  {
    titre: 'Évolution du règlement',
    contenu: `Le règlement peut évoluer entre deux saisons. Toute modification est annoncée sur le **[Discord]({discord})** avant d'entrer en vigueur.

Les règles applicables à une saison sont celles publiées **au moment de son ouverture** : une modification en cours de saison ne s'applique jamais rétroactivement au classement en cours.

En participant au classement, tu acceptes ce règlement.`,
  },
]

const existantes = await prisma.sectionReglement.count()
await prisma.sectionReglement.deleteMany({})

for (const [index, section] of SECTIONS.entries()) {
  await prisma.sectionReglement.create({
    data: { ...section, ordre: index, publie: true },
  })
}

console.log(`${existantes} ancienne(s) section(s) remplacée(s) par ${SECTIONS.length} nouvelles.`)
await prisma.$disconnect()
