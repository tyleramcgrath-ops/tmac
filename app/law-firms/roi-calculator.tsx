'use client'

import { useState } from 'react'

const BILLABLE_DEFAULT = 350

export function RoiCalculator() {
  const [attorneys, setAttorneys] = useState(12)
  const [hours, setHours] = useState(8)
  const [rate, setRate] = useState(BILLABLE_DEFAULT)

  // Conservative assumption: AI reclaims ~55% of routine review/drafting hours.
  const reclaimRate = 0.55
  const weeklyHoursSaved = attorneys * hours * reclaimRate
  const annualHoursSaved = Math.round(weeklyHoursSaved * 46) // ~46 working weeks
  const annualValue = Math.round(annualHoursSaved * rate)

  const fmt = (n: number) => n.toLocaleString('en-US')

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-7">
        <Slider
          label="Attorneys & paralegals"
          value={attorneys}
          min={1}
          max={250}
          onChange={setAttorneys}
          display={`${attorneys}`}
        />
        <Slider
          label="Hours/week each spends on routine review & drafting"
          value={hours}
          min={1}
          max={30}
          onChange={setHours}
          display={`${hours} hrs`}
        />
        <Slider
          label="Average billable rate"
          value={rate}
          min={100}
          max={1200}
          step={10}
          onChange={setRate}
          display={`$${fmt(rate)}/hr`}
        />
        <p className="text-xs leading-relaxed text-slate-500">
          Estimates assume AI reclaims ~55% of routine review and drafting time
          across ~46 working weeks. Illustrative only — your mileage varies by
          matter mix.
        </p>
      </div>

      <div className="flex flex-col justify-center gap-4 rounded-2xl border border-amber-400/20 bg-gradient-to-b from-amber-400/[0.07] to-transparent p-8">
        <Result label="Hours reclaimed / year" value={fmt(annualHoursSaved)} />
        <div className="h-px bg-white/10" />
        <Result
          label="Estimated annual value"
          value={`$${fmt(annualValue)}`}
          highlight
        />
        <a
          href="#contact"
          className="mt-3 rounded-xl bg-amber-400 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          See how we&apos;d capture this
        </a>
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (n: number) => void
  display: string
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="rounded-md bg-white/5 px-2.5 py-1 text-sm font-semibold text-amber-300">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-400"
      />
    </label>
  )
}

function Result({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div
        className={`mt-1 font-[Georgia,'Times_New_Roman',serif] font-semibold tabular-nums ${
          highlight ? 'text-4xl text-amber-400 sm:text-5xl' : 'text-3xl text-white'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
