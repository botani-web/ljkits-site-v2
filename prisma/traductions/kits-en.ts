/**
 * La version anglaise des fiches de kits.
 *
 * Séparée du seed pour une raison simple : le français reste la source, et
 * l'anglais est une couche par-dessus. Une entrée absente ici n'est pas une
 * erreur — le site retombe sur le français, il ne casse pas.
 *
 * `caracteristiques` suit l'ORDRE des caractéristiques françaises, pas leur
 * libellé : deux caractéristiques peuvent porter le même libellé, et un
 * appariement par texte se romprait à la première retouche en admin. Le
 * script d'application vérifie que les deux listes ont la même longueur.
 */
export type TraductionKit = {
  role: string
  descriptionCourte: string
  descriptionLongue: string
  caracteristiques: { libelle: string; valeur: string }[]
}

export const KITS_EN: Record<string, TraductionKit> = {
  pvp: {
    role: 'Fundamental',
    descriptionCourte:
      'A sword, soups, nothing else. Whoever wins with PvP wins with anything.',
    descriptionLongue: `The starter kit, and the only one that never does the work for you: a stone sword, an inventory full of soups, no ability.

Everything you do with PvP comes from your **aim**, your **soup timing** and how you read knockback. It is the reference kit — the one every other kit is measured against.

If you are new to LJKITS, stay on it until the 1.8 soup reflexes are yours. The rest follows on its own.`,
    caracteristiques: [
      { libelle: 'Ability', valeur: 'None' },
      { libelle: 'Inventory', valeur: 'Sword + soups' },
    ],
  },

  antistomper: {
    role: 'Tank',
    descriptionCourte: 'No fall damage, no stomp damage',
    descriptionLongue: `He takes no fall damage, and the Stomper who lands on him gets nothing. On a map of floating islands where everyone is falling all the time, that is a calm that changes how you move.

The direct counter to one specific kit, free so that nobody is left without an answer.`,
    caracteristiques: [
      { libelle: 'Fall', valeur: 'Cancelled' },
      { libelle: 'Stomp taken', valeur: 'Cancelled' },
      { libelle: 'Price', valeur: 'Free' },
    ],
  },

  archer: {
    role: 'Ranged',
    descriptionCourte:
      'A bow and a full quiver. You harass, you finish, you do not hold the melee.',
    descriptionLongue: `A bow and sixty-four arrows. Fully drawn, an arrow takes about **2.7 ❤** — enough to finish a target already worn down, never enough to kill a healthy one.

The Archer plays on the edges: you open other people's fights, you punish those who drink their soup in the open, and you break off the moment someone closes in.

In melee you only have the basic sword and no advantage at all. Keeping your distance is not a playstyle here, it is the condition for the kit to work.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Bow + 64 arrows' },
      { libelle: 'Damage', valeur: '2.7 ❤ fully drawn' },
    ],
  },

  fireman: {
    role: 'Immunity',
    descriptionCourte: 'Immune to fire and lava',
    descriptionLongue: `Fire does not reach him, and neither does lava. Against a Magma who sets his attackers alight, against a Thor's lightning, or simply to walk through what everyone else goes around.

Very situational, hence the price: with no fire in front of him, he is playing a kit with no ability.`,
    caracteristiques: [
      { libelle: 'Fire', valeur: 'Immune' },
      { libelle: 'Lava', valeur: 'Immune' },
      { libelle: 'Burning', valeur: 'Cancelled' },
    ],
  },

  fisherman: {
    role: 'Hook',
    descriptionCourte:
      'The rod drags your target back to you. The kit that stops people leaving a fight.',
    descriptionLongue: `A fishing rod, a **3 second** cooldown, and one simple principle: nobody leaves when you do not want them to.

The Fisherman pulls the target he hooks straight back to him. That is how you catch a runner on low health, tear someone off the edge of a platform, or close the gap on an Archer shooting you from across the map.

It is a control kit: it deals almost no damage, it just decides where the fight happens.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Fishing rod' },
      { libelle: 'Cooldown', valeur: '3 s' },
    ],
  },

  camel: {
    role: 'Terrain',
    descriptionCourte: 'Runs faster on sand',
    descriptionLongue: `Speed II as long as he walks on sand or sandstone. On the sandy parts of the map he outruns anyone; anywhere else he plays on even terms.

A kit that rewards knowing the ground rather than pure fighting — knowing where to drag someone becomes a skill of its own.`,
    caracteristiques: [
      { libelle: 'Effect', valeur: 'Speed II' },
      { libelle: 'Condition', valeur: 'Sand or sandstone' },
      { libelle: 'Elsewhere', valeur: 'No bonus' },
    ],
  },

  magma: {
    role: 'Retaliation',
    descriptionCourte:
      'Whoever hits you burns. Purely defensive: you trigger nothing, you punish.',
    descriptionLongue: `There is no button to press. When a player hits you in melee, he burns for **2 seconds**, with a **4 second** cooldown between two triggers.

The Magma does not win a fight on its own: it makes the fight expensive. Against an opponent who spams clicks and never breaks off, the burns stack up and force him to drink more often than you do.

It is the most passive kit on the server, and probably the most underrated in group fights.`,
    caracteristiques: [
      { libelle: 'Effect', valeur: 'Attacker burns 2 s' },
      { libelle: 'Cooldown', valeur: '4 s' },
    ],
  },

  viper: {
    role: 'Poison',
    descriptionCourte:
      'Every hit poisons. The damage stacks up while your target drinks its soups.',
    descriptionLongue: `Each of your melee hits applies **Poison I for 4 seconds**.

Poison does not kill — it never takes you below half a heart — but it cancels part of every soup your target drinks. Over a long exchange, your opponent empties their inventory twice as fast as you do.

The Viper has no range at all: everything happens up close, and you have to hold that distance long enough for the poison to do its work.`,
    caracteristiques: [
      { libelle: 'Effect', valeur: 'Poison I · 4 s' },
      { libelle: 'Range', valeur: 'Melee only' },
    ],
  },

  kangaroo: {
    role: 'Mobility',
    descriptionCourte:
      'A leap forward that clears gaps and crowds. To engage as much as to escape.',
    descriptionLongue: `A firework, a **5 second** cooldown, and a leap that throws you far ahead.

The Kangaroo is as good for entering a fight as for leaving one. It clears the gaps in the map, jumps over a melee to reach the Archer behind it, or breaks away from an opponent stuck to you.

The only real risk is you: a badly aimed leap over the void cannot be taken back.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Firework' },
      { libelle: 'Cooldown', valeur: '5 s' },
    ],
  },

  anchor: {
    role: 'Tank',
    descriptionCourte:
      'Knockback no longer moves you. Where others get pushed back a metre per hit, you stay put.',
    descriptionLongue: `Your **knockback is reduced to zero**, horizontally and vertically. A sword hit still hurts, it just no longer moves you.

On a soup server, knockback is what decides distance. A player pushed away loses contact, has to walk back in, and drinks on the way. The Anchor removes that breathing room: once you are glued on, you stay glued on.

The downside is complete. You can no longer use knockback to break away, nor be thrown out of a bad exchange. You take the fight you started, all the way.

> **Note from 03/09/2026** — the Slowness aura this page used to advertise has been removed from the kit. Stacking an area slow with knockback immunity would have made it the best kit on the server, with no counter.`,
    caracteristiques: [
      { libelle: 'Knockback taken', valeur: 'None' },
      { libelle: 'Vertical knockback', valeur: 'None' },
      { libelle: 'Cooldown', valeur: 'Always on' },
    ],
  },

  sponger: {
    role: 'Mobility',
    descriptionCourte: 'His sponges launch him into the air',
    descriptionLongue: `Five sponges, five launches. Each right click throws him upward and uses one sponge: enough to reach an island, escape a melee, or drop on someone by surprise.

Sponges only come back by taking the kit again. Use them at the right moment, not on repeat.`,
    caracteristiques: [
      { libelle: 'Item', valeur: '5 sponges' },
      { libelle: 'Effect', valeur: 'Vertical launch' },
      { libelle: 'Cooldown', valeur: '4 s' },
    ],
  },

  stomper: {
    role: 'Impact',
    descriptionCourte:
      'You no longer take fall damage: you hand it out on landing. The map is vertical, use it.',
    descriptionLongue: `Fall damage is **cancelled** for you. On landing, it is converted into area damage: up to **4 ❤** within a **4 block** radius, in proportion to the height of the fall.

The Stomper turns every high platform on the map into a weapon. You have to learn the jumping spots, and to aim at a group rather than a lone target: the impact hits everyone.

With no height to drop from, it is an ordinary PvP kit — its value depends entirely on the map.`,
    caracteristiques: [
      { libelle: 'Fall', valeur: 'Cancelled' },
      { libelle: 'Impact', valeur: '4 ❤ max · radius 4' },
      { libelle: 'Countered by', valeur: 'Anti-Stomper' },
    ],
  },

  monk: {
    role: 'Disruption',
    descriptionCourte: "Shuffles the target's hotbar",
    descriptionLongue: `One right click on the shears, and your target's hotbar falls into disorder. Their soups are no longer where their fingers look for them — and in soup, half a second of hesitation is enough.

No damage, no effect. Just chaos, at the exact moment the other player needs it least.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Shears' },
      { libelle: 'Range', valeur: '5 blocks' },
      { libelle: 'Cooldown', valeur: '25 s' },
    ],
  },

  switcher: {
    role: 'Disruption',
    descriptionCourte:
      'A snowball and you swap places. The troll kit by definition — and the void’s best friend.',
    descriptionLongue: `Sixteen snowballs. The one that hits a player **swaps your two positions**, instantly.

The Switcher deals very little damage and a great deal of indirect damage: it puts an opponent over the void, tears him from his team into the middle of yours, or pulls you out of a melee by throwing someone else into it.

Sixteen shots, not one more: every swap has to be worth something.`,
    caracteristiques: [
      { libelle: 'Item', valeur: '16 snowballs' },
      { libelle: 'Effect', valeur: 'Position swap' },
      { libelle: 'Cooldown', valeur: '8 s' },
      { libelle: 'Forbidden', valeur: 'KOTH zone' },
    ],
  },

  berserker: {
    role: 'Last stand',
    descriptionCourte:
      'Below 25 % health you hit harder. Staying low becomes a tactical choice.',
    descriptionLongue: `Below **2.5 ❤** — that is 25 % of your health — you gain **Strength I** for as long as you stay under the threshold.

The Berserker inverts the soup reflex: drinking your soup costs you your bonus. Played well, it means deliberately staying low to finish an opponent before he finishes you. Played badly, it means dying on half a heart with a full soup in your inventory.

It is the riskiest kit on the list, and one of the fastest to end a duel.`,
    caracteristiques: [
      { libelle: 'Effect', valeur: 'Strength I' },
      { libelle: 'Threshold', valeur: 'Below 2.5 ❤' },
    ],
  },

  spiderman: {
    role: 'Trap',
    descriptionCourte: 'Traps its targets in webs',
    descriptionLongue: `A web appears under your target's feet and holds them for eight seconds. They can still be attacked — that is the whole point: they can no longer back off, flee, or manage their distance.

Forbidden in KOTH zones and control zones: pinning someone on a point that has to be held would be far too decisive.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'String' },
      { libelle: 'Duration', valeur: '8 s' },
      { libelle: 'Cooldown', valeur: '20 s' },
      { libelle: 'Forbidden', valeur: 'KOTH and zones' },
    ],
  },

  thor: {
    role: 'Burst',
    descriptionCourte:
      'Lightning strikes where you aim. Area damage, and everyone sees where it came from.',
    descriptionLongue: `An iron axe, **25 blocks** of range, a **4 block** radius, an **8 second** cooldown. You aim, lightning falls.

The Thor is the opening kit by definition: it chips a whole group before contact is even made. In exchange, the bolt is loud and bright — after the first strike, the entire arena knows where you are and what you are playing.

Eight seconds is a long time. A Thor who wastes his lightning is an ordinary PvP kit for eight seconds.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Iron axe' },
      { libelle: 'Range', valeur: '25 blocks · radius 4' },
      { libelle: 'Cooldown', valeur: '8 s' },
    ],
  },

  vampire: {
    role: 'Healing',
    descriptionCourte: 'Recovers all his health on a kill',
    descriptionLongue: `Every player killed gives him back **all of his health**, instantly. Not half a heart per hit: everything, at once, the moment his target dies.

In a duel it changes nothing — the fight is already over when the ability fires. In a melee it is another matter: finishing an opponent on one heart puts you back to full health against the next one, without touching your soups.

The Vampire does not survive bad fights, he chains good ones.`,
    caracteristiques: [
      { libelle: 'Effect', valeur: 'Health restored to 100 %' },
      { libelle: 'Trigger', valeur: 'A player killed' },
      { libelle: 'Range', valeur: 'Melee only' },
    ],
  },

  reaper: {
    role: 'Corruption',
    descriptionCourte: 'His scythe deals wither damage',
    descriptionLongue: `His hoe hits apply wither. The damage carries on after the hit, and above all regeneration is blocked for the duration.

On a server where everyone heals with soup non-stop, stopping the other player from climbing back up changes the exchange completely.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Iron hoe' },
      { libelle: 'Effect', valeur: 'Wither I · 6 s' },
      { libelle: 'Cooldown', valeur: '6 s' },
    ],
  },

  grandpa: {
    role: 'Launcher',
    descriptionCourte: 'A stick that sends people flying',
    descriptionLongue: `A plain stick, enchanted with Knockback II. The damage is laughable, the launch is not: on a map of floating islands, one good hit near the edge needs no further argument.

The kit does not kill. It makes people fall. That is different, and often more effective.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Knockback II stick' },
      { libelle: 'Damage', valeur: 'Very low' },
      { libelle: 'Use', valeur: 'Launching' },
    ],
  },

  gladiator: {
    role: 'Duel',
    descriptionCourte:
      'You lock your target in a cage with you. No more ganking, no more running: a real 1v1, to the death.',
    descriptionLongue: `A blaze rod that locks you and your target inside a cage. **The duel goes to the death**: there is no timer and no draw. Cooldown: **45 seconds**.

The Gladiator isolates. It pulls a player out of a melee where you would be one against three, or corners a runner about to reach his team. Once the cage is up, there are only two players and one way out.

It commits both sides: you cannot leave either. Only six cages exist at the same time on the server — if they are all taken your rod does nothing, and your cooldown is not spent for it.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Blaze rod' },
      { libelle: 'Duration', valeur: 'To the death' },
      { libelle: 'Cooldown', valeur: '45 s' },
    ],
  },

  ninja: {
    role: 'Hunt',
    descriptionCourte:
      'A sneak teleports you onto the last player you hit. Nobody breaks away.',
    descriptionLongue: `**One sneak** teleports you onto the last player you hit. The mark stays valid for **15 seconds**, the teleport recharges in **10 seconds**.

The Ninja is the server's pursuit kit. An opponent who breaks off on one heart does not get away: you mark him, you let him go, you catch him.

But you have **no mobility** beyond that. No speed, no dash, no jump. Between two teleports you run like everyone else — and if your target leaves your range or the **15 seconds** run out, the mark drops and you are in the open.`,
    caracteristiques: [
      { libelle: 'Mark', valeur: 'Valid 15 s' },
      { libelle: 'Cooldown', valeur: '10 s' },
    ],
  },

  phantom: {
    role: 'Stealth',
    descriptionCourte:
      'Invisible as long as you touch nothing. Hitting reveals you: it is an approach kit, not a fighting one.',
    descriptionLongue: `Permanent **invisibility**, as long as you do nothing. Hitting reveals you for **8 seconds**, being hit for **5 seconds**.

The Phantom does not win fights, it chooses when they start. You cross the arena unseen, you take your position, and you open on the weakest target — after which you are an ordinary PvP kit for eight seconds.

Careful: invisibility hides neither your particles nor the items you hold. Attentive players still spot you.`,
    caracteristiques: [
      { libelle: 'Passive', valeur: 'Invisibility' },
      { libelle: 'Revealed', valeur: '8 s if you hit' },
      { libelle: 'Revealed', valeur: '5 s if you are hit' },
    ],
  },

  yumi: {
    role: 'Control',
    descriptionCourte:
      'Arrows that barely hurt but slow hard. You do not kill: you hand your targets to the others.',
    descriptionLongue: `A bow and sixty-four arrows, but **heavily reduced** damage — and **Slowness I for 3 seconds** on every hit.

The Yumi is the anti-Archer: where the Archer finishes the wounded, the Yumi prepares the living. A slowed target cannot break away, cannot dodge, and becomes your team's problem rather than yours.

It is a kit that never climbs the kill leaderboard. It is also the one that decides the most fights.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Bow + 64 arrows' },
      { libelle: 'Damage', valeur: 'Heavily reduced' },
      { libelle: 'Effect', valeur: 'Slowness I · 3 s' },
    ],
  },

  kitsune: {
    role: 'Deception',
    descriptionCourte: 'One tail per kill. At nine, the fox breaks loose.',
    descriptionLongue: `Every player killed earns you **one tail**, up to nine. The more you
gather, the faster you are: **Speed I** at three tails, **Speed II**
at six.

At the ninth, the transformation fires on its own. For
**25 seconds** you gain Speed II, Strength I and **+35 % damage**, and
the whole server is told. It is the only kit that publicly announces
it has become dangerous.

The price is simple: **dying loses you everything**. Nine kills
without a single death is a goal for a session, not for a fight.`,
    caracteristiques: [
      { libelle: 'Gain', valeur: '1 tail per kill' },
      { libelle: 'Transformation', valeur: '25 s' },
      { libelle: 'Threshold', valeur: '9 tails' },
    ],
  },

  tanuki: {
    role: 'Ambush',
    descriptionCourte: 'A double runs off in your place while you vanish.',
    descriptionLongue: `Right click the feather: a **fake player wearing your skin** sets off ahead of you
and runs straight for **4 seconds**. At the same moment, you turn
**invisible**.

Your opponent follows the double. You go around, break away, or come
back from the side. The clone eventually vanishes in a puff of smoke.

Invisibility drops if you hit. The Tanuki is not a fighting kit:
it is a kit for disengaging and repositioning.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Feather' },
      { libelle: 'Decoy duration', valeur: '4 s' },
      { libelle: 'Cooldown', valeur: '20 s' },
    ],
  },

  kenshi: {
    role: 'Duellist',
    descriptionCourte: 'Your first three hits on a target land far harder.',
    descriptionLongue: `The first hit on a target deals **+55 % damage**, the second
**+45 %**, the third **+30 %**. After that the blade is dull against that
particular person.

The counter is **per opponent**: you can land three boosted hits on one
player, then three more on the next. It resets after
**10 seconds without touching them**.

It is the kit of the clean engage. Hit hard immediately, then
break off to sharpen again — the opposite of what a normal player does.`,
    caracteristiques: [
      { libelle: '1st hit', valeur: '+55 % damage' },
      { libelle: '2nd hit', valeur: '+45 %' },
      { libelle: '3rd hit', valeur: '+30 %' },
    ],
  },

  onryo: {
    role: 'Spite',
    descriptionCourte:
      'On your death, your ghost clings to your killer and slows him. It does not save you — it makes them pay.',
    descriptionLongue: `The only kit on the server whose ability fires on **your death**: your ghost clings to your killer and applies **Slowness for 6 seconds**.

The Onryo never helps you survive. It turns your death into a problem for whoever caused it — five seconds of slowness in the middle of an arena is often exactly how long someone else needs to finish him.

In a team it is a deliberate sacrifice. Solo, it is mostly a matter of principle.`,
    caracteristiques: [
      { libelle: 'Trigger', valeur: 'Your death' },
      { libelle: 'Effect', valeur: 'Slowness on the killer' },
      { libelle: 'Duration', valeur: '6 s' },
    ],
  },

  sakura: {
    role: 'Support',
    descriptionCourte:
      'You heal the allies around you, continuously. Useless solo, decisive when your team holds a zone.',
    descriptionLongue: `**+1 ❤** to every ally within a **6 block** radius, **every 8 seconds**, automatically.

The Sakura is the only purely collective kit on LJKITS. Alone it brings nothing: it does not heal itself and has no offensive ability. In a team holding a zone or the KOTH, it saves every player one soup every eight seconds — and that is enormous.

It is played in the middle of the group, never in front.`,
    caracteristiques: [
      { libelle: 'Effect', valeur: '+1 ❤ to allies' },
      { libelle: 'Radius', valeur: '6 blocks' },
      { libelle: 'Frequency', valeur: 'Every 8 s' },
    ],
  },

  karasu: {
    role: 'Escape',
    descriptionCourte:
      'Five seconds of speed and jump to break away — but you cannot hit during that time.',
    descriptionLongue: `Sneak and you gain **Speed III and Jump II for 5 seconds**. For that whole time, **your attacks are cancelled** — sword and bow alike.

That is what stops the Karasu being a speed kit in disguise. Charging your target is pointless: you arrive unarmed, and you have to wait out the flight before landing a first hit. The ability exists to **leave** a position, never to take one.

The jump matters as much as the speed: without it you hit the first wall and get caught. With it, the terrain opens up.

The counter is simple: follow him. The crow does not turn invisible and does not go through walls — he runs fast, unarmed, for five seconds.`,
    caracteristiques: [
      { libelle: 'Activation', valeur: 'Sneak' },
      { libelle: 'Effects', valeur: 'Speed III · Jump II' },
      { libelle: 'Duration', valeur: '5 s, unarmed' },
      { libelle: 'Cooldown', valeur: '20 s' },
    ],
  },

  ishi: {
    role: 'Tank',
    descriptionCourte:
      'Three seconds of stone: you cannot move, but almost nothing gets through.',
    descriptionLongue: `Sneak and you take **60 % less damage for 3 seconds**. In exchange, you are **completely immobile**.

The reduction applies to everything: sword, arrow, fire, fall. A rock that only resisted swords would make no sense.

**Releasing the sneak ends the stance immediately.** Any ability that takes control away must be returnable by the player who took it. The cooldown still starts: interrupting does not refund it.

In a 1v1 it is a tool; in the middle of a melee it is offering your position to everyone for three seconds. The same button does both, and it is up to the player to know when it is the right one.`,
    caracteristiques: [
      { libelle: 'Activation', valeur: 'Sneak' },
      { libelle: 'Reduction', valeur: '−60 % damage' },
      { libelle: 'Duration', valeur: '3 s, immobile' },
      { libelle: 'Cooldown', valeur: '25 s' },
    ],
  },

  baku: {
    role: 'Attrition',
    descriptionCourte:
      'Your hits steal your victim’s soup. What matters is not what you gain, it is what they lose.',
    descriptionLongue: `One hit in four takes **one soup** from your opponent's inventory and puts it in yours. At most **one theft every 4 seconds**, whatever your click speed.

The point is not the soup gained: it is the soup **lost** by the other player. Over a long fight, the Baku turns a war of attrition into a material advantage, without ever hitting harder.

Past **24 soups** on you, the stolen soup is **destroyed** instead of taken. You still deprive your victim, but you never go beyond what a kit gives you at the start — the Baku saves trips to the refill, it does not replace them.

The counter: it does not finish fights, it sets them up. Against someone who kills quickly, it never has time to build up.`,
    caracteristiques: [
      { libelle: 'Chance', valeur: '25 % per hit' },
      { libelle: 'Rate', valeur: '1 theft / 4 s max' },
      { libelle: 'Cap', valeur: '24 soups' },
      { libelle: 'Range', valeur: 'Melee only' },
    ],
  },

  hachi: {
    role: 'Harassment',
    descriptionCourte: 'Every kill releases three wasps that go hunting the next player.',
    descriptionLongue: `On every kill, **three wasps** chase the nearest opponent for **5 seconds**. Each one deals **half a heart** and dies stinging.

Killing gives you nothing directly: no healing like the Vampire, no tail like the Kitsune. What you gain is **time** — three wasps going after the next player while you catch your breath.

On a server where fights come one after another, stopping the next opponent from refilling in peace is often worth more than two hearts.

A heart and a half in total if all three connect: that is pressure, not an execution.`,
    caracteristiques: [
      { libelle: 'Trigger', valeur: 'On every kill' },
      { libelle: 'Wasps', valeur: '3 · 5 s flight' },
      { libelle: 'Damage', valeur: '½ ❤ each' },
      { libelle: 'Range', valeur: '25 blocks' },
    ],
  },

  kappa: {
    role: 'Control',
    descriptionCourte:
      'A well that pulls everything around you in. No damage — you just decide where people are.',
    descriptionLongue: `Sneak and every player within a **6 block** radius is **pulled 3 blocks toward you**. The Kappa deals nothing.

Its value lies elsewhere: cancelling a disengage, dragging back a target running for their refill, gathering two opponents in the same place. It is the only kit on the server that decides other people's **position** without touching them.

The well does not choose. Pulling to catch a runner also brings back the three players you had not seen. In a 1v1 it is a tool, in a general melee it is a risk — and it is the same key.

The cooldown starts even if the well catches nobody: otherwise it would be a free presence detector, usable on loop.`,
    caracteristiques: [
      { libelle: 'Activation', valeur: 'Sneak' },
      { libelle: 'Radius', valeur: '6 blocks' },
      { libelle: 'Effect', valeur: 'Pull, no damage' },
      { libelle: 'Cooldown', valeur: '25 s' },
    ],
  },

  mushin: {
    role: 'All or nothing',
    descriptionCourte:
      'You hit 30 % harder when you have almost no soup left. Courage, literally rewarded.',
    descriptionLongue: `As long as you have **2 soups or fewer**, your melee hits deal **+30 % damage**. Nothing to activate, nothing to recharge: your own state decides, permanently.

It is the only kit that rewards not healing. The cost is total — on a soup server, playing nearly dry is playing without a net, and a mistake cannot be repaired. The 30 % does not make up for the lost healing: it makes up for the **risk** of no longer being allowed to be wrong.

A Mushin who keeps his soups is a kit with no ability. That is exactly the intent: the bonus is earned every second.

The counter is to see it coming. A Mushin hitting hard is a Mushin with nothing in reserve: you only have to hold. It is the only kit on the server where the right answer is sometimes to back off and wait.`,
    caracteristiques: [
      { libelle: 'Condition', valeur: '2 soups or fewer' },
      { libelle: 'Bonus', valeur: '+30 % damage' },
      { libelle: 'Range', valeur: 'Melee only' },
      { libelle: 'Cooldown', valeur: 'Always on' },
    ],
  },

  kagami: {
    role: 'Retaliation',
    descriptionCourte:
      'Five seconds during which half of what you take goes straight back to the sender.',
    descriptionLongue: `Right click the glass: for **5 seconds**, **half the damage you take goes back to your attacker**.

The Kagami does not take less — it takes everything, as before. It simply returns the favour. The difference with the Ishi is complete: the Ishi survives, the Kagami trades. Both can die to their own ability, for opposite reasons.

**The reflection can kill, and the kill is yours** — with its coins, its streak and its Elo. A kit that killed without anyone getting the kill would be a bug, not a subtlety.

The activation is deliberately loud: a silver flash and the sound of glass, seen and heard by everyone nearby. A good opponent stops hitting and waits it out. That is exactly the duel we want to create.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Glass' },
      { libelle: 'Reflected', valeur: '50 % of damage' },
      { libelle: 'Duration', valeur: '5 s' },
      { libelle: 'Cooldown', valeur: '30 s' },
    ],
  },

  kusari: {
    role: 'Anti-escape',
    descriptionCourte:
      'You chain an opponent for six seconds. Past five blocks, the chain pulls you both.',
    descriptionLongue: `Right click the lead: you **chain** a nearby player for **6 seconds**. If either of you goes further than **5 blocks**, **you are both pulled** toward the middle.

It ties both ends, and that is the balance of the kit. Chaining someone stronger than you is signing for it: you cannot break away either. The Kusari does not say "I will catch you", it says "we settle this now" — and that is only a good idea if you are winning.

Nothing happens while you are within five blocks: you fight normally. The chain only tightens beyond that, and **in proportion to the gap** — one step too far barely corrects, an outright escape costs dearly.

An action bar permanently shows both players who is chained, the distance and the time left.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Lead' },
      { libelle: 'Duration', valeur: '6 s' },
      { libelle: 'Tension', valeur: 'Beyond 5 blocks' },
      { libelle: 'Cooldown', valeur: '30 s' },
    ],
  },

  tokei: {
    role: 'Second chance',
    descriptionCourte:
      'You save a moment — position and health — and you can come back to it within eight seconds.',
    descriptionLongue: `First right click on the watch: your **position and health** are saved. Second click within **8 seconds**: you return to them.

It is not an escape, it is a bet. Marking at 10 hearts then diving in is giving yourself a free all-in. Marking too late, at 2 hearts, saves nothing at all.

**The cooldown starts at the mark, not at the return.** That is what keeps the kit honest: if it started at the return, marking would be free, you would keep a mark up permanently, and the kit would become a safety net rather than a decision. Here, a wasted mark costs 60 seconds.

Healing can never be a loss: health is only given back if it is **lower** than the health saved.

**The mark is visible to everyone** — particles on the ground. Your opponent knows a return is armed and where it leads: he has to kill you within the eight seconds, or hold the position. An invisible mark would make this kit pure frustration.`,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Watch' },
      { libelle: 'Window', valeur: '8 s to return' },
      { libelle: 'Restores', valeur: 'Position and health' },
      { libelle: 'Cooldown', valeur: '60 s, from the mark' },
    ],
  },

  shio: {
    role: 'Anti-heal',
    descriptionCourte:
      'Your hits sometimes cut your victim’s healing. On a soup server, that is their health bar you are hitting.',
    descriptionLongue: `Roughly one hit in three **stops your victim drinking for 1 second**. At most **one block every 2.5 seconds**, whatever your click speed.

On a soup server, soup **is** the health bar. Blocking healing is not "a bit more damage": it changes the nature of the fight.

The randomness is deliberate. A block on every hit made the victim unable to drink at all, with no counter. Making it unpredictable means they can no longer count hits to know when to risk a sip — but they know they will drink within three seconds at worst.

The counter-play is to back off: the salt only renews on contact. A Shio who stops hitting loses the effect in a second. The kit forces constant aggression, which is what exposes it.

Melee only — a Shio with a bow could cut healing from forty blocks away without ever exposing himself.`,
    caracteristiques: [
      { libelle: 'Chance', valeur: '30 % per hit' },
      { libelle: 'Block', valeur: '1 s of healing cut' },
      { libelle: 'Rate', valeur: '1 block / 2.5 s max' },
      { libelle: 'Range', valeur: 'Melee only' },
    ],
  },

  hitsugi: {
    role: 'Entombment',
    descriptionCourte:
      'An obsidian coffin closes on your target. They suffocate, and you keep hitting.',
    descriptionLongue: `Aim at a player, right click. For **one second**, embers circle around them: that is the only moment they can still break away. If they stay, the trap closes.

Walls rise from the ground, water and lava meet, obsidian takes hold. The block that forms at head height **suffocates** them — the game's real suffocation, not a homemade effect.

The ground stays walled: your target cannot move an inch, but you can see their legs and you keep hitting. **Five seconds** later, everything cracks and disappears without leaving a mark on the map.

A soup restores more health than a second of suffocation takes away: your target can survive. They will spend their entire stack doing it, under your hits. This kit does not kill on its own — it opens the window.`,
    caracteristiques: [
      { libelle: 'Cast', valeur: '1 s · dodgeable' },
      { libelle: 'Suffocation', valeur: '5 s' },
      { libelle: 'Range', valeur: '5 blocks' },
      { libelle: 'Cooldown', valeur: '60 s' },
    ],
  },
}
