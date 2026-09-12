import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * LE RÈGLEMENT DU PRACTICE RANKED 1v1.                 (2026-09-12)
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  CE QUI A CHANGÉ PAR RAPPORT À LA VERSION DU 10/09
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Le serveur est passé du FFA classé au Practice Ranked 1v1 : deux files
 * (HG et Digger), un Elo par mode et un Elo global (moyenne des modes). Le
 * cashprize va au TOP 3 DE L'ELO GLOBAL : 75 / 50 / 25 €. La saison 1
 * repart à la réouverture, le samedi 12/09/2026 à 14h30.
 *
 * Tout ce qui décrivait le FFA classé a disparu (mode ranked à bascule,
 * combat classé = kill avec kit, 100 combats minimum). Chaque chiffre de
 * ce fichier vient de la configuration EN SERVICE (LJElo, LJPractice) :
 * s'il change en jeu, il doit changer ici.
 *
 *   Elo          départ 1000, ±30 max par match, plancher 800
 *   Files        ±100 Elo, +50 toutes les 10 s, libre après 45 s,
 *                pas de revanche immédiate pendant 2 min
 *   Qualif.      5 victoires Unranked + compte Discord lié
 *   Matchs       décompte 3 s, 10 min max, au temps : le plus de vie gagne
 *   Anti-farm    par adversaire (2 h / 5, ou 20 min / 10 sous 20 liés),
 *                diversité 10 → 3, plafond horaire 40
 *
 * Les sanctions (exclusion, doute, triche) sont reprises telles quelles :
 * ce sont elles qui protègent le serveur le jour où le premier est écarté.
 *
 * FR et EN sont écrits côte à côte : une règle renforcée d'un côté l'est
 * forcément de l'autre. `{discord}` est remplacé par le lien à l'affichage.
 */

