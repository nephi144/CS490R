// One short phrase (replace with your actual phrase later)
// t0/t1 in seconds, midi in standard MIDI note numbers
export type NoteEvent = { t0: number; t1: number; midi: number; label?: string };

export const PHRASE: NoteEvent[] = [
  { t0: 0.0, t1: 0.6, midi: 67, label: "I" },   // G4
  { t0: 0.6, t1: 1.2, midi: 69, label: "am" },  // A4
  { t0: 1.2, t1: 1.8, midi: 67, label: "a" },   // G4
  { t0: 1.8, t1: 2.8, midi: 64, label: "child" }, // E4
  { t0: 2.8, t1: 3.4, midi: 62, label: "of" },  // D4
  { t0: 3.4, t1: 4.4, midi: 60, label: "God" }, // C4
];

export const PHRASE_LEN = PHRASE[PHRASE.length - 1].t1;
