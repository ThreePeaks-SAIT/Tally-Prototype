'use client'

import { useEffect, useId, useMemo, useState, useTransition } from 'react'
import { ArrowRight, AudioLines, Mic, PackageOpen, Search, Square, Star } from 'lucide-react'

import { useSpeechRecognition } from '@/features/speech'

import { saveCountEntry } from '../actions/save-count-entry'
import { findMatchingItems, formatItemName } from '../lib/item-search'
import { parseSpokenQuantity } from '../lib/parse-spoken-quantity'
import type { CountItem } from '../types'

interface CountWorkspaceProps {
  initialCountedItemIds: string[]
  items: CountItem[]
}

interface VoiceCaptureStatusProps {
  isSpeechDetected: boolean
  label: string
  onStop: () => void
  transcript: string
}

function VoiceCaptureStatus({
  isSpeechDetected,
  label,
  onStop,
  transcript,
}: VoiceCaptureStatusProps) {
  return (
    <div
      aria-live="polite"
      className="mt-3 flex items-center gap-3 rounded-md border border-primary/25 bg-primary-soft px-4 py-3 text-primary"
      role="status"
    >
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
        <AudioLines aria-hidden="true" className="relative" size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold">
          {isSpeechDetected ? 'Voice detected' : 'Listening...'}
        </p>
        <p className="truncate text-caption text-foreground-muted">
          {transcript ? `Heard: “${transcript}”` : label}
        </p>
      </div>
      <button
        className="flex h-9 shrink-0 items-center gap-2 rounded border border-primary/25 bg-surface px-3 text-caption font-semibold text-primary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={onStop}
        type="button"
      >
        <Square aria-hidden="true" fill="currentColor" size={11} />
        Stop
      </button>
    </div>
  )
}

function getInitialItem(items: CountItem[], countedItemIds: Set<string>) {
  return items.find((item) => item.description.includes('TOMATO ROMA') && !countedItemIds.has(item.id))
    ?? items.find((item) => !countedItemIds.has(item.id))
    ?? items[0]
}

