import * as Tone from "tone";
import type { NoteEvent } from "./phrase";

export class TonePlayer {
  private synth: Tone.PolySynth;
  private part?: Tone.Part;
  private started = false;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.2 },
    }).toDestination();
  }

  async init(): Promise<void> {
    if (this.started) return;
    await Tone.start(); // must be called from a user gesture
    this.started = true;
  }

  loadPhrase(events: NoteEvent[]): void {
    // Clean up
    this.part?.dispose();

    const data = events.map((e) => ({
      time: e.t0,
      midi: e.midi,
      dur: Math.max(0.05, e.t1 - e.t0),
    }));

    this.part = new Tone.Part((time, value: any) => {
      const freq = Tone.Frequency(value.midi, "midi");
      this.synth.triggerAttackRelease(freq, value.dur, time, 0.8);
    }, data);

    this.part.start(0);
    Tone.Transport.seconds = 0;
    Tone.Transport.loop = false;
  }

  play(): void {
    Tone.Transport.start();
  }

  stop(): void {
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
  }

  nowSeconds(): number {
    return Tone.Transport.seconds;
  }
}
