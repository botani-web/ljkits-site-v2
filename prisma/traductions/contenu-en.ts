/**
 * La version anglaise du reste du contenu éditorial : règlement, grades,
 * packs, formulaire de recrutement.
 *
 * Les clés sont le TEXTE FRANÇAIS (ou le slug quand il en existe un), pas
 * l'identifiant en base : les identifiants sont des cuid générés, ils
 * changeraient à la prochaine remise à zéro alors que le titre, lui, est
 * ce qu'un humain relira. Le script d'application signale toute clé qui ne
 * correspond à rien — une faute de frappe ne passe pas en silence.
 */

/** Sections du règlement, par titre français. */
export const REGLEMENT_EN: Record<string, { titre: string; contenu: string }> = {
  'La compétition': {
    titre: 'The competition',
    contenu: `Every month, **150 € are shared between the top 5** of the Elo leaderboard.

Everyone starts at **1000 Elo**. Beating a higher-ranked player earns a lot, beating a lower-ranked one earns little — and the reverse for defeats. What you gain, your opponent loses: the total never moves.

> **Split:** 1st **60 €** · 2nd **35 €** · 3rd **25 €** · 4th **20 €** · 5th **10 €**

The season ends on the **1st of each month at 00:00** (Paris time). The leaderboard is frozen at that exact moment, then everyone restarts at 1000 Elo.

Kits, cosmetics and coins are **never reset**. Only Elo is.`,
  },

  'Être éligible au cashprize': {
    titre: 'Being eligible for the cashprize',
    contenu: `Three conditions, all required:

> **1.** Have fought at least **100 ranked fights** during the season.
> **2.** Have **linked your Discord account** — type \`/discord\` in game. Without it you play and progress normally, but you **do not appear on the leaderboard**.
> **3.** Have **no active sanction** at the time the season closes.

The 100 fights rule out an account created the day before the season ends. They are counted in **ranked fights**, not kills: a death counts as much as a kill.

In case of a **perfect Elo tie**, the player with the **most fights** comes first. If the tie remains, whoever reached that Elo **first**.`,
  },

  'Ce qui compte comme combat classé': {
    titre: 'What counts as a ranked fight',
    contenu: `A fight only moves Elo if **all** of these conditions are met:

> **Both players are in ranked mode.** If either has turned it off, the fight counts for nobody.
> **Both players have an active kit.** Killing someone who has not taken their kit yet earns nothing — and costs them nothing.
> **It is not a suicide.** \`/suicide\`, falls and the void count neither as a death nor as a kill.

These rules apply **both ways**. An unarmed player cannot become a point dispenser, and turning off your ranked mode does not let you make others lose without risking anything.

The action bar tells you every time a fight did not count, and why.`,
  },

  'Le mode ranked': {
    titre: 'Ranked mode',
    contenu: `You can **turn your Elo off** to play with friends without risking your rank: type \`/ranked\`, or use your in-game profile.

> **The change is only possible at spawn.** You cannot cut your Elo mid-fight when a duel goes badly — you have to die and come back.
> **No switching in combat**, nor within the 10 seconds following a hit given or taken.
> **5 minutes minimum** between two changes.

A fight is only ranked if **both players** are ranked. Turning yours off does not only protect you: it also cancels your opponent's gain.`,
  },

  'Anti-farm': {
    titre: 'Anti-farm',
    contenu: `Killing the same person again earns less and less: **half** on the 2nd kill, **a quarter** on the 3rd, then **nothing at all** for two hours.

The same coefficient applies **to the loss**. Being killed on repeat by a friend does not drain your Elo, but it does not fill theirs either.

> Arranging your way up the leaderboard does not work, and never has.`,
  },

  'Arrangements et boost de classement': {
    titre: 'Arranged fights and rank boosting',
    contenu: `The following are **forbidden**, and lead to **disqualification from the season**:

> **Arranged fights** — trading kills in turn, letting yourself be killed on purpose.
> **Alt accounts**, whatever the use: feeding yourself points, inflating your fight count, taking two places in the top 5.
> **Account sharing.** The leaderboard rewards a player, not a username.
> **Deliberately refusing to fight** to protect a placing at the end of a season.

The server records **every fight**: both kits, the Elo exchanged, the time and the health left. An abnormal pattern shows up in the data, even if nobody reports it.`,
  },

  'Triche — tolérance zéro': {
    titre: 'Cheating — zero tolerance',
    contenu: `Any client or module giving an advantage in combat is **forbidden**: **killaura**, **reach**, **autoclicker**, **anti-knockback**, **velocity**, **aimbot**, **backtrack**, **autosoup**, **x-ray**, and the like.

> **Allowed:** Optifine, PvP clients (Lunar, Badlion, CheatBreaker…) without forbidden modules, texture packs.

> **Sanction:** permanent ban, without warning. **Elo is voided and the cashprize lost**, including if the cheating is discovered after the season has ended.

A player excluded for cheating is removed from the leaderboard, and **the placings below move up**.`,
  },

  'Bugs et exploits': {
    titre: 'Bugs and exploits',
    contenu: `Found a bug? **Report it on [Discord]({discord})** — useful reports are rewarded.

Exploiting it to your advantage means a **guaranteed sanction**. Using a bug to gain Elo leads to the **cancellation of the gains concerned** and, depending on the scale, disqualification.`,
  },

  'Le versement du cashprize': {
    titre: 'Paying out the cashprize',
    contenu: `Winners are contacted **on Discord**, on the account linked to their username — which is exactly why linking is required.

> **Claim window: 30 days** after the end of the season. After that, the prize is forfeited.
> **Minors:** the agreement of a legal guardian is required before any payment.
> The payment method is agreed with the winner (PayPal or gift card).

The prize is **personal and non-transferable**. It cannot be paid to a third party, nor exchanged for in-game advantages.

If a winner is disqualified, **their prize goes to the next player** on the leaderboard.`,
  },

  'Un seul joueur, un seul compte': {
    titre: 'One player, one account',
    contenu: `Getting around a ban with another account turns a temporary ban into a **permanent** one.

Only one account per person takes part in the leaderboard. If several accounts are traced to the same player, **all of them** are removed from the season's leaderboard.`,
  },

  Respect: {
    titre: 'Respect',
    contenu: `Trash talk is part of PvP, personal attacks are not. The following are sanctioned: **targeted and repeated insults**, **racism**, **homophobia**, **harassment**, **threats** — in game as well as on Discord.

Offensive usernames and skins are **forbidden**.

A behaviour sanction **active at the season close** makes you ineligible for the cashprize.`,
  },

  Chat: {
    titre: 'Chat',
    contenu: `No **advertising** for other servers, no **spam**, no **flooding**.

The chat is in French or in English.`,
  },

  'Le staff et les litiges': {
    titre: 'Staff and disputes',
    contenu: `Staff decisions apply **immediately**.

Disagree with a sanction, or with a leaderboard result? **Open a ticket on [Discord]({discord})** — not a debate in the server chat.

Any dispute related to the season must be filed **before the end of the 30 day** claim window. Staff decide based on the fight history recorded by the server, which is authoritative.`,
  },

  'Évolution du règlement': {
    titre: 'Changes to these rules',
    contenu: `These rules may change between two seasons. Any change is announced on **[Discord]({discord})** before it takes effect.

The rules applying to a season are those published **when it opened**: a change made during a season never applies retroactively to the leaderboard in progress.

By taking part in the leaderboard, you accept these rules.`,
  },
}