export function CountWorkspace({ items, initialCountedItemIds }: CountWorkspaceProps) {
  const [countedItemIds, setCountedItemIds] = useState(() => new Set(initialCountedItemIds))
  const [selectedItem, setSelectedItem] = useState<CountItem | undefined>(() => getInitialItem(items, countedItemIds))
  const [query, setQuery] = useState('')
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false)
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [quantity, setQuantity] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isPending, startTransition] = useTransition()
  const listboxId = useId()

  const matches = useMemo(() => findMatchingItems(items, query), [items, query])
  const activeMatch = matches[activeMatchIndex] ?? matches[0]
  const quantityValue = Number.parseFloat(quantity)
  const isQuantityValid = Number.isFinite(quantityValue) && quantityValue >= 0
  const toOrder = selectedItem?.parLevel !== null && selectedItem?.parLevel !== undefined && isQuantityValid
    ? Math.max(selectedItem.parLevel - quantityValue, 0)
    : null

  const itemSpeech = useSpeechRecognition({
    onTranscript: (transcript) => {
      setQuery(transcript)
      setIsAutocompleteOpen(Boolean(transcript))
    },
  })

  useEffect(() => {
    setActiveMatchIndex(0)
  }, [query])
  const quantitySpeech = useSpeechRecognition({
    onTranscript: (transcript, isFinal) => {
      if (!isFinal) return
      const parsed = parseSpokenQuantity(transcript)
      setMessage(parsed === null ? 'We could not identify a number. Try again or type it.' : null)
      if (parsed !== null) setQuantity(String(parsed))
    },
  })

  const selectItem = (item: CountItem) => {
    setSelectedItem(item)
    setQuery('')
    setIsAutocompleteOpen(false)
    setQuantity('')
    setMessage(null)
    itemSpeech.reset()
    quantitySpeech.reset()
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isAutocompleteOpen || matches.length === 0) {
      if (event.key === 'ArrowDown' && query) setIsAutocompleteOpen(true)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveMatchIndex((index) => (index + 1) % matches.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveMatchIndex((index) => (index - 1 + matches.length) % matches.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      selectItem(activeMatch)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setIsAutocompleteOpen(false)
    }
  }

  const selectNextItem = (updatedCountedItemIds = countedItemIds) => {
    if (!selectedItem) return
    const currentIndex = items.findIndex((item) => item.id === selectedItem.id)
    const orderedItems = [...items.slice(currentIndex + 1), ...items.slice(0, currentIndex)]
    const nextItem = orderedItems.find((item) => !updatedCountedItemIds.has(item.id))
    if (nextItem) selectItem(nextItem)
  }

  const handleSave = () => {
    if (!selectedItem || !isQuantityValid) {
      setMessage('Enter a valid quantity before saving.')
      return
    }

    startTransition(async () => {
      const result = await saveCountEntry(selectedItem.id, quantityValue)
      if (result.error) {
        setMessage(result.error)
        return
      }

      const nextCountedItemIds = new Set(countedItemIds).add(selectedItem.id)
      setCountedItemIds(nextCountedItemIds)
      setMessage(`${formatItemName(selectedItem.description)} saved.`)
      selectNextItem(nextCountedItemIds)
    })
  }

  if (!items.length || !selectedItem) {
    return (
      <section className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <PackageOpen className="mx-auto mb-4 text-foreground-muted" size={32} />
          <h1 className="text-page-title font-semibold tracking-tight">No inventory items available</h1>
          <p className="mt-2 text-body text-foreground-muted">Import the catalog before starting a count.</p>
        </div>
      </section>
    )
  }

  const itemsLeft = items.length - countedItemIds.size
  const progress = items.length ? countedItemIds.size / items.length * 100 : 0
  const speechUnavailable = !itemSpeech.isSupported || !quantitySpeech.isSupported

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 text-body-sm font-semibold">
              <h1 className="truncate">Tuesday count · Sysco items</h1>
              <span className="shrink-0 font-mono text-caption font-medium text-foreground-muted">
                {countedItemIds.size} of {items.length} counted
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            className="h-9 rounded border border-border bg-surface px-4 text-body-sm font-semibold hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setIsPaused((value) => !value)}
            type="button"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </header>

      <section className="border-b border-primary/15 bg-primary-soft px-4 py-4 sm:px-6">
        <label className="font-mono text-micro font-medium uppercase tracking-widest" htmlFor="item-search">
          Pick an item to count
        </label>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" size={18} />
          <input
            aria-activedescendant={isAutocompleteOpen && activeMatch ? `${listboxId}-${activeMatch.id}` : undefined}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isAutocompleteOpen && Boolean(query)}
            autoComplete="off"
            className="h-12 w-full rounded-md border border-primary bg-surface pl-12 pr-14 text-body outline-none placeholder:text-foreground-subtle focus:ring-2 focus:ring-primary/25"
            disabled={isPaused}
            id="item-search"
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveMatchIndex(0)
              setIsAutocompleteOpen(Boolean(event.target.value))
              itemSpeech.reset()
            }}
            onBlur={() => setIsAutocompleteOpen(false)}
            onFocus={() => setIsAutocompleteOpen(Boolean(query))}
            onKeyDown={handleSearchKeyDown}
            placeholder={'Search or speak the item name — "roma tomato", "mozzarella"...'}
            role="combobox"
            value={query}
          />
          <button
            aria-label={itemSpeech.isListening ? 'Stop listening for item name' : 'Speak item name'}
            aria-pressed={itemSpeech.isListening}
            className={`absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${itemSpeech.isListening ? 'ring-4 ring-primary/20' : ''}`}
            disabled={isPaused || !itemSpeech.isSupported || quantitySpeech.isListening}
            onClick={itemSpeech.isListening ? itemSpeech.stop : itemSpeech.start}
            type="button"
          >
            {itemSpeech.isListening
              ? <Square aria-hidden="true" fill="currentColor" size={12} />
              : <Mic aria-hidden="true" size={17} />}
          </button>

          {isAutocompleteOpen && query && matches.length > 0 && (
            <ul
              className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-md border border-border bg-surface p-1 shadow-elevated"
              id={listboxId}
              onMouseDown={(event) => event.preventDefault()}
              role="listbox"
            >
              {matches.map((item) => (
                <li key={item.id} role="none">
                  <button
                    aria-selected={activeMatch?.id === item.id}
                    className={`flex w-full items-center justify-between rounded px-3 py-3 text-left hover:bg-primary-soft focus-visible:bg-primary-soft focus-visible:outline-none ${activeMatch?.id === item.id ? 'bg-primary-soft' : ''}`}
                    id={`${listboxId}-${item.id}`}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setActiveMatchIndex(matches.indexOf(item))}
                    role="option"
                    tabIndex={-1}
                    type="button"
                  >
                    <span className="font-semibold">{formatItemName(item.description)}</span>
                    <span className="font-mono text-caption text-foreground-muted">{item.unitSize}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {isAutocompleteOpen && query && matches.length === 0 && (
            <div className="absolute z-20 mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 text-body-sm text-foreground-muted shadow-elevated">
              No items start with “{query}”.
            </div>
          )}
        </div>
        {itemSpeech.isListening && (
          <VoiceCaptureStatus
            isSpeechDetected={itemSpeech.isSpeechDetected}
            label="Speak the item name now"
            onStop={itemSpeech.stop}
            transcript={itemSpeech.transcript}
          />
        )}
        {itemSpeech.error && (
          <p aria-live="polite" className="mt-2 text-body-sm text-danger" role="alert">
            {itemSpeech.error}
          </p>
        )}
        <p className="mt-2 text-right font-mono text-caption">{itemsLeft} items left</p>
      </section>

      <main className="grid px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-181px)] lg:place-items-center lg:py-16">
        <article className="mx-auto w-full max-w-[470px] rounded-lg border border-border bg-surface p-6 shadow-elevated sm:p-7">
          <div className="flex items-center gap-4 border-b border-border-soft pb-5">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-warning/30">
              <Star size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-title-sm font-bold tracking-tight">{formatItemName(selectedItem.description)}</h2>
              <p className="mt-1 font-mono text-caption text-foreground-muted">
                {selectedItem.vendorName} · {selectedItem.packSize > 1 ? `${selectedItem.packSize} × ` : ''}{selectedItem.unitSize}
                {selectedItem.parLevel !== null ? ` · par ${selectedItem.parLevel}` : ''}
              </p>
            </div>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-micro font-semibold text-primary">● Picked</span>
          </div>

          <div className="pt-5">
            <label className="font-mono text-micro font-medium uppercase tracking-widest" htmlFor="quantity">
              How many cases on hand?
            </label>
            <div className="relative mt-2">
              <input
                className="h-24 w-full rounded-md border border-primary bg-surface px-16 text-center font-mono text-[3rem] leading-none tabular-nums outline-none placeholder:text-foreground-subtle focus:ring-2 focus:ring-primary/25"
                disabled={isPaused || isPending}
                id="quantity"
                inputMode="decimal"
                min="0"
                onChange={(event) => {
                  setQuantity(event.target.value)
                  setMessage(null)
                  quantitySpeech.reset()
                }}
                placeholder="0"
                type="number"
                value={quantity}
              />
              <button
                aria-label={quantitySpeech.isListening ? 'Stop listening for quantity' : 'Speak quantity'}
                aria-pressed={quantitySpeech.isListening}
                className={`absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${quantitySpeech.isListening ? 'ring-4 ring-primary/20' : ''}`}
                disabled={isPaused || isPending || !quantitySpeech.isSupported || itemSpeech.isListening}
                onClick={quantitySpeech.isListening ? quantitySpeech.stop : quantitySpeech.start}
                type="button"
              >
                {quantitySpeech.isListening
                  ? <Square aria-hidden="true" fill="currentColor" size={14} />
                  : <Mic aria-hidden="true" size={20} />}
              </button>
            </div>
            {quantitySpeech.isListening && (
              <VoiceCaptureStatus
                isSpeechDetected={quantitySpeech.isSpeechDetected}
                label="Say the quantity now, for example “three”"
                onStop={quantitySpeech.stop}
                transcript={quantitySpeech.transcript}
              />
            )}
            {quantitySpeech.error && (
              <p aria-live="polite" className="mt-2 text-body-sm text-danger" role="alert">
                {quantitySpeech.error}
              </p>
            )}
            <p className="mt-2 text-center font-mono text-caption text-foreground-muted">Type the number, or tap the mic to speak</p>
          </div>

          <div className="mt-5 rounded border border-warning/30 bg-warning-soft px-4 py-3 text-body-sm font-semibold text-warning">
            {toOrder !== null
              ? `Will add ${toOrder} cases to ${selectedItem.vendorName} order (par ${selectedItem.parLevel} − current ${quantityValue})`
              : selectedItem.parLevel === null
                ? 'Par level is not set. The current count will still be saved.'
                : 'Enter the current quantity to calculate the order amount.'}
          </div>

          {(message || speechUnavailable) && (
            <p aria-live="polite" className="mt-3 text-body-sm text-foreground-muted">
              {message ?? 'Speech recognition is unavailable in this browser. You can still type each value.'}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              className="h-11 rounded border border-border bg-surface text-body-sm font-semibold hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPaused || isPending}
              onClick={() => selectNextItem()}
              type="button"
            >
              Skip
            </button>
            <button
              className="flex h-11 items-center justify-center gap-2 rounded bg-foreground px-4 text-body-sm font-semibold text-primary-foreground hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPaused || isPending || !isQuantityValid}
              onClick={handleSave}
              type="button"
            >
              {isPending ? 'Saving...' : 'Save & next'}
              {!isPending && <ArrowRight size={16} />}
            </button>
          </div>
        </article>
      </main>
    </div>
  )
}
