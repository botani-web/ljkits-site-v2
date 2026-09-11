import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * LE RÈGLEMENT, RANGÉ EN ONGLETS ET RENFORCÉ.        (2026-09-10)
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  CE QUE CETTE VERSION AJOUTE, ET POURQUOI
 * ═══════════════════════════════════════════════════════════════════════
 *
 * L'ancien règlement disait ce qui était interdit. Il ne disait pas ce qui
 * se passe QUAND ON A UN DOUTE — et c'est précisément la situation qui
 * arrive avec de l'argent à la clé : le premier du classement joue vite,
 * bien, souvent, et personne n'a de preuve formelle.
 *
 * Trois sections nouvelles répondent à ça :
 *
 *   « L'exclusion du classement »  — la sanction qui existe maintenant en
 *      jeu (/rankedban) : on écarte de la compétition sans bannir du
 *      serveur. C'est la sanction proportionnée qui manquait.
 *
 *   « Le doute, et comment il est tranché » — le niveau de preuve exigé,
 *      qui décide, ce qui est écrit au joueur, et comment il conteste.
 *      C'EST LA SECTION QUI PROTÈGE LE SERVEUR : le jour où le premier est
 *      écarté, la règle qu'on lui applique aura été publiée avant qu'il
 *      commence à jouer, et elle dit noir sur blanc qu'un faisceau
 *      d'indices suffit pour l'écarter du prix — pas pour le bannir.
 *
 *   « Ce qui peut te priver du cashprize » — le récapitulatif. Personne ne
 *      lit dix-sept sections ; tout le monde lit une liste.
 *
 * L'anti-farm est réécrit avec les trois plafonds réellement en place, et
 * la section « Bugs » dit désormais que l'usage d'un bug écarte du prix.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  UNE SEULE SOURCE POUR LES DEUX LANGUES
 * ═══════════════════════════════════════════════════════════════════════
 *
 * FR et EN sont écrits côte à côte ici. C'est ce qui empêche la dérive
 * habituelle : une règle renforcée d'un côté et pas de l'autre, sur un
 * site où l'anglais est la langue par défaut.
 *
 * `{discord}` est remplacé par le lien Discord à l'affichage.
 */