/** Grades, par slug. Le nom (Ronin, Samouraï, Shogun) ne se traduit pas. */
export const GRADES_EN: Record<
  string,
  { sousTitre: string; etiquette: string; avantages: string[] }
> = {
  ronin: {
    sousTitre: 'the masterless',
    etiquette: '+15 % coins',
    avantages: [
      '+15 % coins on every kill, for life',
      'Your name in white with the ❀ symbol in chat and tab',
      'Reserved role and channel on Discord',
      'Your name on the supporters hologram, at spawn',
    ],
  },
  samourai: {
    sousTitre: 'the one who serves',
    etiquette: '+30 % coins',
    avantages: [
      '+30 % coins on every kill, for life',
      'Your name in gold: the most visible colour in chat',
      'Everything the Ronin gives',
    ],
  },
  shogun: {
    sousTitre: 'the commander',
    etiquette: '+50 % coins',
    avantages: [
      '+50 % coins on every kill, for life',
      'Your name in purple, reserved for the highest rank',
      'The highest multiplier on the server',
      'Everything the Samurai gives',
      'The Hitsugi kit, exclusive to the rank',
    ],
  },
}

/** Packs, par slug. */
export const PACKS_EN: Record<string, { nom: string; description: string }> = {
  'pack-kits-exclusifs': {
    nom: 'The six exclusive kits',
    description: 'The full pack, unlocked on your account in one go.',
  },
  'coins-poignee': {
    nom: 'A handful',
    description: 'Two or three classic kits, enough to vary your game.',
  },
  'coins-bourse': {
    nom: 'A purse',
    description: 'Any one of the sixteen exclusives, or five classic kits.',
  },
  'coins-coffret': {
    nom: 'A casket',
    description: 'Three quarters of the classic catalogue, or three exclusives.',
  },
  'coins-coffre': {
    nom: 'A chest',
    description: 'Eight exclusives. Half of what can be unlocked on the server.',
  },
  'coins-tresor': {
    nom: 'A treasure',
    description: 'Everything. All thirty-nine kits, exclusives included, and change to spare.',
  },
}

