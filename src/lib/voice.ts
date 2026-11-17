import type { AppLanguage } from './supabase';

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: RecognitionResult[] };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type Constructor = new () => Recognition;
const locales: Record<AppLanguage, string> = { en: 'en-IN', ta: 'ta-IN', te: 'te-IN' };

export function createSpeechRecognition(language: AppLanguage): Recognition | null {
  const w = window as Window & { SpeechRecognition?: Constructor; webkitSpeechRecognition?: Constructor };
  const Speech = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Speech) return null;
  const recognition = new Speech();
  recognition.lang = locales[language];
  recognition.interimResults = true;
  recognition.continuous = false;
  return recognition;
}

export function speakText(text: string, language: AppLanguage): boolean {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locales[language];
  utterance.rate = 0.88;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.toLowerCase() === locales[language].toLowerCase())
    ?? voices.find(v => v.lang.toLowerCase().startsWith(language));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  return true;
}
