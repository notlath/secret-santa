import Link from "next/link"
import type { ReactNode } from "react"

export function Explanation({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-12">
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <div className="text-muted-ink">{children}</div>
      <Link href="/" className="self-start font-semibold text-pine underline underline-offset-4">
        Go to the start page
      </Link>
    </main>
  )
}
