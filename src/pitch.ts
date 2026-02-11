export type PitchReading = {
  hz: number | null;
  confidence: number; // 0..1
  rms: number;        // mic level
};

export class MicPitch {
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private buf: Float32Array;
  private stream?: MediaStream;

  constructor(private fftSize = 2048) {
    this.buf = new Float32Array(this.fftSize);
  }

  async init(): Promise<void> {
    if (this.ctx) return;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    src.connect(this.analyser);
  }

  read(): PitchReading {
    if (!this.analyser) return { hz: null, confidence: 0, rms: 0 };

    this.analyser.getFloatTimeDomainData(this.buf);

    // RMS for a simple noise gate
    let sumSq = 0;
    for (let i = 0; i < this.buf.length; i++) sumSq += this.buf[i] * this.buf[i];
    const rms = Math.sqrt(sumSq / this.buf.length);

    const { hz, confidence } = autocorrelatePitch(this.buf, this.ctx!.sampleRate);

    return { hz, confidence, rms };
  }
}

// Simple autocorrelation pitch detection (good enough for MVP demos)
function autocorrelatePitch(buf: Float32Array, sampleRate: number): { hz: number | null; confidence: number } {
  // Remove DC offset
  let mean = 0;
  for (let i = 0; i < buf.length; i++) mean += buf[i];
  mean /= buf.length;

  const x = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) x[i] = buf[i] - mean;

  // Basic energy check
  let energy = 0;
  for (let i = 0; i < x.length; i++) energy += x[i] * x[i];
  energy /= x.length;
  if (energy < 1e-4) return { hz: null, confidence: 0 };

  // Autocorrelation
  const maxLag = Math.floor(sampleRate / 60);   // lowest ~60 Hz
  const minLag = Math.floor(sampleRate / 1000); // highest ~1000 Hz

  let bestLag = -1;
  let bestCorr = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < x.length - lag; i++) corr += x[i] * x[i + lag];
    corr /= (x.length - lag);

    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag <= 0) return { hz: null, confidence: 0 };

  const hz = sampleRate / bestLag;

  // Confidence heuristic: correlation normalized by energy
  const confidence = Math.min(1, Math.max(0, bestCorr / (energy + 1e-9)));

  return { hz, confidence };
}

export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function centsError(userMidi: number, targetMidi: number): number {
  return (userMidi - targetMidi) * 100;
}