const SECTIONS = [
  /* ═══════════════════════════ RANKED ═══════════════════════════ */
  {
    categorie: 'ranked',
    titre: 'La compétition',
    titreEn: 'The competition',
    contenu: `À chaque saison, **150 € sont répartis entre les 5 premiers** du classement Elo.

Tout le monde démarre à **1000 Elo**. Battre un joueur mieux classé rapporte beaucoup, battre un joueur moins bien classé rapporte peu — et l'inverse pour les défaites. Ce que tu gagnes, ton adversaire le perd : le total ne bouge jamais.

> **Répartition :** 1ᵉʳ **60 €** · 2ᵉ **35 €** · 3ᵉ **25 €** · 4ᵉ **20 €** · 5ᵉ **10 €**

Une saison dure **un mois**. La **saison 1** s'ouvre le **vendredi 11 septembre 2026 à 18h00** et se clôture le **dimanche 11 octobre 2026 à 18h00** (heure de Paris). Chaque saison suivante s'ouvre à la clôture de la précédente, le 11 du mois à 18h00.

Le classement est figé à l'instant précis de la clôture, puis tout le monde repart à 1000 Elo.

Les kits, les cosmétiques et les coins **ne sont jamais remis à zéro**. Seul l'Elo l'est.`,
    contenuEn: `Every season, **150 € are shared between the top 5** of the Elo leaderboard.

Everyone starts at **1000 Elo**. Beating a higher-ranked player earns a lot, beating a lower-ranked one earns little — and the reverse for defeats. What you gain, your opponent loses: the total never moves.

> **Split:** 1st **60 €** · 2nd **35 €** · 3rd **25 €** · 4th **20 €** · 5th **10 €**

A season lasts **one month**. **Season 1** opens on **Friday 11 September 2026 at 6:00 PM** and closes on **Sunday 11 October 2026 at 6:00 PM** (Paris time). Each following season opens when the previous one closes, on the 11th of the month at 6:00 PM.

The leaderboard is frozen at the exact closing moment, then everyone restarts at 1000 Elo.

Kits, cosmetics and coins are **never reset**. Only Elo is.`,
  },
  {
    categorie: 'ranked',
    titre: 'Être éligible au cashprize',
    titreEn: 'Being eligible for the cashprize',
    contenu: `Trois conditions, toutes obligatoires :

> **1.** Avoir disputé au moins **100 combats classés** dans la saison.
> **2.** Avoir **lié son compte Discord** — tape \`/discord\` en jeu. Sans liaison, tu joues et tu progresses normalement, mais tu **n'apparais pas au classement**.
> **3.** N'avoir **aucune sanction en cours** au moment de la clôture, et ne pas être **exclu du classement**.

Les 100 combats écartent le compte créé la veille de la fin de saison. Ils se comptent en **combats classés**, pas en kills : une mort compte autant qu'un kill.

En cas d'**égalité parfaite d'Elo**, c'est le joueur ayant le **plus de combats** qui passe devant. Si l'égalité persiste, celui qui a atteint cet Elo **en premier**.`,
    contenuEn: `Three conditions, all required:

> **1.** Have fought at least **100 ranked fights** during the season.
> **2.** Have **linked your Discord account** — type \`/discord\` in game. Without it you play and progress normally, but you **do not appear on the leaderboard**.
> **3.** Have **no active sanction** when the season closes, and not be **excluded from the leaderboard**.

The 100 fights rule out an account created the day before the season ends. They are counted in **ranked fights**, not kills: a death counts as much as a kill.

In case of a **perfect Elo tie**, the player with the **most fights** comes first. If the tie remains, whoever reached that Elo **first**.`,
  },
  {
    categorie: 'ranked',
    titre: 'Ce qui compte comme combat classé',
    titreEn: 'What counts as a ranked fight',
    contenu: `Un combat ne fait bouger l'Elo que si **toutes** ces conditions sont réunies :

> **La saison est ouverte.** Aucun combat livré avant l'ouverture officielle ne compte.
> **Les deux joueurs sont en mode ranked.** Si l'un des deux l'a coupé, le combat ne compte pour personne.
> **Les deux joueurs ont un kit actif.** Tuer quelqu'un qui n'a pas encore pris son kit ne rapporte rien — et ne lui fait rien perdre.
> **Aucun des deux n'est exclu du classement.** Un combat qui implique un joueur écarté est neutre des deux côtés.
> **Ce n'est pas un duel.** Le \`/duel\` est un 1v1 consenti : on s'y entraîne sans rien risquer.
> **Ce n'est pas un suicide.** Le \`/suicide\`, les chutes et le vide ne comptent ni comme mort, ni comme kill.

Ces règles valent **dans les deux sens**. Un joueur désarmé ne peut pas devenir un distributeur de points, et couper son mode ranked ne permet pas de faire perdre les autres sans rien risquer.

L'action bar t'indique à chaque fois qu'un combat n'a pas compté, et pourquoi.`,
    contenuEn: `A fight only moves Elo if **all** of these conditions are met:

> **The season is open.** No fight played before the official opening counts.
> **Both players are in ranked mode.** If either has turned it off, the fight counts for nobody.
> **Both players have an active kit.** Killing someone who has not taken their kit yet earns nothing — and costs them nothing.
> **Neither is excluded from the leaderboard.** A fight involving an excluded player is neutral on both sides.
> **It is not a duel.** \`/duel\` is a consented 1v1: you train there without risking anything.
> **It is not a suicide.** \`/suicide\`, falls and the void count neither as a death nor as a kill.

These rules apply **both ways**. An unarmed player cannot become a point dispenser, and turning off your ranked mode does not let you make others lose without risking anything.

The action bar tells you every time a fight did not count, and why.`,
  },
  {
    categorie: 'ranked',
    titre: 'Le mode ranked',
    titreEn: 'Ranked mode',
    contenu: `Tu peux **désactiver ton Elo** pour jouer avec des amis sans risquer ton classement : tape \`/ranked\`, ou passe par ta fiche en jeu.

> **Le changement se fait au spawn uniquement.** Impossible de couper son Elo en plein combat quand le duel tourne mal — il faut mourir et revenir.
> **Pas de bascule en combat**, ni dans les 10 secondes qui suivent un coup donné ou reçu.
> **5 minutes minimum** entre deux changements.

Un combat n'est classé que si **les deux joueurs** sont en ranked. Désactiver le tien ne te protège pas seulement toi : il neutralise aussi le gain de ton adversaire.`,
    contenuEn: `You can **turn your Elo off** to play with friends without risking your rank: type \`/ranked\`, or use your in-game profile.

> **The change is only possible at spawn.** You cannot cut your Elo mid-fight when a duel goes badly — you have to die and come back.
> **No switching in combat**, nor within the 10 seconds following a hit given or taken.
> **5 minutes minimum** between two changes.

A fight is only ranked if **both players** are ranked. Turning yours off does not only protect you: it also cancels your opponent's gain.`,
  },

  /* ═══════════════════════════ CASHPRIZE ═══════════════════════════ */
  {
    categorie: 'cashprize',
    titre: 'Le versement du cashprize',
    titreEn: 'Paying out the cashprize',
    contenu: `Les gagnants sont contactés **sur Discord**, sur le compte lié à leur pseudo — c'est la raison pour laquelle la liaison est obligatoire.

> **Délai de réclamation : 30 jours** après la fin de la saison. Passé ce délai, le lot est perdu.
> **Mineurs :** l'accord d'un représentant légal est demandé avant tout versement.
> Le moyen de paiement est convenu avec le gagnant (PayPal ou carte cadeau).

Le lot est **personnel et incessible**. Il ne peut pas être versé à un tiers, ni échangé contre des avantages en jeu.

En cas de disqualification d'un gagnant, **son lot revient au joueur suivant** au classement.`,
    contenuEn: `Winners are contacted **on Discord**, on the account linked to their username — that is why linking is mandatory.

> **Claim window: 30 days** after the season ends. After that, the prize is forfeited.
> **Minors:** a legal guardian's consent is required before any payment.
> The payment method is agreed with the winner (PayPal or gift card).

The prize is **personal and non-transferable**. It cannot be paid to a third party, nor exchanged for in-game advantages.

If a winner is disqualified, **their prize goes to the next player** on the leaderboard.`,
  },
  {
    categorie: 'cashprize',
    titre: 'Ce qui peut te priver du cashprize',
    titreEn: 'What can cost you the cashprize',
    contenu: `Le récapitulatif, en une page. Chacun de ces points est détaillé dans les autres onglets.

> **La triche**, sous toutes ses formes. Bannissement définitif, Elo annulé, prix perdu — y compris si c'est découvert **après** la fin de la saison.
> **Le farm d'Elo** : combats arrangés, kills donnés à tour de rôle, comptes complices.
> **L'usage d'un bug** pour progresser, quelle que soit son ampleur.
> **Le multi-compte** ou le partage de compte.
> **Un faisceau d'indices sérieux de triche**, même sans preuve formelle — voir *Le doute, et comment il est tranché*.
> **Une sanction en cours** au moment de la clôture de la saison.
> **Moins de 100 combats classés**, ou un compte Discord non lié.
> **Une réclamation déposée plus de 30 jours** après la fin de la saison.

Deux sanctions différentes existent, et elles ne se confondent pas :

> **L'exclusion du classement** te sort de la compétition. Tu continues de jouer normalement.
> **Le bannissement** te sort du serveur.

Un joueur exclu ou banni **disparaît du classement**, en jeu comme sur ce site, et les places suivantes remontent.`,
    contenuEn: `The summary, on one page. Each point is detailed in the other tabs.

> **Cheating**, in any form. Permanent ban, Elo voided, prize forfeited — including if it is discovered **after** the season ends.
> **Elo farming**: arranged fights, kills traded in turn, accomplice accounts.
> **Using a bug** to progress, however small.
> **Multi-accounting** or account sharing.
> **A serious body of evidence pointing to cheating**, even without formal proof — see *Doubt, and how it is settled*.
> **An active sanction** when the season closes.
> **Fewer than 100 ranked fights**, or an unlinked Discord account.
> **A claim filed more than 30 days** after the season ends.

Two different sanctions exist, and they are not the same:

> **Exclusion from the leaderboard** takes you out of the competition. You keep playing normally.
> **A ban** takes you off the server.

An excluded or banned player **disappears from the leaderboard**, in game and on this site, and the players below move up.`,
  },

  /* ═══════════════════════════ INTÉGRITÉ ═══════════════════════════ */
  {
    categorie: 'integrite',
    titre: 'Anti-farm : trois plafonds',
    titreEn: 'Anti-farm: three caps',
    contenu: `Le serveur limite automatiquement ce qu'un enchaînement de kills peut rapporter. Ces plafonds ne sont pas des sanctions : ils s'appliquent tout seuls, sans intervention du staff.

> **1. Retuer la même personne rapporte de moins en moins.** Moitié au 2ᵉ kill, un quart au 3ᵉ, un dixième au 4ᵉ. **Au-delà du 5ᵉ kill sur la même personne en deux heures, le combat ne rapporte plus rien** — et ne fait rien perdre non plus.
> **2. Il faut varier d'adversaires.** Au-delà de **10 combats classés dans l'heure**, il faut en avoir affronté au moins **3 différents**. Sinon, les combats cessent de rapporter jusqu'à ce que tu varies.
> **3. Un plafond horaire absolu** de 40 combats classés, pour couvrir ce que les deux premières règles laisseraient passer.

Chaque plafond s'applique **au gain comme à la perte** : se faire tuer en boucle par un ami ne vide pas ton Elo, mais ne remplit pas le sien non plus.

La règle de diversité vise le farm entre deux ou trois comptes complices. **Un joueur qui affronte des adversaires variés ne la croise jamais** : dix combats en une heure contre moins de trois personnes différentes, ce n'est plus une soirée de PvP.

Quand un combat ne rapporte rien à cause d'un plafond, l'action bar te le dit et t'indique lequel.`,
    contenuEn: `The server automatically caps what a streak of kills can earn. These caps are not sanctions: they apply on their own, with no staff involved.

> **1. Killing the same person again earns less and less.** Half on the 2nd kill, a quarter on the 3rd, a tenth on the 4th. **Beyond the 5th kill on the same person within two hours, the fight earns nothing at all** — and costs nothing either.
> **2. You have to vary opponents.** Beyond **10 ranked fights in an hour**, you must have faced at least **3 different** people. Otherwise fights stop earning until you mix it up.
> **3. An absolute hourly cap** of 40 ranked fights, covering what the first two rules would let through.

Every cap applies **to gains and to losses alike**: being killed on repeat by a friend does not drain your Elo, but it does not fill theirs either.

The diversity rule targets farming between two or three accomplice accounts. **A player facing varied opponents never runs into it**: ten fights in an hour against fewer than three different people is no longer a PvP session.

When a fight earns nothing because of a cap, the action bar tells you which one.`,
  },
  {
    categorie: 'integrite',
    titre: 'Arrangements et boost de classement',
    titreEn: 'Arranged fights and rank boosting',
    contenu: `Sont **interdits**, et entraînent l'**exclusion du classement de la saison** :

> **Les combats arrangés** — se donner des kills à tour de rôle, se laisser tuer volontairement.
> **Le double compte**, quel qu'en soit l'usage : se donner des points, gonfler ses combats, occuper deux places du top 5.
> **Le partage de compte.** Le classement récompense un joueur, pas un pseudo.
> **Le boost par un tiers** : faire monter le classement de quelqu'un d'autre, contre paiement ou non.
> **Le refus délibéré de combattre** pour protéger une place, en fin de saison.

Le serveur enregistre **chaque combat** : les deux kits, l'Elo échangé, l'heure, les points de vie restants et le coefficient anti-farm appliqué. Un schéma anormal se voit dans les données, même si personne ne le signale — et il se voit **après coup**, y compris des semaines plus tard.`,
    contenuEn: `The following are **forbidden**, and lead to **exclusion from the season leaderboard**:

> **Arranged fights** — trading kills in turn, letting someone kill you on purpose.
> **Alt accounts**, whatever the use: feeding yourself points, padding your fight count, taking two spots in the top 5.
> **Account sharing.** The leaderboard rewards a player, not a username.
> **Boosting by a third party**: raising someone else's rank, paid or not.
> **Deliberately refusing to fight** to protect a position at the end of a season.

The server records **every fight**: both kits, the Elo exchanged, the time, the health left and the anti-farm coefficient applied. An abnormal pattern shows in the data even if nobody reports it — and it shows **afterwards**, including weeks later.`,
  },
  {
    categorie: 'integrite',
    titre: 'Bugs et exploits',
    titreEn: 'Bugs and exploits',
    contenu: `Tu trouves un bug ? **Signale-le sur le [Discord]({discord})** — les signalements utiles sont récompensés.

L'exploiter est sanctionné, **que le bug ait été signalé ou non**, et que l'avantage obtenu soit grand ou petit :

> **Utiliser un bug pour gagner de l'Elo** entraîne l'**annulation des gains concernés** et l'**exclusion du classement**.
> **Utiliser un bug pour obtenir des coins, des kits ou des items** entraîne le retrait de ce qui a été obtenu, et une sanction proportionnée.
> **Répéter l'exploitation après un avertissement** entraîne le bannissement.

« Je ne savais pas que c'était un bug » vaut pour un premier usage isolé. Ça ne vaut pas pour une exploitation répétée : à partir du moment où l'on refait volontairement quelque chose qui ne devrait pas marcher, on le sait.`,
    contenuEn: `Found a bug? **Report it on [Discord]({discord})** — useful reports are rewarded.

Exploiting one is sanctioned, **whether or not it was reported**, and whether the advantage gained is large or small:

> **Using a bug to gain Elo** leads to the **cancellation of the gains concerned** and **exclusion from the leaderboard**.
> **Using a bug to obtain coins, kits or items** leads to the removal of what was obtained, and a proportionate sanction.
> **Repeating the exploit after a warning** leads to a ban.

"I did not know it was a bug" holds for a single isolated use. It does not hold for repeated exploitation: from the moment you deliberately do again something that should not work, you know.`,
  },
  {
    categorie: 'integrite',
    titre: 'Un seul joueur, un seul compte',
    titreEn: 'One player, one account',
    contenu: `Un seul compte par personne participe au classement. Si plusieurs comptes sont rattachés à un même joueur, **tous** sont retirés du classement de la saison.

Contourner un bannissement avec un autre compte transforme un ban temporaire en **ban définitif**.

Jouer sur le compte de quelqu'un d'autre, ou lui prêter le sien, engage **les deux joueurs**.`,
    contenuEn: `One account per person takes part in the leaderboard. If several accounts are tied to the same player, **all of them** are removed from the season leaderboard.

Evading a ban with another account turns a temporary ban into a **permanent** one.

Playing on someone else's account, or lending them yours, commits **both players**.`,
  },

  /* ═══════════════════════════ SANCTIONS ═══════════════════════════ */
  {
    categorie: 'sanctions',
    titre: 'Triche — tolérance zéro',
    titreEn: 'Cheating — zero tolerance',
    contenu: `Tout client ou module donnant un avantage en combat est **interdit** : **killaura**, **reach**, **autoclicker**, **anti-knockback**, **velocity**, **aimbot**, **backtrack**, **autosoup**, **fly**, **speed**, **nofall**, **x-ray**, et assimilés.

> **Autorisés :** Optifine, les clients PvP (Lunar, Badlion, CheatBreaker…) sans modules interdits, les packs de textures.

> **Sanction :** bannissement définitif, sans avertissement. **L'Elo est annulé et le cashprize perdu**, y compris si la triche est découverte après la fin de la saison.

Un joueur exclu pour triche est retiré du classement, et **les places suivantes remontent**.

Le serveur enregistre en continu les mesures de combat — cadence de clic, portée, régularité, altitude — et conserve ces relevés. Ils peuvent être réexaminés **des semaines après** les faits.`,
    contenuEn: `Any client or module giving a combat advantage is **forbidden**: **killaura**, **reach**, **autoclicker**, **anti-knockback**, **velocity**, **aimbot**, **backtrack**, **autosoup**, **fly**, **speed**, **nofall**, **x-ray**, and the like.

> **Allowed:** Optifine, PvP clients (Lunar, Badlion, CheatBreaker…) without forbidden modules, texture packs.

> **Sanction:** permanent ban, without warning. **Elo is voided and the cashprize forfeited**, including if the cheating is discovered after the season ends.

A player removed for cheating is taken off the leaderboard, and **the players below move up**.

The server continuously records combat measurements — click rate, reach, regularity, altitude — and keeps them. They can be re-examined **weeks after** the fact.`,
  },
  {
    categorie: 'sanctions',
    titre: 'L’exclusion du classement',
    titreEn: 'Exclusion from the leaderboard',
    contenu: `C'est une sanction **distincte du bannissement**, créée pour ne pas avoir à choisir entre « on ne fait rien » et « on bannit ».

**Un joueur exclu du classement continue de jouer normalement** : ses kits, sa boutique, son clan, ses duels, ses coins, tout est intact. Il ne concourt simplement plus pour le cashprize.

Concrètement :

> Il **disparaît du classement**, en jeu comme sur ce site, et les places suivantes remontent.
> À côté de son pseudo, le tab affiche **un tiret** au lieu d'un Elo.
> **Ses combats ne font plus bouger l'Elo de personne** — ni le sien, ni celui de son adversaire. Il ne peut donc ni distribuer des points à ses amis, ni faire chuter les autres par représailles.

**Elle peut être prononcée pour :** triche avérée ou fortement soupçonnée, usage d'un bug, farm d'Elo, combats arrangés, multi-compte, ou tout comportement qui fausse la mesure du classement.

**Elle est définitive pour la saison en cours.** Il n'y a pas de durée : une exclusion levée à trois jours de la fin ne voudrait rien dire. Elle est **réexaminée pour la saison suivante** si le joueur le demande.

> **Pour contester : ouvre un ticket sur le [Discord]({discord}).** Le motif de ton exclusion t'est affiché en jeu (\`/ranked\`, et sur l'item de ta fiche au spawn) : indique-le dans ton ticket.

Un joueur **banni du serveur** est également retiré du classement pendant toute la durée de sa sanction, et y revient automatiquement à la levée du bannissement.`,
    contenuEn: `This is a sanction **separate from a ban**, created so that we do not have to choose between "do nothing" and "ban".

**A player excluded from the leaderboard keeps playing normally**: kits, shop, clan, duels, coins — everything is untouched. They simply no longer compete for the cashprize.

In practice:

> They **disappear from the leaderboard**, in game and on this site, and the players below move up.
> Next to their name, the tab shows **a dash** instead of an Elo.
> **Their fights no longer move anyone's Elo** — neither theirs nor their opponent's. So they can neither feed points to friends nor drag others down out of spite.

**It can be issued for:** proven or strongly suspected cheating, bug abuse, Elo farming, arranged fights, multi-accounting, or any behaviour that distorts what the leaderboard measures.

**It is final for the ongoing season.** There is no duration: an exclusion lifted three days before the end would mean nothing. It is **reviewed for the next season** if the player asks.

> **To appeal: open a ticket on [Discord]({discord}).** The reason for your exclusion is shown to you in game (\`/ranked\`, and on your profile item at spawn): quote it in your ticket.

A player **banned from the server** is also removed from the leaderboard for the whole duration of the sanction, and returns automatically when the ban is lifted.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Le doute, et comment il est tranché',
    titreEn: 'Doubt, and how it is settled',
    contenu: `Il y a de l'argent en jeu. Cette section dit **à l'avance** ce qui se passe quand le staff a un doute, pour que personne ne le découvre le jour où ça le concerne.

**Deux niveaux de preuve, pour deux sanctions différentes.**

> **Pour bannir**, il faut une **certitude** : un relevé sans ambiguïté, un aveu, un enregistrement, ou une mesure qu'aucun jeu honnête ne produit. Le doute profite au joueur.
> **Pour exclure du classement**, un **faisceau d'indices sérieux et concordants** suffit. Le joueur garde son accès au serveur, ses kits et sa progression : la sanction est réversible dans ses effets, elle ne lui retire que la course au prix.

Cette différence est volontaire. Distribuer de l'argent sur un classement qu'on soupçonne d'être faussé serait injuste envers tous les autres participants — et exiger la même certitude que pour un ban reviendrait à ne jamais pouvoir écarter personne.

**Ce sur quoi le staff s'appuie :** l'historique complet des combats enregistré par le serveur, les relevés de cadence de clic et de portée, les mesures de déplacement, les signalements, les enregistrements vidéo, et les contrôles en direct.

**Ce qui n'est jamais un motif à lui seul :** être très fort, jouer beaucoup, avoir un bon ratio, utiliser un client PvP autorisé, ou être signalé par des joueurs mécontents.

**Ce à quoi tu as droit :**

> Le **motif écrit** de ta sanction, affiché en jeu et lisible à tout moment.
> Un **ticket Discord** pour la contester, lu par un membre du staff qui n'a pas pris la décision quand c'est possible.
> Le droit de **demander le réexamen** pour la saison suivante.

**Ce que le staff s'engage à faire :** motiver chaque exclusion, la journaliser, et ne jamais l'utiliser pour autre chose que l'intégrité de la compétition — ni pour un désaccord, ni pour une antipathie, ni pour un litige de chat, qui relèvent des sanctions ordinaires.

Toute contestation liée à une saison doit être déposée **avant la fin des 30 jours** de réclamation. Passé ce délai, le classement de la saison est définitivement clos.`,
    contenuEn: `There is money at stake. This section says **in advance** what happens when the staff has a doubt, so that nobody discovers it on the day it concerns them.

**Two standards of proof, for two different sanctions.**

> **To ban**, we need **certainty**: an unambiguous record, an admission, a recording, or a measurement no honest play produces. Doubt benefits the player.
> **To exclude from the leaderboard**, a **serious and consistent body of evidence** is enough. The player keeps their access, their kits and their progress: the sanction only removes them from the race for the prize.

This difference is deliberate. Handing out money on a leaderboard we suspect is distorted would be unfair to every other participant — and demanding the same certainty as for a ban would mean never being able to set anyone aside.

**What the staff relies on:** the full fight history recorded by the server, click-rate and reach measurements, movement records, reports, video recordings, and live checks.

**What is never a reason on its own:** being very good, playing a lot, having a strong ratio, using an allowed PvP client, or being reported by unhappy players.

**What you are entitled to:**

> The **written reason** for your sanction, shown in game and readable at any time.
> A **Discord ticket** to appeal, read where possible by a staff member who did not make the decision.
> The right to **ask for a review** for the following season.

**What the staff commits to:** giving a reason for every exclusion, logging it, and never using it for anything other than the integrity of the competition — not for a disagreement, not for a dislike, not for a chat dispute, which fall under ordinary sanctions.

Any appeal relating to a season must be filed **before the end of the 30-day** claim window. After that, the season leaderboard is closed for good.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Le staff et les litiges',
    titreEn: 'Staff and disputes',
    contenu: `Les décisions du staff s'appliquent **immédiatement**.

Tu contestes une sanction, ou un résultat de classement ? **Ouvre un ticket sur le [Discord]({discord})** — pas de débat dans le chat du serveur, et pas de harcèlement en message privé : les deux aggravent la situation au lieu de la régler.

Le staff tranche à partir de l'historique des combats enregistré par le serveur, qui fait foi.

Se faire passer pour un membre du staff, ou prétendre parler en son nom, est sanctionné.`,
    contenuEn: `Staff decisions apply **immediately**.

Contesting a sanction, or a leaderboard result? **Open a ticket on [Discord]({discord})** — no debate in the server chat, and no harassment in DMs: both make things worse instead of resolving them.

The staff decides from the fight history recorded by the server, which is authoritative.

Impersonating a staff member, or claiming to speak on their behalf, is sanctioned.`,
  },

  /* ═══════════════════════════ UTILISATION ═══════════════════════════ */
  {
    categorie: 'serveur',
    titre: 'Respect',
    titreEn: 'Respect',
    contenu: `Le trashtalk fait partie du PvP, les attaques personnelles non. Sont sanctionnés : **insultes ciblées et répétées**, **racisme**, **homophobie**, **harcèlement**, **menaces** — en jeu comme sur le Discord.

Pseudos et skins offensants **interdits**.

Une sanction pour comportement **en cours à la clôture** rend inéligible au cashprize.`,
    contenuEn: `Trash talk is part of PvP, personal attacks are not. Sanctioned: **targeted and repeated insults**, **racism**, **homophobia**, **harassment**, **threats** — in game as on Discord.

Offensive usernames and skins are **forbidden**.

A behaviour sanction **active at closing time** makes you ineligible for the cashprize.`,
  },
  {
    categorie: 'serveur',
    titre: 'Chat',
    titreEn: 'Chat',
    contenu: `Pas de **publicité** pour d'autres serveurs, pas de **spam**, pas de **flood**.

Le chat est en français ou en anglais.`,
    contenuEn: `No **advertising** for other servers, no **spam**, no **flooding**.

Chat is in French or English.`,
  },
  {
    categorie: 'serveur',
    titre: 'Évolution du règlement',
    titreEn: 'Changes to these rules',
    contenu: `Le règlement peut évoluer entre deux saisons. Toute modification est annoncée sur le **[Discord]({discord})** avant d'entrer en vigueur.

Les règles applicables à une saison sont celles publiées **au moment de son ouverture** : une modification en cours de saison ne s'applique jamais rétroactivement au classement en cours.

En participant au classement, tu acceptes ce règlement.`,
    contenuEn: `These rules may change between seasons. Any change is announced on **[Discord]({discord})** before it takes effect.

The rules that apply to a season are those published **when it opened**: a mid-season change never applies retroactively to the ongoing leaderboard.

By taking part in the leaderboard, you accept these rules.`,
  },
]

