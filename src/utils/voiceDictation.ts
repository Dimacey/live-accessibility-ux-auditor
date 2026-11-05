/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VoiceNote {
  id: string;
  timestampSeconds: number;
  timeFormatted: string;
  transcript: string;
}

type VoiceCallback = (note: VoiceNote) => void;

class VoiceDictationManager {
  private recognition: any = null;
  private isListening = false;
  private listeners: Set<VoiceCallback> = new Set();
  private sessionStartTime = Date.now();

  constructor() {
    this.sessionStartTime = Date.now();
  }

  public init() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'uk-UA'; // Default to Ukrainian

      this.recognition.onresult = (event: any) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.trim();
        if (transcript) {
          const elapsedSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);
          const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
          const secs = String(elapsedSec % 60).padStart(2, '0');
          const note: VoiceNote = {
            id: `vn-${Date.now()}`,
            timestampSeconds: elapsedSec,
            timeFormatted: `${mins}:${secs}`,
            transcript,
          };
          this.notify(note);
        }
      };

      this.recognition.onerror = (err: any) => {
        // Ignored normal abort errors
        if (err?.error !== 'no-speech' && err?.error !== 'aborted') {
          console.warn('Voice dictation error:', err);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if listening was not explicitly stopped
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // ignore
          }
        }
      };
    } catch (e) {
      console.warn('Failed to initialize SpeechRecognition:', e);
    }
  }

  public start() {
    if (!this.recognition) {
      this.init();
    }
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.warn('Voice start failed:', e);
      }
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
  }

  public subscribe(cb: VoiceCallback) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public addManualNote(transcript: string) {
    const elapsedSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
    const secs = String(elapsedSec % 60).padStart(2, '0');
    const note: VoiceNote = {
      id: `vn-${Date.now()}`,
      timestampSeconds: elapsedSec,
      timeFormatted: `${mins}:${secs}`,
      transcript,
    };
    this.notify(note);
  }

  private notify(note: VoiceNote) {
    this.listeners.forEach((cb) => cb(note));
  }
}

export const voiceDictation = new VoiceDictationManager();
