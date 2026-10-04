import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * LE RÈGLEMENT, RÉÉCRIT POUR LA COMPÉTITION.            (2026-10-04)
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  CE QUI CHANGE, ET POURQUOI
 * ═══════════════════════════════════════════════════════════════════════
 *
 * L'ancien règlement expliquait le serveur ; celui-ci dit ce qui est
 * interdit en compétition. Le modèle est celui des serveurs practice
 * établis (PvPRivals et consorts) : UNE INFRACTION = UN TITRE + UNE
 * PHRASE. Un règlement se lit en diagonale ou ne se lit pas, et le jour
 * où le premier du classement est écarté, la seule chose qui compte est
 * qu'il ait pu trouver la règle avant, en trois secondes.
 *
 * Nouveautés par rapport à la version du 12/09 :
 *   - un catalogue d'infractions de compétition qui n'existait pas :
 *     boost et chute d'Elo, matchs arrangés, files synchronisées, fuite,
 *     camping, gonflage des stats unranked, stream sniping ;
 *   - le screenshare (LJScan) devient une obligation écrite ;
 *   - chaque infraction porte sa sanction, en une ligne ;
 *   - les pavés explicatifs sont coupés : il reste une à trois phrases.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  CHAQUE CHIFFRE VIENT DE LA CONFIGURATION EN SERVICE
 * ═══════════════════════════════════════════════════════════════════════
 *   Elo          départ 1000, ±30 max par match (LJElo elo.max-points)
 *   Qualif.      5 victoires en file unranked (LJPractice ranked-victoires-min)
 *                ⚠ le Discord lié n'est PLUS exigé pour jouer classé
 *                (LJElo exiger-liaison: false, 25/09) — il l'est pour être payé
 *   Files        ±100 Elo au départ, élargi avec l'attente
 *   Matchs       décompte 3 s, 10 min max, au temps : le plus de vie gagne
 *   Cashprize    150 € — 75 / 50 / 25 au top 3 de l'Elo global
 *
 * `{discord}` est remplacé par le lien du Discord à l'affichage.
 */

