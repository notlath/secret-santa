import Link from "next/link"
import { CreateExchangeForm } from "./create-exchange-form"

export const metadata = { title: "Create an Exchange · Gift Exchange" }

export default function NewExchangePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-8 sm:py-12">
      <Link href="/" className="text-sm font-semibold text-pine underline-offset-4 hover:underline">
        ← Gift Exchange
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Create an Exchange</h1>
        <p className="text-muted-ink">Set the details now. You can change them later.</p>
      </header>
      <CreateExchangeForm />
    </main>
  )
}
