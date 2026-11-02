'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

interface SpeechRecognitionErrorEventLike {
  error: string
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

interface UseSpeechRecognitionOptions {
  onTranscript: (transcript: string, isFinal: boolean) => void
  language?: string
}

export function useSpeechRecognition({
  onTranscript,
  language = 'en-CA',
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const callbackRef = useRef(onTranscript)
  const [isSupported, setIsSupported] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    callbackRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    const speechWindow = window as SpeechWindow
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition

    if (!Recognition) {
      setIsSupported(false)
      return
    }

    const recognition = new Recognition()
    recognition.lang = language
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 3
    recognition.onresult = (event) => {
      let transcript = ''
      let isFinal = false

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript
        isFinal ||= event.results[index].isFinal
      }

      callbackRef.current(transcript.trim(), isFinal)
    }
    recognition.onerror = (event) => {
      setError(event.error === 'not-allowed' ? 'Microphone access was not allowed.' : 'Speech was not recognized. Try again or type instead.')
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition

    return () => recognition.abort()
  }, [language])

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return

    setError(null)
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      setError('The microphone is already in use. Try again in a moment.')
    }
  }, [isListening])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { isSupported, isListening, error, start, stop }
}
