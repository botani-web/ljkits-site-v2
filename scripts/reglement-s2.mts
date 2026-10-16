/**
 * LE RÈGLEMENT DE LA SAISON 2 (16/10/2026), écrit d'après ce que les plugins
 * appliquent réellement (LJPractice, LJElo, LJ17) et les décisions de
 * l'utilisateur du 16/10 :
 *   - vérification du top 3 pendant 3 jours après la clôture avant de payer ;
 *   - triche découverte après coup : bannissement, rien de plus n'est écrit ;
 *   - fin de la saison 2 : dimanche 15 novembre 2026 à 23h00 (Paris) ;
 *   - rien sur l'aide extérieure, ni sur les méthodes de clic.
 *
 * Remplace TOUTES les sections (l'ancien règlement est sauvegardé dans
 * /home/mc/backups/reglement-s1-avant-s2-20261016.json).
 *
 * Lancement : npx tsx --env-file=.env scripts/reglement-s2.mts [go]
 * Sans « go », affiche seulement ce qui serait écrit.
 */
import { PrismaClient } from '@prisma/client'

type Section = { categorie: string; titre: string; titreEn: string; contenu: string; contenuEn: string }

const S: Section[] = [
  /* ═══════════════════════════ RANKED ═══════════════════════════ */
  {
    categorie: 'ranked',
    titre: 'Débloquer le ranked',
    titreEn: 'Unlocking ranked',
    contenu: `Gagne **5 matchs en file unranked** et les files classées s'ouvrent. Les \`/duel\` et les victoires par abandon de l'adversaire ne comptent pas.

À ta première entrée en ranked de chaque saison, tu dois **accepter le règlement** dans le menu qui s'ouvre. En l'acceptant, tu reconnais avoir lu cette page.`,
    contenuEn: `Win **5 matches in the unranked queue** and the ranked queues open. \`/duel\` matches and wins by opponent forfeit don't count.

The first time you enter ranked each season, you must **accept the rules** in the menu that opens. By accepting, you confirm you have read this page.`,
  },
  {
    categorie: 'ranked',
    titre: 'Connexion : box uniquement',
    titreEn: 'Connection: home internet only',
    contenu: `Le ranked se joue **uniquement depuis une connexion internet fixe** (box, fibre, ADSL).

Sont **refusés en ranked** : la **4G / 5G**, le **partage de connexion** depuis un téléphone, les **VPN**, les **proxys** et les connexions d'hébergeurs. Ta connexion est vérifiée **à chaque entrée en file** : si tu passes en 4G en cours de soirée, la file ranked se ferme pour toi.

L'unranked, le FFA, les duels et tout le reste du serveur restent ouverts quelle que soit ta connexion. Si ta seule connexion à la maison est une box 4G, ouvre un ticket sur le [Discord]({discord}).`,
    contenuEn: `Ranked can **only be played from a fixed home connection** (box, fibre, DSL).

**Refused in ranked**: **4G / 5G**, **hotspot / tethering** from a phone, **VPNs**, **proxies** and hosting connections. Your connection is checked **every time you join a queue**: if you switch to 4G during the evening, the ranked queue closes for you.

Unranked, FFA, duels and the rest of the server stay open whatever your connection. If your only home connection is a 4G box, open a ticket on [Discord]({discord}).`,
  },
  {
    categorie: 'ranked',
    titre: 'Un seul compte classé',
    titreEn: 'One ranked account',
    contenu: `Une personne joue une saison classée sur **un seul compte**. Sur une même connexion, **le premier compte qui accepte le règlement garde la place** : les autres comptes de cette connexion sont refusés en ranked pour toute la saison.

Plusieurs joueurs différents dans le même foyer ? Ouvre un ticket sur le [Discord]({discord}) : le staff peut autoriser le second compte.`,
    contenuEn: `One person plays a ranked season on **a single account**. On a given connection, **the first account to accept the rules keeps the spot**: the other accounts on that connection are refused in ranked for the whole season.

Several different players in the same household? Open a ticket on [Discord]({discord}): staff can allow the second account.`,
  },
  {
    categorie: 'ranked',
    titre: 'L’Elo',
    titreEn: 'Elo',
    contenu: `Chacun démarre à **1000** dans chaque mode classé. Un match fait gagner ou perdre **30 points au maximum**. On ne descend jamais sous **800**, et sous 1000 les pertes sont divisées par deux.

Ton **Elo global** est la **moyenne de tes 8 modes classés** ; un mode jamais joué compte pour 1000. C'est lui qui fait le classement du cashprize : pour être en haut, il faut jouer partout.

Aucun achat (grades, coins) ne donne le moindre avantage en ranked : les deux joueurs reçoivent exactement le même kit.`,
    contenuEn: `Everyone starts at **1000** in each ranked mode. A match wins or loses **30 points at most**. You never drop below **800**, and below 1000 losses are halved.

Your **global Elo** is the **average of your 8 ranked modes**; a mode never played counts as 1000. It decides the cashprize leaderboard: to be at the top, you have to play everywhere.

No purchase (ranks, coins) gives any advantage in ranked: both players receive exactly the same kit.`,
  },
  {
    categorie: 'ranked',
    titre: 'L’appariement',
    titreEn: 'Matchmaking',
    contenu: `La file cherche d'abord un adversaire à **±100 Elo**, puis élargit avec l'attente jusqu'à accepter n'importe qui. Tu ne retombes pas sur ton dernier adversaire tout de suite, sauf si vous êtes presque seuls en file.

Tu ne peux pas jouer **plus de 5 matchs classés par heure contre le même adversaire dans un même mode**.`,
    contenuEn: `The queue first looks for an opponent within **±100 Elo**, then widens with waiting time until anyone is accepted. You don't face your last opponent again right away, unless you are almost alone in the queue.

You can't play **more than 5 ranked matches per hour against the same opponent in the same mode**.`,
  },
  {
    categorie: 'ranked',
    titre: 'La fin d’un match',
    titreEn: 'How a match ends',
    contenu: `Le premier qui tombe a perdu. Au bout de **10 minutes**, c'est le joueur qui a **le plus de vie** qui gagne ; à égalité parfaite, le match est **nul** et personne ne gagne ni ne perd d'Elo.

Un plantage du serveur n'est jamais compté contre toi : le match est déclaré nul.`,
    contenuEn: `The first one to fall loses. After **10 minutes**, the player with **the most health** wins; on a perfect tie, the match is a **draw** and nobody wins or loses Elo.

A server crash is never held against you: the match is declared a draw.`,
  },
  {
    categorie: 'ranked',
    titre: 'Déconnexion et abandon',
    titreEn: 'Disconnecting and forfeiting',
    contenu: `**Déconnexion en plein match** : tu as un court délai pour revenir et reprendre là où tu en étais (une fois par match). Passé ce délai, c'est une **défaite**, Elo compris.

**Kick** par l'anticheat ou par le staff : **défaite immédiate**, sans délai.

**Abandon** : \`/leave\`, \`/spawn\`, \`/hub\`, \`/lobby\` ou toute téléportation hors de l'arène pendant un match classé = **défaite**.

**Abandon au lancement** (déconnexion ou commande pendant le décompte ou dans les 30 premières secondes) : au 2ᵉ en 12 heures, le match est **annulé** ; au 3ᵉ, **le ranked t'est fermé 2 heures**.`,
    contenuEn: `**Disconnecting mid-match**: you get a short window to come back and resume where you were (once per match). After that window, it's a **loss**, Elo included.

**Kicked** by the anticheat or by staff: **immediate loss**, no window.

**Forfeit**: \`/leave\`, \`/spawn\`, \`/hub\`, \`/lobby\` or any teleport out of the arena during a ranked match = **loss**.

**Forfeiting at the start** (disconnecting or using a command during the countdown or in the first 30 seconds): on the 2nd time within 12 hours, the match is **voided**; on the 3rd, **ranked is closed to you for 2 hours**.`,
  },
  {
    categorie: 'ranked',
    titre: 'Unranked, duels et entraînement',
    titreEn: 'Unranked, duels and training',
    contenu: `L'unranked, les \`/duel\`, les parties entre amis, les bots, le HG Run, les tournois et les modes hors classement (**Boxing, Iron Soup, BedFight, Classic**) **ne touchent jamais à ton Elo** ni au cashprize.

Tes statistiques unranked sont enregistrées et ont leurs propres règles (voir Intégrité).`,
    contenuEn: `Unranked, \`/duel\`, parties with friends, bots, HG Run, tournaments and the unranked modes (**Boxing, Iron Soup, BedFight, Classic**) **never touch your Elo** or the cashprize.

Your unranked stats are recorded and have their own rules (see Integrity).`,
  },

  /* ═══════════════════════════ MODES ═══════════════════════════ */
  {
    categorie: 'modes',
    titre: 'Les règles communes',
    titreEn: 'Common rules',
    contenu: `Les deux joueurs reçoivent **exactement le même kit**, retiré à la fin du match.

L'arène est indestructible : là où la construction est permise, tu ne casses **que les blocs posés pendant le match**, et une hauteur maximale de construction s'applique (ta barre d'action te prévient).

La perle et l'arc ne fonctionnent qu'après le décompte.`,
    contenuEn: `Both players receive **exactly the same kit**, removed at the end of the match.

The arena is indestructible: where building is allowed, you can only break **blocks placed during the match**, and a maximum build height applies (your action bar warns you).

Ender pearls and bows only work after the countdown.`,
  },
  {
    categorie: 'modes',
    titre: 'HG',
    titreEn: 'HG',
    contenu: `Épée en diamant, armure en fer, soupes, seaux et blocs. **Aucune régénération naturelle ni faim** : la vie ne remonte qu'avec la soupe. Murs, tours et pièges à lave sont permis avec tes blocs.`,
    contenuEn: `Diamond sword, iron armour, soups, buckets and blocks. **No natural regeneration and no hunger**: health only comes back with soup. Walls, towers and lava traps are allowed with your blocks.`,
  },
  {
    categorie: 'modes',
    titre: 'Digger',
    titreEn: 'Digger',
    contenu: `Le kit HG avec des outils en fer, dans un combat vertical : on pose, on creuse, et **l'arène se remet à neuf toutes les 90 secondes** en plein duel. **Sortir de l'arène par le haut = défaite immédiate.**`,
    contenuEn: `The HG kit with iron tools, in a vertical fight: you build, you dig, and **the arena resets every 90 seconds** mid-duel. **Leaving the arena over the top = immediate loss.**`,
  },
  {
    categorie: 'modes',
    titre: 'CaveUHC',
    titreEn: 'CaveUHC',
    contenu: `Un duel UHC dans une grotte : stuff en diamant, pommes d'or, canne à pêche, seaux, briquet et outils. **Pas de régénération naturelle** : la vie remonte avec les pommes d'or.`,
    contenuEn: `A UHC duel in a cave: diamond gear, golden apples, fishing rod, buckets, flint and steel and tools. **No natural regeneration**: health comes back with golden apples.`,
  },
  {
    categorie: 'modes',
    titre: 'UHC',
    titreEn: 'UHC',
    contenu: `Stuff en diamant et en fer, arc, pommes d'or, seaux et blocs. **La faim est active et il n'y a pas de régénération naturelle.**`,
    contenuEn: `Diamond and iron gear, bow, golden apples, buckets and blocks. **Hunger is on and there is no natural regeneration.**`,
  },
  {
    categorie: 'modes',
    titre: 'BuildUHC',
    titreEn: 'BuildUHC',
    contenu: `Stuff en diamant, arc, canne à pêche, pommes d'or, blocs et seaux : on construit pour prendre l'avantage. **La faim est active et il n'y a pas de régénération naturelle.**`,
    contenuEn: `Diamond gear, bow, fishing rod, golden apples, blocks and buckets: you build to get the upper hand. **Hunger is on and there is no natural regeneration.**`,
  },
  {
    categorie: 'modes',
    titre: 'NoDebuff',
    titreEn: 'NoDebuff',
    contenu: `Stuff en diamant, potions de soin et une perle (**15 secondes de recharge**). Pas de blocs. **La régénération naturelle est active**, avec résistance au feu.`,
    contenuEn: `Diamond gear, healing potions and an ender pearl (**15-second cooldown**). No blocks. **Natural regeneration is on**, with fire resistance.`,
  },
  {
    categorie: 'modes',
    titre: 'Archer',
    titreEn: 'Archer',
    contenu: `Arc et flèches, armure en cuir. Pas de blocs : tout se joue à la précision.`,
    contenuEn: `Bow and arrows, leather armour. No blocks: it's all about accuracy.`,
  },
  {
    categorie: 'modes',
    titre: 'SkyWars',
    titreEn: 'SkyWars',
    contenu: `Chacun sur son île au-dessus du vide, avec stuff, blocs, perle, toile et seaux. **Tomber dans le vide = mort.** La faim et la régénération naturelle sont actives.`,
    contenuEn: `Each player on an island above the void, with gear, blocks, an ender pearl, cobweb and buckets. **Falling into the void = death.** Hunger and natural regeneration are on.`,
  },

  /* ═══════════════════════════ CASHPRIZE ═══════════════════════════ */
  {
    categorie: 'cashprize',
    titre: 'La compétition',
    titreEn: 'The competition',
    contenu: `À chaque saison, **100 €** sont répartis entre les **3 premiers de l'Elo global** : 1ᵉʳ **50 €** · 2ᵉ **30 €** · 3ᵉ **20 €**.

La **saison 2** va du **samedi 17 octobre 2026 à 14h30** au **dimanche 15 novembre 2026 à 23h00** (heure de Paris). Le classement est **figé à la seconde de la clôture**, puis l'Elo repart à 1000. Les coins, les grades et les cosmétiques ne sont jamais remis à zéro.`,
    contenuEn: `Every season, **€100** is shared between the **top 3 of the global Elo**: 1st **€50** · 2nd **€30** · 3rd **€20**.

**Season 2** runs from **Saturday 17 October 2026 at 2:30 PM** to **Sunday 15 November 2026 at 11:00 PM** (Paris time). The leaderboard is **frozen at the exact second of closing**, then Elo goes back to 1000. Coins, ranks and cosmetics are never reset.`,
  },
  {
    categorie: 'cashprize',
    titre: 'Être éligible',
    titreEn: 'Eligibility',
    contenu: `Pour recevoir un prix, il faut à la clôture : **ne porter aucune sanction en cours**, **ne pas être exclu du classement**, et avoir **lié son compte Discord** (\`/discord\` en jeu) — c'est par là que les gagnants sont contactés.

En cas d'égalité parfaite, le joueur qui a disputé **le plus de matchs classés** passe devant.`,
    contenuEn: `To receive a prize, at closing you must: **have no active sanction**, **not be excluded from the leaderboard**, and have **linked your Discord account** (\`/discord\` in game) — that's how winners are contacted.

On a perfect tie, the player with **the most ranked matches** goes first.`,
  },
  {
    categorie: 'cashprize',
    titre: 'Vérification et versement',
    titreEn: 'Review and payout',
    contenu: `Après la clôture, le staff **vérifie le top 3 pendant 3 jours** (replays des matchs, comptes, connexions) avant de valider les gagnants.

Les gagnants validés sont contactés **sur Discord** et ont **30 jours** pour réclamer leur prix. Passé ce délai, il est perdu. Le moyen de paiement est convenu avec le gagnant ; pour un mineur, l'accord d'un représentant légal est demandé. Le prix est **personnel** : il ne peut être versé à un tiers.`,
    contenuEn: `After closing, staff **reviews the top 3 for 3 days** (match replays, accounts, connections) before confirming the winners.

Confirmed winners are contacted **on Discord** and have **30 days** to claim their prize. After that, it is lost. The payment method is agreed with the winner; for a minor, a legal guardian's consent is required. The prize is **personal**: it can't be paid to someone else.`,
  },
  {
    categorie: 'cashprize',
    titre: 'Ce qui peut te priver du prix',
    titreEn: 'What can cost you the prize',
    contenu: `La triche, le boost d'Elo, les matchs arrangés, le multi-compte, le partage de compte, le contournement de la vérification de connexion, l'exploitation d'un bug, une sanction en cours à la clôture, un compte Discord non lié, ou une réclamation faite plus de 30 jours après la validation.

Si un joueur du top 3 est disqualifié, **son prix revient au joueur suivant** au classement.`,
    contenuEn: `Cheating, Elo boosting, fixed matches, multi-accounting, account sharing, bypassing the connection check, abusing a bug, an active sanction at closing, an unlinked Discord account, or a claim made more than 30 days after confirmation.

If a top-3 player is disqualified, **their prize goes to the next player** on the leaderboard.`,
  },

  /* ═══════════════════════════ INTÉGRITÉ ═══════════════════════════ */
  {
    categorie: 'integrite',
    titre: 'Boost d’Elo',
    titreEn: 'Elo boosting',
    contenu: `Gonfler artificiellement un Elo, le tien ou celui d'un autre : adversaire complice, service rendu ou payé, comptes qui se renvoient les victoires, abandons volontaires.

**Sanction :** matchs annulés, exclusion du classement et perte du cashprize.`,
    contenuEn: `Artificially inflating an Elo, yours or someone else's: an accomplice opponent, a favour or a paid service, accounts passing wins to each other, deliberate forfeits.

**Sanction:** matches voided, removal from the leaderboard and loss of the cashprize.`,
  },
  {
    categorie: 'integrite',
    titre: 'Chute d’Elo volontaire',
    titreEn: 'Deliberate Elo dropping',
    contenu: `Perdre exprès pour descendre, que ce soit pour affronter des adversaires plus faibles ensuite ou pour faire monter quelqu'un d'autre.

**Sanction :** exclusion du classement.`,
    contenuEn: `Losing on purpose to drop down, either to face weaker opponents later or to push someone else up.

**Sanction:** removal from the leaderboard.`,
  },
  {
    categorie: 'integrite',
    titre: 'Matchs arrangés et files synchronisées',
    titreEn: 'Fixed matches and synced queues',
    contenu: `S'entendre sur l'issue d'un match classé ou sur la manière de le jouer, ou entrer en file en même temps qu'un ami pour tomber l'un sur l'autre et choisir qui gagne.

**Sanction :** exclusion du classement pour les deux joueurs.`,
    contenuEn: `Agreeing on the outcome of a ranked match or how to play it, or queueing at the same time as a friend to land on each other and pick the winner.

**Sanction:** removal from the leaderboard for both players.`,
  },
  {
    categorie: 'integrite',
    titre: 'Multi-compte et partage de compte',
    titreEn: 'Multi-accounting and account sharing',
    contenu: `Jouer en ranked sur plusieurs comptes, faire jouer quelqu'un d'autre sur ton compte (gratuitement ou contre de l'argent), ou jouer sur le compte d'un autre.

**Sanction :** exclusion du classement de tous les comptes concernés, bannissement en cas de récidive. Le compte reste responsable de ce qui est fait avec lui.`,
    contenuEn: `Playing ranked on several accounts, letting someone else play on your account (for free or for money), or playing on someone else's account.

**Sanction:** removal from the leaderboard for every account involved, ban on repeat. An account is responsible for whatever is done with it.`,
  },
  {
    categorie: 'integrite',
    titre: 'Contourner la vérification de connexion',
    titreEn: 'Bypassing the connection check',
    contenu: `Utiliser un VPN, un proxy ou la connexion de quelqu'un d'autre pour passer la vérification de connexion ou la règle d'un seul compte par connexion.

**Sanction :** exclusion du classement.`,
    contenuEn: `Using a VPN, a proxy or someone else's connection to get past the connection check or the one-account-per-connection rule.

**Sanction:** removal from the leaderboard.`,
  },
  {
    categorie: 'integrite',
    titre: 'Fuite, temporisation et camping',
    titreEn: 'Running, stalling and camping',
    contenu: `Courir sans chercher le combat, ou se retrancher dans une zone difficile d'accès, uniquement pour faire traîner le match et gagner au temps.

**Sanction :** match annulé, puis exclusion du classement en cas de répétition.`,
    contenuEn: `Running without looking for the fight, or hiding in a hard-to-reach spot, only to drag the match out and win on time.

**Sanction:** match voided, then removal from the leaderboard on repeat.`,
  },
  {
    categorie: 'integrite',
    titre: 'Stream sniping',
    titreEn: 'Stream sniping',
    contenu: `Regarder le direct d'un adversaire pendant un match pour connaître sa position, son stuff ou sa vie.

**Sanction :** exclusion du classement.`,
    contenuEn: `Watching an opponent's live stream during a match to know their position, gear or health.

**Sanction:** removal from the leaderboard.`,
  },
  {
    categorie: 'integrite',
    titre: 'Gonflage des stats unranked',
    titreEn: 'Inflating unranked stats',
    contenu: `Enchaîner des matchs unranked arrangés pour faire grimper ses victoires, ses niveaux ou sa qualification au ranked.

**Sanction :** remise à zéro des statistiques concernées.`,
    contenuEn: `Chaining fixed unranked matches to inflate wins, levels or ranked qualification.

**Sanction:** reset of the stats involved.`,
  },
  {
    categorie: 'integrite',
    titre: 'Équipe et sabotage',
    titreEn: 'Teaming and sabotage',
    contenu: `Dans les modes à plusieurs (party, 2v2, tournois, événements, HG) : s'allier au-delà de la taille d'équipe autorisée, ou saboter sa propre équipe.

**Sanction :** disqualification de l'événement, exclusion en cas de répétition.`,
    contenuEn: `In multiplayer modes (party, 2v2, tournaments, events, HG): teaming beyond the allowed team size, or sabotaging your own team.

**Sanction:** disqualification from the event, removal on repeat.`,
  },

  /* ═══════════════════════════ SANCTIONS ═══════════════════════════ */
  {
    categorie: 'sanctions',
    titre: 'Triche — tolérance zéro',
    titreEn: 'Cheating — zero tolerance',
    contenu: `Tout client, module, macro ou matériel donnant un avantage en combat est interdit : **killaura**, **reach**, **autoclicker**, **autosoup**, **fly**, **speed**, **anti-knockback**, **x-ray** et assimilés.

**Sanction :** bannissement définitif, Elo annulé et cashprize perdu — y compris si la triche est découverte **après** la fin de la saison.`,
    contenuEn: `Any client, module, macro or hardware giving a combat advantage is forbidden: **killaura**, **reach**, **autoclicker**, **autosoup**, **fly**, **speed**, **anti-knockback**, **x-ray** and the like.

**Sanction:** permanent ban, Elo voided and cashprize lost — including if the cheating is found **after** the season ends.`,
  },
  {
    categorie: 'sanctions',
    titre: 'L’anticheat automatique',
    titreEn: 'The automatic anticheat',
    contenu: `L'anticheat du serveur sanctionne tout seul les détections les plus sûres par un **bannissement temporaire**, de plus en plus long à chaque récidive (de **1 jour à 30 jours**). Le staff peut ensuite le transformer en bannissement définitif si la triche est confirmée.`,
    contenuEn: `The server's anticheat punishes its most reliable detections on its own with a **temporary ban**, longer on each repeat (from **1 day to 30 days**). Staff can then turn it into a permanent ban if the cheating is confirmed.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Ce qui est autorisé',
    titreEn: 'What is allowed',
    contenu: `Optifine, les clients PvP (Lunar, Badlion…) sans module interdit, et les packs de textures.

Dans le doute sur un mod, demande **avant** sur le [Discord]({discord}) : une réponse du staff fait foi.`,
    contenuEn: `Optifine, PvP clients (Lunar, Badlion…) without forbidden modules, and texture packs.

Unsure about a mod? Ask **before** on [Discord]({discord}): a staff answer is binding.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Manipulation du ping',
    titreEn: 'Ping manipulation',
    contenu: `Fausser volontairement sa latence — lag switch, bridage de connexion — pour perturber les coups reçus ou donnés.

**Sanction :** bannissement, comme pour la triche.`,
    contenuEn: `Deliberately faking your latency — lag switch, throttling — to disrupt hits taken or given.

**Sanction:** ban, same as cheating.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Exploitation d’un bug',
    titreEn: 'Bug abuse',
    contenu: `Utiliser un bug du serveur ou du client pour gagner, monter, ou perturber un match — quelle que soit son ampleur. Signaler un bug ne coûte rien ; l'exploiter coûte le classement.

**Sanction :** annulation des gains, exclusion du classement, bannissement si c'est répété.`,
    contenuEn: `Using a server or client bug to win, climb, or disrupt a match — however small. Reporting a bug costs nothing; abusing it costs your ranking.

**Sanction:** gains voided, removal from the leaderboard, ban on repeat.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Les matchs sont enregistrés',
    titreEn: 'Matches are recorded',
    contenu: `**Tous les matchs sont enregistrés** et peuvent être revus par le staff pour vérifier une détection, un signalement ou le top 3 en fin de saison. Ces enregistrements font foi.

Tu peux revoir les tiens en jeu avec \`/matchs\`.`,
    contenuEn: `**Every match is recorded** and can be reviewed by staff to check a detection, a report or the top 3 at the end of the season. These recordings are authoritative.

You can watch yours in game with \`/matchs\`.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Le screenshare',
    titreEn: 'Screenshare',
    contenu: `Un membre du staff peut demander une **vérification d'écran** (screenshare) à tout moment. L'outil est public et son fonctionnement est expliqué sur la page [Screenshare](/ljscan).

Refuser, se déconnecter, redémarrer sa machine ou effacer des fichiers pendant la vérification vaut aveu.

**Sanction :** bannissement pour refus de vérification.`,
    contenuEn: `A staff member can ask for a **screen check** (screenshare) at any time. The tool is public and explained on the [Screenshare](/ljscan) page.

Refusing, disconnecting, rebooting or deleting files during the check counts as an admission.

**Sanction:** ban for refusing the check.`,
  },
  {
    categorie: 'sanctions',
    titre: 'Contournement de sanction',
    titreEn: 'Ban evasion',
    contenu: `Revenir sur le serveur avec un autre compte, une autre adresse ou un VPN pendant une sanction.

**Sanction :** la sanction d'origine redémarre à zéro et devient définitive en cas de récidive.`,
    contenuEn: `Coming back to the server with another account, another address or a VPN while sanctioned.

**Sanction:** the original sanction restarts from zero and becomes permanent on repeat.`,
  },
  {
    categorie: 'sanctions',
    titre: 'L’exclusion du classement',
    titreEn: 'Leaderboard removal',
    contenu: `L'exclusion sort un joueur de la compétition **sans le sortir du serveur** : il continue de jouer, mais n'apparaît plus au classement, en jeu comme sur ce site, et ne concourt plus pour le cashprize. Selon la gravité, elle est **temporaire** (quelques heures ou quelques jours) ou **valable toute la saison**.

Quand un tricheur est banni, l'Elo que tu as perdu contre lui peut t'être rendu : demande-le par ticket sur le [Discord]({discord}).`,
    contenuEn: `Removal takes a player out of the competition **without taking them off the server**: they keep playing, but no longer appear on the leaderboard, in game or on this site, and no longer compete for the cashprize. Depending on severity, it is **temporary** (a few hours or days) or **for the whole season**.

When a cheater is banned, the Elo you lost against them can be given back: ask for it in a ticket on [Discord]({discord}).`,
  },
  {
    categorie: 'sanctions',
    titre: 'Le doute, et comment il est tranché',
    titreEn: 'Doubt, and how it is settled',
    contenu: `Un faisceau d'indices sérieux et concordants (replays, connexions, comptes) suffit à écarter un joueur de la compétition, même sans preuve formelle. Être très fort, jouer beaucoup ou utiliser un client PvP autorisé n'est jamais un motif à lui seul.

Tu as droit au **motif** de la sanction et à une réponse du staff sur le [Discord]({discord}).`,
    contenuEn: `A set of serious, consistent clues (replays, connections, accounts) is enough to remove a player from the competition, even without formal proof. Being very good, playing a lot or using an allowed PvP client is never a reason on its own.

You are entitled to the **reason** for the sanction and to a staff answer on [Discord]({discord}).`,
  },
  {
    categorie: 'sanctions',
    titre: 'Contester une sanction',
    titreEn: 'Appealing a sanction',
    contenu: `Une sanction se conteste sur le [Discord]({discord}), par ticket, avec ton pseudo et la date. Les décisions ne se discutent pas en jeu ni en message privé à un modérateur.`,
    contenuEn: `A sanction is appealed on [Discord]({discord}), through a ticket, with your username and the date. Decisions are not discussed in game or in a private message to a moderator.`,
  },

  /* ═══════════════════════════ SERVEUR ═══════════════════════════ */
  {
    categorie: 'serveur',
    titre: 'Respect',
    titreEn: 'Respect',
    contenu: `Les insultes, le harcèlement et l'acharnement sur un joueur n'ont pas leur place, en jeu comme sur le Discord. Perdre un match n'autorise rien.

**Sanction :** mute, puis bannissement temporaire.`,
    contenuEn: `Insults, harassment and targeting a player have no place here, in game or on Discord. Losing a match excuses nothing.

**Sanction:** mute, then temporary ban.`,
  },
  {
    categorie: 'serveur',
    titre: 'Propos haineux',
    titreEn: 'Hate speech',
    contenu: `Viser un joueur sur son origine, sa couleur de peau, sa religion, son genre ou son orientation.

**Sanction :** bannissement, sans avertissement.`,
    contenuEn: `Targeting a player for their origin, skin colour, religion, gender or orientation.

**Sanction:** ban, without warning.`,
  },
  {
    categorie: 'serveur',
    titre: 'Menaces et informations privées',
    titreEn: 'Threats and private information',
    contenu: `Souhaiter du mal à quelqu'un, menacer de s'en prendre à lui ou à sa connexion (DDoS), ou partager son identité, son adresse, ses photos ou toute information privée sans son accord.

**Sanction :** bannissement définitif.`,
    contenuEn: `Wishing harm on someone, threatening them or their connection (DDoS), or sharing their identity, address, photos or any private information without consent.

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
    titre: 'Pseudo et skin',
    titreEn: 'Username and skin',
    contenu: `Un pseudo ou un skin offensant, explicite ou usurpant l'identité d'un membre du staff est refusé.

**Sanction :** changement imposé, puis bannissement jusqu'au changement.`,
    contenuEn: `An offensive or explicit username or skin, or one impersonating a staff member, is refused.

**Sanction:** forced change, then ban until changed.`,
  },
  {
    categorie: 'serveur',
    titre: 'Signalements',
    titreEn: 'Reports',
    contenu: `Signale un tricheur avec \`/report\` plutôt que dans le chat public : une accusation publique ne sert à rien. Les signalements inventés ou répétés pour nuire sont sanctionnés.`,
    contenuEn: `Report a cheater with \`/report\` rather than in public chat: a public accusation achieves nothing. False or repeated reports meant to harm are sanctioned.`,
  },
  {
    categorie: 'serveur',
    titre: 'Évolution du règlement',
    titreEn: 'Changes to the rules',
    contenu: `Le règlement peut évoluer entre deux saisons ; toute modification est annoncée sur le [Discord]({discord}).

Les règles applicables à une saison sont celles publiées **à son ouverture** : une modification en cours de saison ne s'applique jamais rétroactivement au classement en cours.

En acceptant le règlement en jeu, tu acceptes cette page.`,
    contenuEn: `The rules may change between seasons; every change is announced on [Discord]({discord}).

The rules that apply to a season are the ones published **at its opening**: a change during a season never applies retroactively to the current leaderboard.

By accepting the rules in game, you accept this page.`,
  },
]

const go = process.argv[2] === 'go'
const prisma = new PrismaClient()
console.log(`${S.length} sections (${[...new Set(S.map((s) => s.categorie))].join(', ')})`)
if (go) {
  await prisma.$transaction([
    prisma.sectionReglement.deleteMany({}),
    prisma.sectionReglement.createMany({ data: S.map((s, ordre) => ({ ...s, ordre, publie: true })) }),
  ])
  console.log('écrit')
} else {
  for (const s of S) console.log(`[${s.categorie}] ${s.titre}`)
}
await prisma.$disconnect()
