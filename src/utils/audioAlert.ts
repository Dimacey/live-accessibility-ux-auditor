// Clean Web Audio API procedural sound effects for real-time observer alerts
class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public playAlert(type: 'critical' | 'warning' | 'info' | 'rage') {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'critical' || type === 'rage') {
        // High attention double-pip
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'warning') {
        // Soft synth beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else {
        // Gentle ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {
      // Audio might be blocked by browser policy before interaction; ignore gracefully
    }
  }
}

export const audioAlert = new AudioSynthesizer();
