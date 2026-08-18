import Image from 'next/image'

import { SITE } from '@/lib/site'

/**
 * TODO (phase 2) : données factices, comme dans la maquette.
 * Pour brancher les vrais chiffres il suffira de remplacer ce tableau par un
 * appel qui renvoie le même format — [{ pseudo, votes }] — et de le passer
 * en props à <Classement>. Le rendu ci-dessous n'a pas à changer.
 */
const CLASSEMENT_FACTICE = [
  { pseudo: 'Lestoo', votes: 89 },
  { pseudo: 'Byslide_', votes: 74 },
  { pseudo: 'SoupMaster59', votes: 61 },
  { pseudo: 'xKombo_FR', votes: 55 },
  { pseudo: 'Ptit_Bol', votes: 48 },
  { pseudo: 'W_Tapeur', votes: 42 },
  { pseudo: 'Nostalgik', votes: 37 },
  { pseudo: 'MushWay_Fan', votes: 29 },
]

function urlAvatar(pseudo: string, taille: number) {
  return `${SITE.apiAvatar}${encodeURIComponent(pseudo)}/${taille}`
}

function pluriel(votes: number) {
  return votes > 1 ? 'votes' : 'vote'
}

export function Classement() {
  const trie = [...CLASSEMENT_FACTICE].sort((a, b) => b.votes - a.votes)
  const podium = trie.slice(0, 3)
  const reste = trie.slice(3)

  // Le podium s'affiche 2 — 1 — 3 : on réordonne les index pour l'affichage.
  const ordreAffichage = [1, 0, 2]

  return (
    <>
      <div className="mx-auto mb-11 grid max-w-[760px] items-end gap-5 sm:grid-cols-3">
        {ordreAffichage.map((index) => {
          const joueur = podium[index]
          if (!joueur) return null

          const rang = index + 1
          const premier = rang === 1

          return (
            <div
              key={joueur.pseudo}
              className={`relative rounded-2xl border bg-charbon px-5.5 text-center ${
                premier
                  ? 'border-or/50 bg-linear-to-b from-soupe/10 to-charbon pt-10.5 pb-9.5'
                  : 'border-bord pt-7.5 pb-6.5'
              }`}
            >
              <div
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 font-titre text-[13px] ${
                  premier
                    ? 'bg-linear-[135deg] from-soupe to-or text-[#1A1005]'
                    : 'border border-bord bg-braise text-gris'
                }`}
              >
                {rang}
              </div>
              <Image
                src={urlAvatar(joueur.pseudo, 80)}
                alt={`Avatar de ${joueur.pseudo}`}
                width={premier ? 80 : 64}
                height={premier ? 80 : 64}
                unoptimized
                className={`mx-auto mb-3.5 rounded-xl border-2 [image-rendering:pixelated] ${
                  premier ? 'size-20 border-or' : 'size-16 border-bord'
                }`}
              />
              <div className="text-[17px] font-bold">{joueur.pseudo}</div>
              <div className="mt-1.5 font-mono text-sm text-or">
                {joueur.votes} {pluriel(joueur.votes)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-bord bg-charbon">
        {reste.map((joueur, index) => (
          <div
            key={joueur.pseudo}
            className="grid grid-cols-[52px_44px_1fr_auto] items-center gap-4 border-b border-bord px-5.5 py-3.5 transition-colors last:border-b-0 hover:bg-braise"
          >
            <span className="font-mono font-bold text-gris">#{index + 4}</span>
            <Image
              src={urlAvatar(joueur.pseudo, 64)}
              alt=""
              width={34}
              height={34}
              unoptimized
              loading="lazy"
              className="size-8.5 rounded-lg [image-rendering:pixelated]"
            />
            <span className="text-[15.5px] font-semibold">{joueur.pseudo}</span>
            <span className="font-mono text-sm text-or">
              {joueur.votes} {pluriel(joueur.votes)}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