const SECTIONS = [
  /* ═══════════════════════════ LE RANKED ═══════════════════════════ */
  {
    categorie: 'ranked',
    titre: 'Débloquer le ranked',
    titreEn: 'Unlocking ranked',
    contenu: `Gagne **5 matchs en file unranked** et les files classées s'ouvrent. Ta progression s'affiche dans le menu \`/ranked\` et sur le tableau de droite.

Les victoires par abandon ou déconnexion de l'adversaire ne comptent pas, et les \`/duel\` entre amis non plus.`,
    contenuEn: `Win **5 unranked queue matches** and the ranked queues open. Your progress shows in the \`/ranked\` menu and on the scoreboard.

Wins by opponent forfeit or disconnect do not count, and neither do \`/duel\` games between friends.`,
  },
  {
    categorie: 'ranked',
    titre: 'L’Elo',
    titreEn: 'Elo',
    contenu: `Tout le monde démarre à **1000** dans chaque mode, et un match fait gagner ou perdre **30 points au maximum**.

Ton **Elo global** est la moyenne de tes quatre modes classés ; un mode jamais joué compte pour 1000. C'est lui qui fait le classement du cashprize.`,
    contenuEn: `Everyone starts at **1000** in every mode, and a match wins or loses you **30 points at most**.

Your **global Elo** is the average of your four ranked modes; a mode you never played counts as 1000. That is the Elo the cashprize is ranked on.`,
  },
  {
    categorie: 'ranked',
    titre: 'L’appariement',
    titreEn: 'Matchmaking',
    contenu: `La file cherche d'abord un adversaire à **±100 Elo**, puis élargit avec l'attente jusqu'à accepter n'importe qui. Tu ne retombes pas sur ton dernier adversaire immédiatement.`,
    contenuEn: `The queue first looks for an opponent within **±100 Elo**, then widens as you wait until it accepts anyone. You will not face your last opponent again right away.`,
  },
  {
    categorie: 'ranked',
    titre: 'La fin d’un match',
    titreEn: 'How a match ends',
    contenu: `Le premier qui tombe a perdu. Au bout de **10 minutes**, c'est le joueur qui a le plus de vie — en Boxing, celui qui a touché le plus souvent.`,
    contenuEn: `The first player to fall loses. After **10 minutes**, the player with the most health wins — in Boxing, whoever landed the most hits.`,
  },
  {
    categorie: 'ranked',
    titre: 'Quitter un match classé',
    titreEn: 'Leaving a ranked match',
    contenu: `Se déconnecter ou abandonner pendant un match classé **compte comme une défaite**, Elo compris. C'est ce qui empêche de fuir un match qui tourne mal.

Un plantage du serveur, lui, n'est jamais compté contre toi.`,
    contenuEn: `Disconnecting or forfeiting during a ranked match **counts as a loss**, Elo included. That is what stops people from fleeing a match going badly.

A server crash is never counted against you.`,
  },
  {
    categorie: 'ranked',
    titre: 'Unranked, duels et entraînement',
    titreEn: 'Unranked, duels and training',
    contenu: `L'unranked, les \`/duel\`, les parties entre amis, les bots d'entraînement et les modes hors classement (CaveUHC, Rush) **ne touchent jamais à ton Elo** ni au cashprize.

Tes statistiques unranked, elles, sont bien enregistrées : elles ont leurs propres règles plus bas.`,
    contenuEn: `Unranked, \`/duel\`, party games, training bots and the unranked modes (CaveUHC, Rush) **never affect your Elo** or the cashprize.

Your unranked statistics are recorded though, and they have their own rules below.`,
  },

  /* ═══════════════════════════ LES MODES ═══════════════════════════ */
  {
    categorie: 'modes',
    titre: 'Les règles communes des arènes',
    titreEn: 'Rules common to every arena',
    contenu: `La vie ne remonte **qu'avec la soupe** : aucune régénération naturelle, aucune faim.

L'arène est indestructible — tu peux poser des blocs, mais tu ne casses **que ceux posés pendant le match**. Les deux joueurs reçoivent exactement le même kit, retiré à la fin.`,
    contenuEn: `Health only comes back **with soup**: no natural regeneration, no hunger.

The arena is indestructible — you may place blocks, but you can only break **those placed during the match**. Both players get the exact same kit, removed at the end.`,
  },
  {
    categorie: 'modes',
    titre: 'HG',
    titreEn: 'HG',
    contenu: `Épée en diamant, armure en fer, soupes, seaux et blocs de construction. Murs, tours et pièges à lave sont permis tant que ce sont tes blocs.`,
    contenuEn: `Diamond sword, iron armour, soups, buckets and building blocks. Walls, towers and lava traps are allowed as long as they are your blocks.`,
  },
  {
    categorie: 'modes',
    titre: 'Digger',
    titreEn: 'Digger',
    contenu: `Un combat vertical : on pose, on creuse, et **la map se remet à zéro en plein duel**. Sortir de l'arène par le haut est une **défaite immédiate**.`,
    contenuEn: `A vertical fight: you place, you dig, and **the map resets mid-duel**. Leaving the arena from the top is an **instant loss**.`,
  },
  {
    categorie: 'modes',
    titre: 'Boxing',
    titreEn: 'Boxing',
    contenu: `Épée seule, aucun dégât, que du recul : le premier à **100 coups** gagne. Au temps, c'est celui qui a touché le plus souvent.`,
    contenuEn: `Sword only, no damage, pure knockback: first to **100 hits** wins. At time, whoever landed the most hits takes it.`,
  },
  {
    categorie: 'modes',
    titre: 'Iron Soup',
    titreEn: 'Iron Soup',
    contenu: `Armure en fer, épée Tranchant I et 32 soupes. Pas de blocs, pas de seaux : celui qui gère le mieux son stock l'emporte.`,
    contenuEn: `Iron armour, Sharpness I sword and 32 soups. No blocks, no buckets: whoever manages their stack best wins.`,
  },

  /* ═══════════════════════════ CASHPRIZE ═══════════════════════════ */
  {
    categorie: 'cashprize',
    titre: 'La compétition',
    titreEn: 'The competition',
    contenu: `À chaque saison, **150 € sont répartis entre les 3 premiers de l'Elo global** : 1ᵉʳ **75 €** · 2ᵉ **50 €** · 3ᵉ **25 €**.

Une saison dure un mois. Le classement est **figé à la seconde de la clôture**, puis tout repart à 1000 Elo. Les kits, les coins et les cosmétiques ne sont jamais remis à zéro.`,
    contenuEn: `Every season, **150 € are shared between the top 3 of the global Elo**: 1st **75 €** · 2nd **50 €** · 3rd **25 €**.

A season lasts one month. The leaderboard is **frozen at the exact second it closes**, then everyone restarts at 1000 Elo. Kits, coins and cosmetics are never reset.`,
  },
  {
    categorie: 'cashprize',
    titre: 'Être éligible',
    titreEn: 'Being eligible',
    contenu: `Il n'y a **aucun minimum de matchs** : l'Elo global étant la moyenne de tous les modes, on n'atteint pas le top 3 sans avoir joué partout.

Il faut en revanche **ne porter aucune sanction en cours** à la clôture, ne pas être exclu du classement, et avoir **lié son compte Discord** — c'est par là que les gagnants sont contactés.

En cas d'égalité parfaite, le joueur qui a disputé **le plus de matchs classés** passe devant.`,
    contenuEn: `There is **no minimum number of matches**: since the global Elo averages every mode, nobody reaches the top 3 without playing everywhere.

You must however have **no active sanction** at closing time, not be excluded from the leaderboard, and have **linked your Discord account** — that is how winners are contacted.

In case of a perfect tie, the player with **the most ranked matches** comes first.`,
  },
  {
    categorie: 'cashprize',
    titre: 'Le versement',
    titreEn: 'Payout',
    contenu: `Les gagnants sont contactés **sur Discord** et disposent de **30 jours** pour réclamer leur lot. Passé ce délai, il est perdu.

Le moyen de paiement est convenu avec le gagnant (PayPal ou carte cadeau). Pour un mineur, l'accord d'un représentant légal est demandé avant tout versement.

Le lot est **personnel et incessible** : il ne peut être versé à un tiers ni échangé contre des avantages en jeu.`,
    contenuEn: `Winners are contacted **on Discord** and have **30 days** to claim their prize. After that, it is forfeited.

The payment method is agreed with the winner (PayPal or gift card). For a minor, a legal guardian's consent is required before any payment.

The prize is **personal and non-transferable**: it cannot be paid to a third party nor exchanged for in-game advantages.`,
  },
  {
    categorie: 'cashprize',
    titre: 'Ce qui peut te priver du prix',
    titreEn: 'What can cost you the prize',
    contenu: `La triche, le boost d'Elo, les matchs arrangés, le multi-compte, l'exploitation d'un bug, une sanction en cours à la clôture, un compte Discord non lié, ou une réclamation déposée plus de 30 jours après la fin de la saison.

En cas de disqualification d'un gagnant, **son lot revient au joueur suivant** au classement.`,
    contenuEn: `Cheating, Elo boosting, fixed matches, multi-accounting, bug exploitation, an active sanction at closing time, an unlinked Discord account, or a claim filed more than 30 days after the season ends.

If a winner is disqualified, **their prize goes to the next player** on the leaderboard.`,
  },

  /* ═══════════════════ INTÉGRITÉ DE LA COMPÉTITION ═══════════════════ */
  {
    categorie: 'integrite',
    titre: 'Boost d’Elo',
    titreEn: 'Elo boosting',
    contenu: `Gonfler artificiellement un Elo, le tien ou celui d'un autre : adversaire complice, service rendu ou payé, comptes qui se renvoient les victoires.

**Sanction :** exclusion du classement et perte du cashprize.`,
    contenuEn: `Artificially inflating an Elo, yours or someone else's: a complicit opponent, a favour or a paid service, accounts trading wins.

**Sanction:** exclusion from the leaderboard and loss of the cashprize.`,
  },
  {
    categorie: 'integrite',
    titre: 'Chute d’Elo volontaire',
    titreEn: 'Elo dropping',
    contenu: `Perdre exprès pour descendre, que ce soit pour affronter des adversaires plus faibles ensuite ou pour faire monter quelqu'un d'autre.

**Sanction :** exclusion du classement.`,
    contenuEn: `Losing on purpose to drop down, whether to face weaker opponents afterwards or to push someone else up.

**Sanction:** exclusion from the leaderboard.`,
  },
  {
    categorie: 'integrite',
    titre: 'Matchs arrangés',
    titreEn: 'Match fixing',
    contenu: `S'entendre avant ou pendant un match classé sur son issue, ou sur la manière de le jouer.

**Sanction :** exclusion du classement pour les deux joueurs.`,
    contenuEn: `Agreeing before or during a ranked match on its outcome, or on how it will be played.

**Sanction:** exclusion from the leaderboard for both players.`,
  },
  {
    categorie: 'integrite',
    titre: 'Files synchronisées',
    titreEn: 'Queue sniping',
    contenu: `Entrer en file en même temps qu'un ami, dans le même mode, pour tomber l'un sur l'autre et choisir qui gagne.

**Sanction :** exclusion du classement.`,
    contenuEn: `Joining the queue at the same time as a friend, in the same mode, to meet each other and pick who wins.

**Sanction:** exclusion from the leaderboard.`,
  },
  {
    categorie: 'integrite',
    titre: 'Farm d’un même adversaire',
    titreEn: 'Farming the same opponent',
    contenu: `Le serveur plafonne déjà **l'Elo pris à un même adversaire** et le **nombre de matchs classés par heure** : jouer beaucoup n'est pas un problème, jouer toujours contre la même personne en est un.

Chercher à contourner ces plafonds est traité comme du boost d'Elo.`,
    contenuEn: `The server already caps **the Elo taken from the same opponent** and the **number of ranked matches per hour**: playing a lot is fine, always playing the same person is not.

Trying to work around those caps is treated as Elo boosting.`,
  },
  {
    categorie: 'integrite',
    titre: 'Un seul joueur, un seul compte',
    titreEn: 'One player, one account',
    contenu: `Une personne ne dispute une saison classée que sur **un seul compte**. Les comptes secondaires n'ont rien à faire en file classée, même pour « s'échauffer ».

**Sanction :** exclusion du classement de tous les comptes concernés, bannissement en cas de récidive.`,
    contenuEn: `A person plays a ranked season on **one account only**. Alt accounts have no place in the ranked queue, not even to "warm up".

**Sanction:** exclusion from the leaderboard for every account involved, ban if it happens again.`,
  },
  {
    categorie: 'integrite',
    titre: 'Partage de compte',
    titreEn: 'Account sharing',
    contenu: `Jouer un match classé, un duel classé ou un tournoi sur le compte de quelqu'un d'autre — ou laisser quelqu'un jouer sur le tien.

**Sanction :** exclusion du classement ; le compte reste responsable de ce qui est fait avec lui.`,
    contenuEn: `Playing a ranked match, ranked duel or tournament on someone else's account — or letting someone play on yours.

**Sanction:** exclusion from the leaderboard; the account stays responsible for what is done with it.`,
  },
  {
    categorie: 'integrite',
    titre: 'Fuite et temporisation',
    titreEn: 'Stalling',
    contenu: `Courir sans chercher le combat pendant un match classé, uniquement pour épuiser le chrono et gagner au temps.

**Sanction :** match annulé, puis exclusion du classement en cas de répétition.`,
    contenuEn: `Running away without engaging during a ranked match, purely to run down the clock and win on time.

**Sanction:** match voided, then exclusion from the leaderboard if it repeats.`,
  },
  {
    categorie: 'integrite',
    titre: 'Camping',
    titreEn: 'Camping',
    contenu: `Se retrancher dans une zone difficile d'accès de l'arène pour éviter le combat ou faire traîner le match.

**Sanction :** match annulé, puis exclusion du classement en cas de répétition.`,
    contenuEn: `Holing up in a hard-to-reach part of the arena to avoid the fight or drag the match out.

**Sanction:** match voided, then exclusion from the leaderboard if it repeats.`,
  },
  {
    categorie: 'integrite',
    titre: 'Gonflage des stats unranked',
    titreEn: 'Unranked stats boosting',
    contenu: `Enchaîner des matchs unranked arrangés pour faire grimper ses victoires, ses niveaux ou sa qualification au ranked.

**Sanction :** remise à zéro des statistiques concernées.`,
    contenuEn: `Running arranged unranked matches to pump your wins, your levels or your ranked qualification.

**Sanction:** reset of the statistics involved.`,
  },
  {
    categorie: 'integrite',
    titre: 'Stream sniping',
    titreEn: 'Stream sniping',
    contenu: `Regarder le direct d'un adversaire pendant un match pour connaître sa position, son stuff ou ses soupes.

**Sanction :** exclusion du classement.`,
    contenuEn: `Watching an opponent's live stream during a match to learn their position, gear or soups.

**Sanction:** exclusion from the leaderboard.`,
  },
  {
    categorie: 'integrite',
    titre: 'Équipe et sabotage',
    titreEn: 'Teaming and sabotage',
    contenu: `Dans les modes à plusieurs (party, 2v2, tournois, événements) : s'allier au-delà de la taille d'équipe autorisée, ou saboter sa propre équipe.

**Sanction :** disqualification de l'événement, exclusion du classement en cas de répétition.`,
    contenuEn: `In multiplayer modes (party, 2v2, tournaments, events): allying beyond the allowed team size, or sabotaging your own team.

**Sanction:** disqualification from the event, exclusion from the leaderboard if it repeats.`,
  },

  /* ═══════════════════════ TRICHE ET SANCTIONS ═══════════════════════ */
  {
    categorie: 'sanctions',
    titre: 'Triche — tolérance zéro',
    titreEn: 'Cheating — zero tolerance',
    contenu: `Tout client, module ou matériel donnant un avantage en combat est interdit : **killaura**, **reach**, **autoclicker**, **autosoup**, **fly**, **speed**, **nofall**, **x-ray** et assimilés.

**Sanction :** bannissement définitif, Elo annulé et cashprize perdu — y compris si la triche est découverte **après** la fin de la saison.`,
    contenuEn: `Any client, module or hardware giving a combat advantage is forbidden: **killaura**, **reach**, **autoclicker**, **autosoup**, **fly**, **speed**, **nofall**, **x-ray** and the like.

**Sanction:** permanent ban, Elo voided and cashprize forfeited — including if the cheating is discovered **after** the season ends.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Ce qui est autorisé',
    titreEn: 'What is allowed',
    contenu: `Optifine, les clients PvP (Lunar, Badlion, CheatBreaker…) sans module interdit, et les packs de textures.

Dans le doute sur un mod, demande **avant** sur le [Discord]({discord}) : une réponse du staff fait foi.`,
    contenuEn: `Optifine, PvP clients (Lunar, Badlion, CheatBreaker…) without forbidden modules, and texture packs.

If you are unsure about a mod, ask **before** on [Discord]({discord}): a staff answer is what counts.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Manipulation du ping',
    titreEn: 'Ping spoofing',
    contenu: `Fausser volontairement sa latence — lag switch, bridage de connexion — pour perturber les coups reçus ou donnés.

**Sanction :** bannissement, comme pour la triche.`,
    contenuEn: `Deliberately faking your latency — lag switch, throttled connection — to disrupt the hits you take or land.

**Sanction:** ban, same as cheating.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Exploitation d’un bug',
    titreEn: 'Bug exploitation',
    contenu: `Utiliser un bug du serveur ou du client pour gagner, monter, ou perturber un match — quelle que soit son ampleur.

Signaler un bug ne coûte rien et rapporte souvent une récompense ; l'exploiter coûte le classement.

**Sanction :** annulation des gains, exclusion du classement, bannissement si c'est répété.`,
    contenuEn: `Using a server or client bug to win, climb or disrupt a match — however small it is.

Reporting a bug costs nothing and often earns a reward; exploiting it costs you the leaderboard.

**Sanction:** gains voided, exclusion from the leaderboard, ban if repeated.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Le screenshare',
    titreEn: 'Screenshare',
    contenu: `Un membre du staff peut demander une **vérification d'écran** (screenshare) à tout moment, avant ou après un match. L'outil est public et son fonctionnement est expliqué sur la page [Screenshare](/ljscan).

Refuser, se déconnecter, redémarrer sa machine ou effacer des fichiers pendant la vérification vaut aveu.

**Sanction :** bannissement pour refus de vérification.`,
    contenuEn: `A staff member may ask for a **screenshare** at any time, before or after a match. The tool is public and explained on the [Screenshare](/ljscan) page.

Refusing, disconnecting, restarting your machine or deleting files during the check counts as an admission.

**Sanction:** ban for refusing the check.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Contournement de sanction',
    titreEn: 'Ban evasion',
    contenu: `Revenir sur le serveur avec un autre compte, une autre adresse IP ou un VPN pendant une sanction.

**Sanction :** la sanction d'origine redémarre à zéro et devient définitive en cas de récidive.`,
    contenuEn: `Coming back on the server with another account, another IP address or a VPN while sanctioned.

**Sanction:** the original sanction restarts from scratch and becomes permanent if it happens again.`,
  },
  {
    categorie: 'sanctions',
    titre: 'L’exclusion du classement',
    titreEn: 'Exclusion from the leaderboard',
    contenu: `L'exclusion sort un joueur de la compétition **sans le sortir du serveur** : il continue de jouer normalement, mais n'apparaît plus au classement, en jeu comme sur ce site, et ne concourt plus pour le cashprize. Les places suivantes remontent.

C'est la sanction des infractions de compétition ; le bannissement, lui, est réservé à la triche et aux comportements graves.`,
    contenuEn: `Exclusion takes a player out of the competition **without taking them off the server**: they keep playing normally, but no longer appear on the leaderboard, in game or on this site, and no longer compete for the cashprize. The places below move up.

It is the sanction for competition offences; bans are reserved for cheating and serious behaviour.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Le doute, et comment il est tranché',
    titreEn: 'Doubt, and how it is settled',
    contenu: `Un faisceau d'indices sérieux et concordants suffit à écarter un joueur de la compétition, même sans preuve formelle. Être très fort, jouer beaucoup ou utiliser un client PvP autorisé n'est jamais un motif à lui seul.

Tu as droit au **motif écrit** de la sanction et à une réponse du staff sur le [Discord]({discord}).`,
    contenuEn: `A serious, consistent body of evidence is enough to remove a player from the competition, even without formal proof. Being very good, playing a lot or using an allowed PvP client is never a reason on its own.

You are entitled to the **written reason** for the sanction and to a staff answer on [Discord]({discord}).`,
  },
  {
    categorie: 'sanctions',
    titre: 'Contester une sanction',
    titreEn: 'Appealing a sanction',
    contenu: `Une sanction se conteste sur le [Discord]({discord}), dans le salon prévu, avec ton pseudo et la date. Les décisions ne se discutent pas en jeu ni en message privé à un modérateur.`,
    contenuEn: `A sanction is appealed on [Discord]({discord}), in the dedicated channel, with your username and the date. Decisions are not argued in game or in a moderator's private messages.`,
  },

  /* ═══════════════════════ SERVEUR ET CHAT ═══════════════════════ */
  {
    categorie: 'serveur',
    titre: 'Respect',
    titreEn: 'Respect',
    contenu: `Les insultes, le harcèlement et l'acharnement sur un joueur n'ont pas leur place, en jeu comme sur le Discord. Perdre un match n'autorise rien.

**Sanction :** mute, puis bannissement temporaire.`,
    contenuEn: `Insults, harassment and piling on a player have no place, in game or on Discord. Losing a match excuses nothing.

**Sanction:** mute, then temporary ban.`,
  },
  {
    categorie: 'serveur',
    titre: 'Propos haineux',
    titreEn: 'Hate speech',
    contenu: `Viser un joueur sur son origine, sa couleur de peau, sa religion, son genre ou son orientation.

**Sanction :** bannissement, sans avertissement.`,
    contenuEn: `Targeting a player over their origin, skin colour, religion, gender or orientation.

**Sanction:** ban, without warning.`,
  },
  {
    categorie: 'serveur',
    titre: 'Souhaits de mort et menaces',
    titreEn: 'Death wishes and threats',
    contenu: `Souhaiter du mal à quelqu'un, menacer de s'en prendre à lui ou à sa connexion (DDoS), directement ou à mots couverts.

**Sanction :** bannissement définitif.`,
    contenuEn: `Wishing harm on someone, threatening them or their connection (DDoS), directly or by implication.

**Sanction:** permanent ban.`,
  },
  {
    categorie: 'serveur',
    titre: 'Informations privées',
    titreEn: 'Private information',
    contenu: `Partager l'identité, l'adresse, les photos ou toute information privée d'un joueur sans son accord.

**Sanction :** bannissement définitif.`,
    contenuEn: `Sharing a player's identity, address, photos or any private information without their consent.

**Sanction:** permanent ban.`,
  },
  {
    categorie: 'serveur',
    titre: 'Spam et publicité',
    titreEn: 'Spam and advertising',
    contenu: `Inonder le chat de messages répétés, ou promouvoir un autre serveur Minecraft, directement ou non.

**Sanction :** mute, puis bannissement.`,
    contenuEn: `Flooding the chat with repeated messages, or promoting another Minecraft server, directly or not.

**Sanction:** mute, then ban.`,
  },
  {
    categorie: 'serveur',
    titre: 'Pseudo, skin et clan',
    titreEn: 'Username, skin and clan',
    contenu: `Un pseudo, un skin ou un nom de clan offensant, explicite ou usurpant l'identité d'un membre du staff est refusé.

**Sanction :** changement imposé, puis bannissement jusqu'au changement.`,
    contenuEn: `An offensive or explicit username, skin or clan name, or one impersonating a staff member, is not accepted.

**Sanction:** forced change, then a ban until it is changed.`,
  },
  {
    categorie: 'serveur',
    titre: 'Signalements',
    titreEn: 'Reports',
    contenu: `Signale un tricheur avec \`/report\` plutôt que dans le chat public : une accusation publique ne sert à rien et pollue le match des autres.

Les signalements inventés ou répétés pour nuire sont sanctionnés comme le reste.`,
    contenuEn: `Report a cheater with \`/report\` rather than in public chat: a public accusation achieves nothing and spoils other people's matches.

Made-up or repeated malicious reports are sanctioned like anything else.`,
  },
  {
    categorie: 'serveur',
    titre: 'Évolution du règlement',
    titreEn: 'Changes to these rules',
    contenu: `Le règlement peut évoluer entre deux saisons, et toute modification est annoncée sur le [Discord]({discord}) avant d'entrer en vigueur.

Les règles applicables à une saison sont celles publiées **à son ouverture** : une modification en cours de saison ne s'applique jamais rétroactivement au classement en cours.

En jouant en classé, tu acceptes ce règlement.`,
    contenuEn: `These rules may change between seasons, and any change is announced on [Discord]({discord}) before it takes effect.

The rules that apply to a season are those published **when it opened**: a mid-season change never applies retroactively to the ongoing leaderboard.

By playing ranked, you accept these rules.`,
  },
]

/*
  L'ordre est global : les flèches « monter / descendre » de l'admin déplacent
  une section dans cet ordre, et la page publique numérote à l'intérieur de
  chaque onglet.
*/
const compteurs = new Map()
const donnees = SECTIONS.map((section, index) => {
  compteurs.set(section.categorie, (compteurs.get(section.categorie) ?? 0) + 1)
  return { ...section, ordre: index, publie: true }
})

const existantes = await prisma.sectionReglement.count()
if (process.argv.includes('--pour-de-vrai')) {
  await prisma.sectionReglement.deleteMany({})
  for (const section of donnees) {
    await prisma.sectionReglement.create({ data: section })
  }
  console.log(`${existantes} ancienne(s) section(s) remplacée(s) par ${donnees.length} nouvelles.`)
} else {
  console.log(`SIMULATION — ${existantes} section(s) en base seraient remplacées par ${donnees.length}.`)
  console.log('Relance avec --pour-de-vrai pour écrire.')
}

for (const [categorie, nombre] of compteurs) {
  console.log(`  ${categorie.padEnd(12)} ${nombre} section(s)`)
}
await prisma.$disconnect()
