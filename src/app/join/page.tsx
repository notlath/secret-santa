import Link from "next/link"
import { redirect } from "next/navigation"
import { JoinCodeForm } from "./join-code-form"

export const metadata = { title: "Join an Exchange · Gift Exchange" }

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const { code } = await searchParams
  const entered = typeof code === "string" ? code.trim() : undefined
  if (entered) redirect(`/join/${encodeURIComponent(entered)}`)

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-8 sm:py-12">
      <Link href="/" className="text-sm font-semibold text-pine underline-offset-4 hover:underline">
        ← Gift Exchange
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Join an Exchange</h1>
        <p className="text-muted-ink">Enter the Access Code from your Host to see the Exchange before you join.</p>
      </header>
      <JoinCodeForm error={entered === "" ? "Enter the Access Code." : undefined} />
    </main>
  )
}