const SECTIONS = [
  /* ═══════════════════════════ RANKED 1v1 ═══════════════════════════ */
  {
    categorie: 'ranked',
    titre: 'Le Practice Ranked 1v1',
    titreEn: '1v1 Ranked Practice',
    contenu: `LJKITS est un serveur **Practice 1v1** en soupe PvP. Deux files classées : **HG** et **Digger**.

> **1.** Au spawn, prends l'**épée en diamant** (Ranked) ou l'**épée en fer** (Unranked) — ou tape \`/ranked\` / \`/unranked\`.
> **2.** Choisis ton mode : tu entres dans la file.
> **3.** En attendant, joue au **FFA** librement. Dès qu'un adversaire est trouvé, tu es **téléporté dans l'arène**, où que tu sois.
> **4.** Un décompte de **3 secondes**, puis le combat. Le premier qui tombe a perdu.

À la fin du match, un résumé s'affiche dans le chat : clique dessus pour voir **l'inventaire des deux joueurs** — soupes restantes, vie, coups donnés. Tu retournes ensuite au spawn.

**Ton adversaire est choisi selon ton Elo.** La file cherche d'abord à **±100 Elo**, élargit de 50 toutes les 10 secondes, puis accepte **n'importe quel adversaire après 45 secondes**. Tu ne retombes pas sur ton dernier adversaire pendant **2 minutes**.

Tape \`/leave\` pour quitter la file à tout moment.`,
    contenuEn: `LJKITS is a **1v1 Practice** soup PvP server. Two ranked queues: **HG** and **Digger**.

> **1.** At spawn, grab the **diamond sword** (Ranked) or the **iron sword** (Unranked) — or type \`/ranked\` / \`/unranked\`.
> **2.** Pick your mode: you join the queue.
> **3.** Meanwhile, play **FFA** freely. As soon as an opponent is found, you are **teleported to the arena**, wherever you are.
> **4.** A **3-second** countdown, then the fight. The first one to fall loses.

At the end of the match, a summary shows up in chat: click it to see **both players' inventories** — soups left, health, hits landed. You then go back to spawn.

**Your opponent is picked by Elo.** The queue first looks within **±100 Elo**, widens by 50 every 10 seconds, then accepts **any opponent after 45 seconds**. You will not face your last opponent again for **2 minutes**.

Type \`/leave\` to leave the queue at any time.`,
  },
  {
    categorie: 'ranked',
    titre: 'Débloquer le ranked',
    titreEn: 'Unlocking ranked',
    contenu: `Deux conditions pour entrer en file **Ranked** :

> **1.** Avoir **lié ton compte Discord** — tape \`/discord\` en jeu et suis les étapes.
> **2.** Avoir gagné **5 matchs en Unranked**.

Les 5 victoires sont un échauffement : elles te laissent découvrir les modes sans rien risquer, et elles écartent les comptes créés à la chaîne pour farmer.

Ta progression s'affiche dans le menu \`/ranked\` et sur le tableau à droite de l'écran.`,
    contenuEn: `Two conditions to join the **Ranked** queue:

> **1.** Have **linked your Discord account** — type \`/discord\` in game and follow the steps.
> **2.** Have won **5 Unranked matches**.

The 5 wins are a warm-up: they let you discover the modes without risking anything, and they keep out accounts created in bulk to farm.

Your progress is shown in the \`/ranked\` menu and on the scoreboard on the right of your screen.`,
  },
  {
    categorie: 'ranked',
    titre: 'L’Elo',
    titreEn: 'Elo',
    contenu: `Deux niveaux d'Elo :

> **Un Elo par mode** (HG, Digger). C'est lui qui te trouve des adversaires de ton niveau.
> **Un Elo global** = la **moyenne de tes modes**. Un mode que tu n'as jamais joué compte pour **1000**. **C'est l'Elo global qui fait le classement du cashprize** : pour être en tête, il faut être bon partout.

**Le calcul :**

> Tout le monde démarre à **1000** dans chaque mode.
> Battre un joueur mieux classé rapporte beaucoup, battre un joueur moins bien classé rapporte peu — et l'inverse pour les défaites.
> Un match rapporte ou coûte **30 points au maximum**, même contre un joueur beaucoup plus fort.
> **Plancher : 800.** Ton Elo ne descend jamais en dessous.

**Les divisions :** Fer (moins de 850) · Bronze 850 · Argent 1000 · Or 1150 · Platine 1300 · Diamant 1450 · Maître 1600 · Légende 1800.

Ton Elo global est affiché à côté de ton pseudo sur le [Discord]({discord}). Tape \`/leaderboard\` en jeu pour le **top 100** global et par mode, avec le détail de chaque joueur.`,
    contenuEn: `Two levels of Elo:

> **One Elo per mode** (HG, Digger). It is what finds you opponents of your level.
> **A global Elo** = the **average of your modes**. A mode you have never played counts as **1000**. **The global Elo is what ranks the cashprize**: to be on top, you have to be good at everything.

**How it works:**

> Everyone starts at **1000** in each mode.
> Beating a higher-ranked player earns a lot, beating a lower-ranked one earns little — and the reverse for defeats.
> A match earns or costs **30 points at most**, even against a much stronger player.
> **Floor: 800.** Your Elo never goes below it.

**Divisions:** Iron (under 850) · Bronze 850 · Silver 1000 · Gold 1150 · Platinum 1300 · Diamond 1450 · Master 1600 · Legend 1800.

Your global Elo is shown next to your name on [Discord]({discord}). Type \`/leaderboard\` in game for the **top 100**, global and per mode, with every player's details.`,
  },
  {
    categorie: 'ranked',
    titre: 'Comment se termine un match classé',
    titreEn: 'How a ranked match ends',
    contenu: `Un match ranked se termine toujours par un vainqueur, sauf égalité parfaite :

> **Kill** : le dernier debout gagne.
> **Abandon** (\`/leave\`) ou **déconnexion** pendant le match : **défaite**. Quitter un match mal engagé coûte exactement autant que le perdre.
> **Digger** : sortir de l'arène **par le haut** = **défaite**.
> **Temps écoulé** (10 minutes) : le joueur qui a **le plus de vie** gagne. À vie égale, **match nul** : l'Elo ne bouge pas.
> Un match **arrêté par le staff** ne compte pas.

**Ne comptent jamais pour l'Elo :** l'Unranked, les \`/duel\`, le FFA, le Lava Challenge et l'entraînement du spawn. Mourir au FFA ne te coûte rien.

Pendant un match, seules \`/msg\`, \`/r\`, \`/leave\` et \`/matchinv\` sont utilisables.`,
    contenuEn: `A ranked match always ends with a winner, except in a perfect tie:

> **Kill**: the last one standing wins.
> **Forfeit** (\`/leave\`) or **disconnecting** during the match: **loss**. Leaving a match that is going badly costs exactly as much as losing it.
> **Digger**: leaving the arena **from the top** = **loss**.
> **Time's up** (10 minutes): the player with **the most health** wins. With equal health, **draw**: Elo does not move.
> A match **stopped by staff** does not count.

**Never counted for Elo:** Unranked, \`/duel\`, FFA, the Lava Challenge and the spawn training. Dying in FFA costs you nothing.

During a match, only \`/msg\`, \`/r\`, \`/leave\` and \`/matchinv\` can be used.`,
  },
  {
    categorie: 'ranked',
    titre: 'Unranked, duels et commandes',
    titreEn: 'Unranked, duels and commands',
    contenu: `> **Unranked** : les mêmes files et les mêmes arènes, **sans Elo**. Tes victoires débloquent le ranked.
> **\`/duel <pseudo>\`** : défie un joueur précis. Choisis le mode, puis la **map** (ou aléatoire). Il a **60 secondes** pour accepter. Un duel ne compte jamais pour l'Elo.

**Les commandes utiles :**

> \`/ranked\` · \`/unranked\` — ouvrir les files
> \`/duel <pseudo>\` — défier un joueur
> \`/leave\` — quitter la file, ou abandonner le match (défaite en ranked)
> \`/leaderboard\` — le top 100 global, HG et Digger
> \`/suicide\` — revenir au spawn depuis le FFA
> \`/discord\` — lier ton compte Discord
> \`/lang\` — passer le jeu en français ou en anglais`,
    contenuEn: `> **Unranked**: the same queues and the same arenas, **without Elo**. Your wins unlock ranked.
> **\`/duel <name>\`**: challenge a specific player. Pick the mode, then the **map** (or random). They have **60 seconds** to accept. A duel never counts for Elo.

**Useful commands:**

> \`/ranked\` · \`/unranked\` — open the queues
> \`/duel <name>\` — challenge a player
> \`/leave\` — leave the queue, or forfeit the match (a loss in ranked)
> \`/leaderboard\` — the top 100, global, HG and Digger
> \`/suicide\` — go back to spawn from FFA
> \`/discord\` — link your Discord account
> \`/lang\` — switch the game to French or English`,
  },

  /* ═══════════════════════════ MODES DE JEU ═══════════════════════════ */
  {
    categorie: 'modes',
    titre: 'Les règles communes des arènes',
    titreEn: 'Rules common to every arena',
    contenu: `> **Pas de régénération naturelle.** La vie ne remonte **qu'avec la soupe** — en arène comme au FFA.
> **Pas de faim.**
> **L'arène est indestructible.** Tu peux poser des blocs, mais tu ne peux casser **que les blocs posés pendant le match**.
> **Le kit est le même pour les deux joueurs**, donné au début du match. Il est retiré à la fin, dès que l'un des deux tombe.
> **Durée maximale : 10 minutes.** Au temps, le joueur qui a le plus de vie gagne.`,
    contenuEn: `> **No natural regeneration.** Health only comes back **with soup** — in arenas as in FFA.
> **No hunger.**
> **The arena is indestructible.** You can place blocks, but you can only break **blocks placed during the match**.
> **Both players get the same kit**, given at the start of the match. It is taken away at the end, as soon as one of them falls.
> **Maximum length: 10 minutes.** At time, the player with the most health wins.`,
  },
  {
    categorie: 'modes',
    titre: 'HG',
    titreEn: 'HG',
    contenu: `Le mode **Hunger Games** classique du soup PvP.

> **Kit :** épée en diamant, armure en fer, soupes, champignons et bols pour en refaire, blocs de construction, seaux d'eau et de lave, pioche et hache en pierre.
> **Construire est permis** : murs, tours, pièges à lave — tant que ce sont tes blocs.
> **Maps :** plusieurs arènes (Gladiator, Feast…). Elles tournent au hasard en ranked ; en \`/duel\`, tu choisis.`,
    contenuEn: `The classic soup PvP **Hunger Games** mode.

> **Kit:** diamond sword, iron armour, soups, mushrooms and bowls to make more, building blocks, water and lava buckets, stone pickaxe and axe.
> **Building is allowed**: walls, towers, lava traps — as long as they are your blocks.
> **Maps:** several arenas (Gladiator, Feast…). They rotate at random in ranked; in \`/duel\`, you choose.`,
  },
  {
    categorie: 'modes',
    titre: 'Digger',
    titreEn: 'Digger',
    contenu: `Un mode vertical, où l'on se bat en construisant et en creusant dans ses propres blocs.

> **La map se remet à zéro toutes les 45 secondes**, même si des joueurs sont dedans : les blocs posés disparaissent.
> **Sortir de l'arène par le haut = défaite immédiate.**
> **Tu peux jeter des items** (touche Q) pendant le match.
> Comme partout, l'arène elle-même est indestructible : seuls les blocs posés se cassent.`,
    contenuEn: `A vertical mode, where you fight by building and digging through your own blocks.

> **The map resets every 45 seconds**, even with players inside: placed blocks disappear.
> **Leaving the arena from the top = instant loss.**
> **You can drop items** (Q key) during the match.
> As everywhere, the arena itself is indestructible: only placed blocks can be broken.`,
  },

  /* ═══════════════════════════ CASHPRIZE ═══════════════════════════ */
  {
    categorie: 'cashprize',
    titre: 'La compétition',
    titreEn: 'The competition',
    contenu: `À chaque saison, **150 € sont répartis entre les 3 premiers de l'Elo global**.

> **Répartition :** 1ᵉʳ **75 €** · 2ᵉ **50 €** · 3ᵉ **25 €**

Une saison dure **un mois**. La **saison 1** s'ouvre le **samedi 12 septembre 2026 à 14h30** et se clôture le **lundi 12 octobre 2026 à 14h30** (heure de Paris). Chaque saison suivante s'ouvre à la clôture de la précédente, le 12 du mois à 14h30.

Le classement est **figé à l'instant précis de la clôture**, puis tout le monde repart à 1000 Elo dans chaque mode.

Les kits, les cosmétiques et les coins **ne sont jamais remis à zéro**. Seul l'Elo l'est.`,
    contenuEn: `Every season, **150 € are shared between the top 3 of the global Elo**.

> **Split:** 1st **75 €** · 2nd **50 €** · 3rd **25 €**

A season lasts **one month**. **Season 1** opens on **Saturday 12 September 2026 at 2:30 PM** and closes on **Monday 12 October 2026 at 2:30 PM** (Paris time). Each following season opens when the previous one closes, on the 12th of the month at 2:30 PM.

The leaderboard is **frozen at the exact closing moment**, then everyone restarts at 1000 Elo in every mode.

Kits, cosmetics and coins are **never reset**. Only Elo is.`,
  },
  {
    categorie: 'cashprize',
    titre: 'Être éligible au cashprize',
    titreEn: 'Being eligible for the cashprize',
    contenu: `Trois conditions, toutes obligatoires :

> **1.** Avoir **lié son compte Discord** — sans liaison, impossible de jouer en ranked.
> **2.** N'avoir **aucune sanction en cours** au moment de la clôture.
> **3.** Ne pas être **exclu du classement**.

Il n'y a **pas de nombre minimum de matchs** : l'Elo global étant la moyenne de tous les modes, on n'atteint pas le top 3 sans avoir joué — et bien joué — partout.

En cas d'**égalité parfaite d'Elo global**, c'est le joueur ayant disputé **le plus de matchs classés** qui passe devant. Si l'égalité persiste, celui qui a atteint cet Elo **en premier**.`,
    contenuEn: `Three conditions, all required:

> **1.** Have **linked your Discord account** — without it, you cannot play ranked.
> **2.** Have **no active sanction** when the season closes.
> **3.** Not be **excluded from the leaderboard**.

There is **no minimum number of matches**: since the global Elo is the average of every mode, nobody reaches the top 3 without playing — and playing well — everywhere.

In case of a **perfect global Elo tie**, the player with **the most ranked matches** comes first. If the tie remains, whoever reached that Elo **first**.`,
  },
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
> **Le farm d'Elo** : matchs arrangés, défaites volontaires, comptes complices, files synchronisées pour tomber sur un ami.
> **L'usage d'un bug** pour progresser, quelle que soit son ampleur.
> **Le multi-compte** ou le partage de compte.
> **Un faisceau d'indices sérieux de triche**, même sans preuve formelle — voir *Le doute, et comment il est tranché*.
> **Une sanction en cours** au moment de la clôture de la saison.
> **Un compte Discord non lié.**
> **Une réclamation déposée plus de 30 jours** après la fin de la saison.

Deux sanctions différentes existent, et elles ne se confondent pas :

> **L'exclusion du classement** te sort de la compétition. Tu continues de jouer normalement.
> **Le bannissement** te sort du serveur.

Un joueur exclu ou banni **disparaît du classement**, en jeu comme sur ce site, et les places suivantes remontent.`,
    contenuEn: `The summary, on one page. Each point is detailed in the other tabs.

> **Cheating**, in any form. Permanent ban, Elo voided, prize forfeited — including if it is discovered **after** the season ends.
> **Elo farming**: arranged matches, losing on purpose, accomplice accounts, queuing in sync to face a friend.
> **Using a bug** to progress, however small.
> **Multi-accounting** or account sharing.
> **A serious body of evidence pointing to cheating**, even without formal proof — see *Doubt, and how it is settled*.
> **An active sanction** when the season closes.
> **An unlinked Discord account.**
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
    contenu: `Le serveur limite automatiquement ce qu'une série de matchs contre les mêmes adversaires peut rapporter. Ces plafonds ne sont pas des sanctions : ils s'appliquent tout seuls, sans intervention du staff.

> **1. Rejouer le même adversaire rapporte de moins en moins.** Quand plus de 20 joueurs liés sont en ligne : 100 %, puis 50 %, 25 %, 10 %, et **plus rien au-delà de 5 matchs contre lui en 2 heures**. Quand le serveur est plus calme, la règle s'assouplit pour que tout le monde puisse jouer : 100 %, 75 %, 50 %, 25 %, et plus rien au-delà de 10 matchs en 20 minutes.
> **2. Il faut varier d'adversaires.** Au-delà de **10 matchs classés dans l'heure**, il faut en avoir affronté au moins **3 différents**. Sinon, les matchs cessent de rapporter jusqu'à ce que tu varies.
> **3. Un plafond horaire absolu** de 40 matchs classés.

Chaque plafond s'applique **au gain comme à la perte** : perdre en boucle contre un ami ne vide pas ton Elo, mais ne remplit pas le sien non plus.

La file évite déjà de te remettre contre ton dernier adversaire pendant 2 minutes. **Un joueur qui enchaîne les files normalement ne croise jamais ces plafonds.**

Quand un match ne rapporte rien à cause d'un plafond, le résumé de fin de match te le dit.`,
    contenuEn: `The server automatically caps what a series of matches against the same opponents can earn. These caps are not sanctions: they apply on their own, with no staff involved.

> **1. Playing the same opponent again earns less and less.** When more than 20 linked players are online: 100%, then 50%, 25%, 10%, and **nothing beyond 5 matches against them within 2 hours**. When the server is quieter, the rule relaxes so that everyone can play: 100%, 75%, 50%, 25%, and nothing beyond 10 matches within 20 minutes.
> **2. You have to vary opponents.** Beyond **10 ranked matches in an hour**, you must have faced at least **3 different** people. Otherwise matches stop earning until you mix it up.
> **3. An absolute hourly cap** of 40 ranked matches.

Every cap applies **to gains and to losses alike**: losing on repeat to a friend does not drain your Elo, but it does not fill theirs either.

The queue already avoids pairing you with your last opponent for 2 minutes. **A player who simply keeps queuing never runs into these caps.**

When a match earns nothing because of a cap, the end-of-match summary tells you.`,
  },
  {
    categorie: 'integrite',
    titre: 'Arrangements et boost de classement',
    titreEn: 'Arranged matches and rank boosting',
    contenu: `Sont **interdits**, et entraînent l'**exclusion du classement de la saison** :

> **Les matchs arrangés** — se laisser tuer, abandonner exprès, s'échanger les victoires.
> **Les files synchronisées** : entrer en file au même moment qu'un ami pour tomber l'un sur l'autre et se donner des points.
> **Le double compte**, quel qu'en soit l'usage : se donner des points, occuper deux places du top 3.
> **Le partage de compte.** Le classement récompense un joueur, pas un pseudo.
> **Le boost par un tiers** : faire monter le classement de quelqu'un d'autre, contre paiement ou non.

Le serveur enregistre **chaque match** : les deux joueurs, le mode, l'Elo échangé, la durée, la façon dont il s'est terminé, les points de vie restants et le coefficient anti-farm appliqué. Un schéma anormal se voit dans les données, même si personne ne le signale — et il se voit **après coup**, y compris des semaines plus tard.`,
    contenuEn: `The following are **forbidden**, and lead to **exclusion from the season leaderboard**:

> **Arranged matches** — letting someone kill you, forfeiting on purpose, trading wins.
> **Synced queuing**: joining the queue at the same time as a friend to face each other and feed points.
> **Alt accounts**, whatever the use: feeding yourself points, taking two spots in the top 3.
> **Account sharing.** The leaderboard rewards a player, not a username.
> **Boosting by a third party**: raising someone else's rank, paid or not.

The server records **every match**: both players, the mode, the Elo exchanged, the length, how it ended, the health left and the anti-farm coefficient applied. An abnormal pattern shows in the data even if nobody reports it — and it shows **afterwards**, including weeks later.`,
  },
  {
    categorie: 'integrite',
    titre: 'Bugs et exploits',
    titreEn: 'Bugs and exploits',
    contenu: `Tu trouves un bug ? **Signale-le sur le [Discord]({discord})** — les signalements utiles sont récompensés.

L'exploiter est sanctionné, **que le bug ait été signalé ou non**, et que l'avantage obtenu soit grand ou petit :

> **Utiliser un bug pour gagner de l'Elo** — sortir d'une arène, bloquer son adversaire, forcer une fin de match — entraîne l'**annulation des gains concernés** et l'**exclusion du classement**.
> **Utiliser un bug pour obtenir des coins, des kits ou des items** entraîne le retrait de ce qui a été obtenu, et une sanction proportionnée.
> **Répéter l'exploitation après un avertissement** entraîne le bannissement.

« Je ne savais pas que c'était un bug » vaut pour un premier usage isolé. Ça ne vaut pas pour une exploitation répétée : à partir du moment où l'on refait volontairement quelque chose qui ne devrait pas marcher, on le sait.`,
    contenuEn: `Found a bug? **Report it on [Discord]({discord})** — useful reports are rewarded.

Exploiting one is sanctioned, **whether or not it was reported**, and whether the advantage gained is large or small:

> **Using a bug to gain Elo** — getting out of an arena, trapping your opponent, forcing a match to end — leads to the **cancellation of the gains concerned** and **exclusion from the leaderboard**.
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

Le serveur enregistre en continu les mesures de combat — cadence de clic, portée, régularité, déplacements — et conserve ces relevés. Ils peuvent être réexaminés **des semaines après** les faits.`,
    contenuEn: `Any client or module giving a combat advantage is **forbidden**: **killaura**, **reach**, **autoclicker**, **anti-knockback**, **velocity**, **aimbot**, **backtrack**, **autosoup**, **fly**, **speed**, **nofall**, **x-ray**, and the like.

> **Allowed:** Optifine, PvP clients (Lunar, Badlion, CheatBreaker…) without forbidden modules, texture packs.

> **Sanction:** permanent ban, without warning. **Elo is voided and the cashprize forfeited**, including if the cheating is discovered after the season ends.

A player removed for cheating is taken off the leaderboard, and **the players below move up**.

The server continuously records combat measurements — click rate, reach, regularity, movement — and keeps them. They can be re-examined **weeks after** the fact.`,
  },
  {
    categorie: 'sanctions',
    titre: 'L’exclusion du classement',
    titreEn: 'Exclusion from the leaderboard',
    contenu: `C'est une sanction **distincte du bannissement**, créée pour ne pas avoir à choisir entre « on ne fait rien » et « on bannit ».

**Un joueur exclu du classement continue de jouer normalement** : FFA, Unranked, duels, kits, coins, tout est intact. Il ne concourt simplement plus pour le cashprize.

Concrètement :

> Il **ne peut plus entrer en file Ranked**.
> Il **disparaît du classement**, en jeu comme sur ce site, et les places suivantes remontent.

**Elle peut être prononcée pour :** triche avérée ou fortement soupçonnée, usage d'un bug, farm d'Elo, matchs arrangés, multi-compte, ou tout comportement qui fausse la mesure du classement.

**Elle est définitive pour la saison en cours.** Il n'y a pas de durée : une exclusion levée à trois jours de la fin ne voudrait rien dire. Elle est **réexaminée pour la saison suivante** si le joueur le demande.

> **Pour contester : ouvre un ticket sur le [Discord]({discord}).** Le motif de ton exclusion t'est affiché en jeu (menu \`/ranked\`) : indique-le dans ton ticket.

Un joueur **banni du serveur** est également retiré du classement pendant toute la durée de sa sanction, et y revient automatiquement à la levée du bannissement.`,
    contenuEn: `This is a sanction **separate from a ban**, created so that we do not have to choose between "do nothing" and "ban".

**A player excluded from the leaderboard keeps playing normally**: FFA, Unranked, duels, kits, coins — everything is untouched. They simply no longer compete for the cashprize.

In practice:

> They **can no longer join the Ranked queue**.
> They **disappear from the leaderboard**, in game and on this site, and the players below move up.

**It can be issued for:** proven or strongly suspected cheating, bug abuse, Elo farming, arranged matches, multi-accounting, or any behaviour that distorts what the leaderboard measures.

**It is final for the ongoing season.** There is no duration: an exclusion lifted three days before the end would mean nothing. It is **reviewed for the next season** if the player asks.

> **To appeal: open a ticket on [Discord]({discord}).** The reason for your exclusion is shown to you in game (\`/ranked\` menu): quote it in your ticket.

A player **banned from the server** is also removed from the leaderboard for the whole duration of the sanction, and returns automatically when the ban is lifted.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Le doute, et comment il est tranché',
    titreEn: 'Doubt, and how it is settled',
    contenu: `Il y a de l'argent en jeu. Cette section dit **à l'avance** ce qui se passe quand le staff a un doute, pour que personne ne le découvre le jour où ça le concerne.

**Deux niveaux de preuve, pour deux sanctions différentes.**

> **Pour bannir**, il faut une **certitude** : un relevé sans ambiguïté, un aveu, un enregistrement, ou une mesure qu'aucun jeu honnête ne produit. Le doute profite au joueur.
> **Pour exclure du classement**, un **faisceau d'indices sérieux et concordants** suffit. Le joueur garde son accès au serveur, ses kits et sa progression : la sanction ne lui retire que la course au prix.

Cette différence est volontaire. Distribuer de l'argent sur un classement qu'on soupçonne d'être faussé serait injuste envers tous les autres participants — et exiger la même certitude que pour un ban reviendrait à ne jamais pouvoir écarter personne.

**Ce sur quoi le staff s'appuie :** l'historique complet des matchs enregistré par le serveur, les relevés de cadence de clic et de portée, les mesures de déplacement, les signalements, les enregistrements vidéo, et les contrôles en direct — le staff peut observer n'importe quel match en cours.

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

**What the staff relies on:** the full match history recorded by the server, click-rate and reach measurements, movement records, reports, video recordings, and live checks — staff can watch any ongoing match.

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

Tu contestes une sanction, ou un résultat de match ? **Ouvre un ticket sur le [Discord]({discord})** — pas de débat dans le chat du serveur, et pas de harcèlement en message privé : les deux aggravent la situation au lieu de la régler.

Le staff tranche à partir de l'historique des matchs enregistré par le serveur, qui fait foi.

Se faire passer pour un membre du staff, ou prétendre parler en son nom, est sanctionné.`,
    contenuEn: `Staff decisions apply **immediately**.

Contesting a sanction, or a match result? **Open a ticket on [Discord]({discord})** — no debate in the server chat, and no harassment in DMs: both make things worse instead of resolving them.

The staff decides from the match history recorded by the server, which is authoritative.

Impersonating a staff member, or claiming to speak on their behalf, is sanctioned.`,
  },

  /* ═══════════════════════════ UTILISATION ═══════════════════════════ */
  {
    categorie: 'serveur',
    titre: 'Le spawn et le FFA',
    titreEn: 'Spawn and FFA',
    contenu: `Le **FFA** est la salle d'attente du Practice : on s'y échauffe pendant que la file cherche un adversaire.

> Au spawn, le **papier** te donne un kit. Une fois sorti du spawn avec un kit, **tu ne peux plus y revenir** : tape \`/suicide\` pour y retourner.
> **Le FFA ne compte pas pour l'Elo.** Y mourir ne te coûte rien.
> **Pas de régénération naturelle** : la vie ne remonte qu'avec la soupe.
> Dès qu'un match est trouvé, tu es téléporté dans l'arène, même en plein combat au FFA.`,
    contenuEn: `**FFA** is the Practice waiting room: you warm up there while the queue looks for an opponent.

> At spawn, the **paper** gives you a kit. Once you leave spawn with a kit, **you cannot go back in**: type \`/suicide\` to return.
> **FFA does not count for Elo.** Dying there costs you nothing.
> **No natural regeneration**: health only comes back with soup.
> As soon as a match is found, you are teleported to the arena, even mid-fight in FFA.`,
  },
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
  L'ORDRE RESTE GLOBAL, ET C'EST VOULU : les flèches « monter / descendre »
  de l'admin déplacent une section dans l'ordre global, et la page publique
  numérote les sections À L'INTÉRIEUR de l'onglet ouvert. Les catégories
  sont écrites en bloc dans ce fichier, l'ordre suit.
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