/*
  L'ORDRE RESTE GLOBAL, ET C'EST VOULU.

  On pourrait repartir de zéro à chaque onglet : la page publique numérote
  de toute façon les sections À L'INTÉRIEUR de l'onglet ouvert, par leur
  position dans la liste filtrée, pas par leur `ordre`. Les deux marchent.

  Le global gagne pour deux raisons :

    - les flèches « monter / descendre » de l'admin déplacent une section
      dans l'ordre GLOBAL. Avec cinq séries qui repartent à zéro, deux
      sections de catégories différentes porteraient le même numéro et le
      tri deviendrait imprévisible ;
    - tant que la nouvelle page n'est pas déployée, l'ancienne affiche une
      liste à plat triée par `ordre` : un ordre global la garde lisible.

  Les catégories sont donc simplement écrites en bloc dans ce fichier, et
  l'ordre suit.
*/
const compteurs = new Map()
const donnees = SECTIONS.map((section, index) => {
  compteurs.set(section.categorie, (compteurs.get(section.categorie) ?? 0) + 1)
  return { ...section, ordre: index, publie: true }
})

const existantes = await prisma.sectionReglement.count()
await prisma.sectionReglement.deleteMany({})

for (const section of donnees) {
  await prisma.sectionReglement.create({ data: section })
}

console.log(`${existantes} ancienne(s) section(s) remplacée(s) par ${donnees.length} nouvelles.`)
for (const [categorie, nombre] of compteurs) {
  console.log(`  ${categorie.padEnd(12)} ${nombre} section(s)`)
}
await prisma.$disconnect()
