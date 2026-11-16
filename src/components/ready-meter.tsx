"use client"

import { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue } from "@ui-sdk/react/meter"

export function ReadyMeter({ ready, total }: { ready: number; total: number }) {
  return (
    <Meter value={ready} max={total} format={(value) => `${value} of ${total} ready`} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <MeterLabel className="text-sm font-semibold text-ink">Wishlists ready</MeterLabel>
        <MeterValue className="text-sm tabular-nums text-muted-ink" />
      </div>
      <MeterTrack className="h-2.5 w-full overflow-hidden rounded-full bg-cream-deep">
        <MeterIndicator className="h-full rounded-full bg-pine transition-[width] duration-300 ease-(--ease-out) motion-reduce:transition-none" />
      </MeterTrack>
    </Meter>
  )
}
