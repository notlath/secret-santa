import { Button } from "@ui-sdk/react/button"
import Link from "next/link"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">Secret Santa, sorted</p>
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">Gift Exchange</h1>
        <p className="text-lg text-muted-ink">
          Set up a Secret Santa, share a code with your friends, and let the Draw keep the secret. No accounts needed.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button data-variant="solid" render={<Link href="/new" />}>
          Create an Exchange
        </Button>
        <Button render={<Link href="/join" />}>Join an Exchange</Button>
      </div>
    </main>
  )
}
