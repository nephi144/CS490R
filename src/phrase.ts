export type NoteEvent = {
  t0: number;
  t1: number;
  midi: number;
  label: string;
};

const Q = 0.6;     // quarter note duration
const H = 1.2;     // half note duration

export const PHRASE: NoteEvent[] = [
  // I am a child of God,
  { t0: 0 * Q,  t1: 1 * Q,  midi: 65, label: "I" },
  { t0: 1 * Q,  t1: 2 * Q,  midi: 65, label: "am" },
  { t0: 2 * Q,  t1: 3 * Q,  midi: 67, label: "a" },
  { t0: 3 * Q,  t1: 4 * Q,  midi: 69, label: "child" },

  { t0: 4 * Q,  t1: 5 * Q,  midi: 65, label: "of" },
  { t0: 5 * Q,  t1: 6 * Q,  midi: 69, label: "God," },

  // And He has sent me here,
  { t0: 6 * Q,  t1: 7 * Q,  midi: 70, label: "And" },
  { t0: 7 * Q,  t1: 8 * Q,  midi: 69, label: "He" },
  { t0: 8 * Q,  t1: 9 * Q,  midi: 67, label: "has" },
  { t0: 9 * Q,  t1: 10 * Q, midi: 65, label: "sent" },

  { t0: 10 * Q, t1: 11 * Q, midi: 67, label: "me" },
  { t0: 11 * Q, t1: 12 * Q, midi: 69, label: "here," },
  { t0: 12 * Q, t1: 14 * Q, midi: 72, label: "" }, // held note (C5)
];

export const PHRASE_LEN = 14 * Q;