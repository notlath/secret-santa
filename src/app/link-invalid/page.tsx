import { Explanation } from "@/components/explanation"

export const metadata = { title: "Link no longer works · Gift Exchange" }

export default function LinkInvalidPage() {
  return (
    <Explanation title="This link no longer works">
      <p>It may have been replaced with a new one, or the Exchange may have been deleted. Ask your Host for a new link.</p>
    </Explanation>
  )
}
