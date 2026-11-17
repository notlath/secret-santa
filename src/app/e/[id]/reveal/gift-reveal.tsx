"use client"

import { Button } from "@ui-sdk/react/button"
import { useAnimate } from "motion/react"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { useHydrated } from "@/hooks/use-hydrated"
import type { RevealView } from "@/server/exchange"
import { openRevealAction } from "./actions"

type Props = { exchangeId: string; alreadyOpened: boolean; recipient: RevealView["recipient"] }

export function GiftReveal({ exchangeId, alreadyOpened, recipient }: Props) {
  const hydrated = useHydrated()
  const [opened, setOpened] = useState(alreadyOpened)
  const [entrance, setEntrance] = useState(false)
  const [error, setError] = useState("")
  const [scope, animate] = useAnimate()
  const heading = useRef<HTMLHeadingElement>(null)
  const focusOnOpen = useRef(false)

  useEffect(() => {
    if (opened && focusOnOpen.current) heading.current?.focus()
  }, [opened])

  async function openGift(event: MouseEvent<HTMLElement>) {
    const pointerActivation = event.detail !== 0
    setError("")
    try {
      const result = await openRevealAction(exchangeId)
      if (!result.ok) {
        setError(result.message)
        return
      }
      const motion = pointerActivation && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (motion) {
        await animate("[data-gift-lid]", { transform: "translateY(-28px) rotate(-8deg)", opacity: 0 }, {
          duration: 0.25, ease: [0.23, 1, 0.32, 1],
        })
      }
      focusOnOpen.current = true
      setEntrance(motion)
      setOpened(true)
    } catch {
      setError("Couldn't open your gift box. Please try again.")
    }
  }

  if (!opened) return (
    <section aria-labelledby="gift" className="flex flex-col items-center gap-5 rounded-2xl border-2 border-gold bg-paper px-5 py-8">
      <h2 id="gift" className="font-display text-2xl text-ink">Who will you surprise?</h2>
      <p className="text-center text-muted-ink">Your Recipient and their three wishes are inside.</p>
      <Button disabled={!hydrated} onClick={openGift} pendingAnnouncement="Opening your gift box" className="flex flex-col gap-5 py-5">
        <span ref={scope} aria-hidden="true" className="relative block h-36 w-40">
          <span className="absolute [inset-inline:0.5rem] inset-bs-10 inset-be-0 rounded-ee-lg rounded-es-lg bg-cranberry" />
          <span className="absolute inset-bs-10 inset-be-0 [inset-inline-start:4.25rem] w-6 bg-gold" />
          <span data-gift-lid className="absolute [inset-inline:0] inset-bs-7 block h-8 rounded-md bg-cranberry-deep">
            <span className="absolute inset-bs-0 inset-be-0 [inset-inline-start:4.25rem] w-6 bg-gold" />
            <svg viewBox="0 0 80 32" className="absolute -inset-bs-7 [inset-inline-start:2.5rem] h-8 w-20 fill-none stroke-gold stroke-[4]">
              <path d="M40 30C8 30 4 3 20 3c12 0 20 27 20 27ZM40 30C72 30 76 3 60 3c-12 0-20 27-20 27Z" />
            </svg>
          </span>
        </span>
        Open my gift box
      </Button>
      <p role="alert" className="text-cranberry">{error}</p>
    </section>
  )

  return (
    <section aria-labelledby="recipient" data-entrance={entrance || undefined} className="flex flex-col gap-5 rounded-2xl border-2 border-pine bg-paper p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <h2 id="recipient" ref={heading} tabIndex={-1} className="font-display text-xl text-pine focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine">Your Recipient</h2>
        <p data-testid="recipient-name" className="font-display text-3xl text-ink [overflow-wrap:anywhere]">{recipient.displayName}</p>
        <p className="text-muted-ink">Keep it a secret. Here are their three wishes.</p>
      </div>
      <ol className="flex flex-col gap-5">
        {recipient.wishlist.map((item) => (
          <li key={item.position} className="flex flex-col gap-2 border-bs border-line pbs-4 [overflow-wrap:anywhere]">
            <h3 className="font-semibold text-ink">{item.name}</h3>
            {item.description && <p className="whitespace-pre-line text-muted-ink">{item.description}</p>}
            {item.productLink && <a href={item.productLink} target="_blank" rel="noopener noreferrer nofollow" className="self-start text-pine underline underline-offset-4">{new URL(item.productLink).hostname}</a>}
          </li>
        ))}
      </ol>
    </section>
  )
}