/** Sections du formulaire de recrutement, par nom français. */
export const SECTIONS_RECRUTEMENT_EN: Record<string, string> = {
  Identité: 'Identity',
  Disponibilité: 'Availability',
  'Connaissance du serveur': 'Knowledge of the server',
  'Mises en situation': 'Scenarios',
  Expérience: 'Experience',
  Motivation: 'Motivation',
  Libre: 'Open',
}

/** Questions du recrutement, par intitulé français. */
export const QUESTIONS_RECRUTEMENT_EN: Record<
  string,
  { libelle: string; aide?: string }
> = {
  'Dans quel pays vis-tu, et à quel fuseau horaire ?': {
    libelle: 'What country do you live in, and in which time zone?',
    aide: 'For example: France, UTC+1. We use it to know when you are around.',
  },
  'Depuis quand joues-tu sur LJKITS ?': {
    libelle: 'How long have you been playing on LJKITS?',
    aide: 'A rough date is enough.',
  },
  'As-tu déjà été staff sur un autre serveur ?': {
    libelle: 'Have you ever been staff on another server?',
    aide: 'If yes: which one, what role, how long, and why you left. If not, just say so — it does not count against you.',
  },
  'Pourquoi veux-tu rejoindre le staff de LJKITS ?': {
    libelle: 'Why do you want to join the LJKITS staff?',
  },
  'Quelque chose à ajouter ?': {
    libelle: 'Anything to add?',
  },
  'Qu’est-ce que le soup PvP, et pourquoi ce serveur-là ?': {
    libelle: 'What is soup PvP, and why this server in particular?',
  },
  'Un joueur insulte un autre joueur dans le chat général. Que fais-tu, concrètement ?': {
    libelle: 'A player insults another player in the main chat. What do you do, concretely?',
  },
  'Quel est ton kit principal, et qu’est-ce qui te plaît dedans ?': {
    libelle: 'What is your main kit, and what do you like about it?',
  },
  'Combien d’heures par semaine peux-tu consacrer au staff ?': {
    libelle: 'How many hours a week can you give to the staff role?',
    aide: 'Be realistic. Three hours actually delivered beat ten promised.',
  },
  'Tu soupçonnes un joueur de tricher, mais tu n’as aucune preuve. Que fais-tu ?': {
    libelle: 'You suspect a player of cheating, but you have no proof. What do you do?',
  },
  'Qu’apportes-tu que les autres candidats n’apportent pas ?': {
    libelle: 'What do you bring that other applicants do not?',
  },
  'As-tu déjà été sanctionné sur un serveur Minecraft ?': {
    libelle: 'Have you ever been sanctioned on a Minecraft server?',
    aide: 'An honest answer does not disqualify you. A lie that comes out does.',
  },
  'As-tu un micro en état de marche ?': {
    libelle: 'Do you have a working microphone?',
    aide: 'Staff talk in voice chat for quick decisions.',
  },
  'S’il y avait une chose à changer sur LJKITS, laquelle ?': {
    libelle: 'If there were one thing to change on LJKITS, what would it be?',
    aide: 'A well-argued criticism interests us more than a compliment.',
  },
  'Un joueur t’accuse publiquement d’abus de pouvoir dans le chat. Que fais-tu ?': {
    libelle: 'A player publicly accuses you of abusing your powers in chat. What do you do?',
  },
  'Quels sont tes créneaux habituels ?': {
    libelle: 'What are your usual time slots?',
    aide: 'Days and hours, even roughly.',
  },
  'Un ami à toi enfreint le règlement sous tes yeux. Que fais-tu ?': {
    libelle: 'A friend of yours breaks the rules right in front of you. What do you do?',
  },
  'Un joueur ouvre un ticket : il a payé un grade et ne l’a pas reçu. Que fais-tu ?': {
    libelle: 'A player opens a ticket: they paid for a rank and did not receive it. What do you do?',
  },
}
