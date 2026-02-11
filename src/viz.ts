import { NoteEvent, PHRASE_LEN } from "./phrase";

type VizState = {
  t: number;
  targetMidi: number | null;
  userMidi: number | null;
  inTune: boolean;
};

export class CanvasViz {
  private ctx: CanvasRenderingContext2D;
  private w: number;
  private h: number;

  // MIDI range (adjust later for your phrase)
  private minMidi = 55;
  private maxMidi = 76;

  constructor(private canvas: HTMLCanvasElement, private phrase: NoteEvent[]) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    this.ctx = ctx;
    this.w = canvas.width;
    this.h = canvas.height;
  }

  draw(state: VizState): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, this.w, this.h);

    // Axes grid
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 7; i++) {
      const y = this.mapMidiToY(this.minMidi + (i * (this.maxMidi - this.minMidi)) / 7);
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(this.w - 20, y);
      ctx.stroke();
    }

    // Draw target blocks
    for (const e of this.phrase) {
      const x0 = this.mapTimeToX(e.t0);
      const x1 = this.mapTimeToX(e.t1);
      const y = this.mapMidiToY(e.midi);
      const blockH = 18;

      ctx.fillStyle = "#ffe8a3";
      ctx.fillRect(x0, y - blockH / 2, Math.max(2, x1 - x0), blockH);

      ctx.strokeStyle = "#f2c94c";
      ctx.strokeRect(x0, y - blockH / 2, Math.max(2, x1 - x0), blockH);
    }

    // Playhead (ball)
    const px = this.mapTimeToX(state.t);
    const py = state.targetMidi ? this.mapMidiToY(state.targetMidi) : this.h / 2;

    ctx.strokeStyle = "#cfd6ff";
    ctx.beginPath();
    ctx.moveTo(px, 20);
    ctx.lineTo(px, this.h - 20);
    ctx.stroke();

    ctx.fillStyle = "#0b5cff";
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fill();

    // User pitch dot
    if (state.userMidi !== null) {
      const uy = this.mapMidiToY(state.userMidi);
      ctx.fillStyle = state.inTune ? "#00b35a" : "#ff4d4f";
      ctx.beginPath();
      ctx.arc(px, uy, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Labels (left)
    ctx.fillStyle = "#333";
    ctx.font = "12px system-ui";
    ctx.fillText("Pitch ↑", 10, 16);
    ctx.fillText("Time →", this.w - 60, this.h - 8);
  }

  private mapTimeToX(t: number): number {
    const left = 40;
    const right = this.w - 20;
    const u = Math.max(0, Math.min(1, t / PHRASE_LEN));
    return left + u * (right - left);
  }

  private mapMidiToY(midi: number): number {
    const top = 20;
    const bottom = this.h - 20;
    const u = (midi - this.minMidi) / (this.maxMidi - this.minMidi);
    return bottom - Math.max(0, Math.min(1, u)) * (bottom - top);
  }
}
