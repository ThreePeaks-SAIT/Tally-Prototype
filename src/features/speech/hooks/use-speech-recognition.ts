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
  onaudiostart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onnomatch: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onspeechend: (() => void) | null
  onspeechstart: (() => void) | null
  onstart: (() => void) | null
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

const MAX_NO_SPEECH_RETRIES = 2
const MAX_LISTENING_TIME_MS = 15_000

function getSpeechErrorMessage(error: string) {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Allow microphone access in your browser settings and try again.'
    case 'audio-capture':
      return 'No microphone was found. Check your device microphone and try again.'
    case 'network':
      return 'Speech recognition could not reach the browser service. Check your connection and try again.'
    case 'language-not-supported':
      return 'English speech recognition is not supported by this browser.'
    default:
      return 'Speech could not be recognized. Try again or type instead.'
  }
}

export function useSpeechRecognition({
  onTranscript,
  language = 'en-CA',
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const callbackRef = useRef(onTranscript)
  const shouldListenRef = useRef(false)
  const retryCountRef = useRef(0)
  const restartPendingRef = useRef(false)
  const resultReceivedRef = useRef(false)
  const finalResultReceivedRef = useRef(false)
  const lastTranscriptRef = useRef('')
  const speechDetectedRef = useRef(false)
  const listeningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [isSpeechDetected, setIsSpeechDetected] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const clearTimers = useCallback(() => {
    if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current)
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
    listeningTimeoutRef.current = null
    restartTimeoutRef.current = null
  }, [])

  const commitLastTranscript = useCallback(() => {
    const lastTranscript = lastTranscriptRef.current.trim()

    if (!lastTranscript || finalResultReceivedRef.current) return false

    finalResultReceivedRef.current = true
    resultReceivedRef.current = true
    setTranscript(lastTranscript)
    callbackRef.current(lastTranscript, true)
    return true
  }, [])

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
    recognition.onstart = () => setIsListening(true)
    recognition.onaudiostart = () => setIsListening(true)
    recognition.onspeechstart = () => {
      speechDetectedRef.current = true
      setIsSpeechDetected(true)
    }
    recognition.onspeechend = () => setIsSpeechDetected(false)
    recognition.onresult = (event) => {
      let nextTranscript = ''
      let isFinal = false

      for (let index = 0; index < event.results.length; index += 1) {
        nextTranscript += `${event.results[index][0].transcript} `
        isFinal ||= event.results[index].isFinal
      }

      const trimmedTranscript = nextTranscript.trim()
      if (!trimmedTranscript) return

      resultReceivedRef.current = true
      lastTranscriptRef.current = trimmedTranscript
      setTranscript(trimmedTranscript)
      callbackRef.current(trimmedTranscript, isFinal)

      if (isFinal) {
        finalResultReceivedRef.current = true
        shouldListenRef.current = false
        clearTimers()
        recognition.stop()
      }
    }
    recognition.onnomatch = () => {
      setIsSpeechDetected(false)

      if (shouldListenRef.current && retryCountRef.current < MAX_NO_SPEECH_RETRIES) {
        retryCountRef.current += 1
        restartPendingRef.current = true
        return
      }

      shouldListenRef.current = false
      restartPendingRef.current = false
      clearTimers()
      setIsListening(false)
      setError('Voice was detected, but the words could not be recognized. Try speaking closer to the microphone or type instead.')
    }
    recognition.onerror = (event) => {
      setIsSpeechDetected(false)

      if (event.error === 'aborted') return

      if (
        event.error === 'no-speech'
        && shouldListenRef.current
        && retryCountRef.current < MAX_NO_SPEECH_RETRIES
      ) {
        retryCountRef.current += 1
        restartPendingRef.current = true
        return
      }

      shouldListenRef.current = false
      restartPendingRef.current = false
      clearTimers()
      setIsListening(false)
      setError(
        event.error === 'no-speech'
          ? 'No speech was detected. Tap the microphone, wait for “Listening”, and speak clearly.'
          : getSpeechErrorMessage(event.error),
      )
    }
    recognition.onend = () => {
      setIsSpeechDetected(false)

      if (commitLastTranscript()) {
        shouldListenRef.current = false
        restartPendingRef.current = false
        clearTimers()
        setIsListening(false)
        return
      }

      if (
        shouldListenRef.current
        && !restartPendingRef.current
        && !resultReceivedRef.current
        && retryCountRef.current < MAX_NO_SPEECH_RETRIES
      ) {
        retryCountRef.current += 1
        restartPendingRef.current = true
      }

      if (shouldListenRef.current && restartPendingRef.current) {
        restartPendingRef.current = false
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start()
          } catch {
            shouldListenRef.current = false
            setIsListening(false)
            setError('The microphone could not restart. Tap the microphone to try again.')
          }
        }, 250)
        return
      }

      const endedWhileListening = shouldListenRef.current
      shouldListenRef.current = false
      clearTimers()
      setIsListening(false)

      if (endedWhileListening && !resultReceivedRef.current) {
        setError(
          speechDetectedRef.current
            ? 'Voice was detected, but no words were recognized. Try speaking closer to the microphone or type instead.'
            : 'No speech was detected. Tap the microphone, wait for “Listening”, and speak clearly.',
        )
      }
    }
    recognitionRef.current = recognition

    return () => {
      shouldListenRef.current = false
      clearTimers()
      recognition.abort()
    }
  }, [clearTimers, commitLastTranscript, language])

  const start = useCallback(() => {
    if (!recognitionRef.current || shouldListenRef.current) return

    clearTimers()
    setError(null)
    setTranscript('')
    setIsSpeechDetected(false)
    retryCountRef.current = 0
    restartPendingRef.current = false
    resultReceivedRef.current = false
    finalResultReceivedRef.current = false
    lastTranscriptRef.current = ''
    speechDetectedRef.current = false
    shouldListenRef.current = true

    try {
      recognitionRef.current.start()
      setIsListening(true)
      listeningTimeoutRef.current = setTimeout(() => {
        const committedTranscript = commitLastTranscript()
        shouldListenRef.current = false
        recognitionRef.current?.stop()
        setIsListening(false)

        if (!committedTranscript && !resultReceivedRef.current) {
          setError(
            speechDetectedRef.current
              ? 'Voice was detected, but no words were recognized. Try speaking closer to the microphone or type instead.'
              : 'No speech was detected within 15 seconds. Try again or type instead.',
          )
        }
      }, MAX_LISTENING_TIME_MS)
    } catch {
      shouldListenRef.current = false
      setIsListening(false)
      setError('The microphone is already in use. Try again in a moment.')
    }
  }, [clearTimers, commitLastTranscript])

  const stop = useCallback(() => {
    commitLastTranscript()
    shouldListenRef.current = false
    restartPendingRef.current = false
    clearTimers()
    recognitionRef.current?.stop()
    setIsListening(false)
    setIsSpeechDetected(false)
  }, [clearTimers, commitLastTranscript])

  const reset = useCallback(() => {
    setError(null)
    setTranscript('')
    setIsSpeechDetected(false)
    lastTranscriptRef.current = ''
    finalResultReceivedRef.current = false
    speechDetectedRef.current = false
  }, [])

  return {
    error,
    isListening,
    isSpeechDetected,
    isSupported,
    reset,
    start,
    stop,
    transcript,
  }
}
