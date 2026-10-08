/**
 * Canvas particle field shaped like the D'FOOTPRINT logo.
 *
 * The logo SVG is drawn to an offscreen canvas and sampled on a grid; every
 * opaque sample becomes a particle with a target position. `progress` (0→1)
 * pulls particles from a scattered start into the logo, `scatter` (0→1)
 * blows them apart again. Both are plain numbers so GSAP can tween them.
 * The pointer pushes nearby particles away and they spring back.
 */

type Particle = {
  sx: number; // scattered start
  sy: number;
  tx: number; // target in logo
  ty: number;
  ox: number; // pointer offset
  oy: number;
  delay: number; // 0..0.35 stagger
  size: number;
  vx: number; // scatter direction
  vy: number;
};

export type ParticleLogoOptions = {
  src: string;
  color: string;
  /** Rendered logo size in CSS px (longest side). */
  logoSize: number;
  /** Sampling step in px; smaller = more particles. */
  step?: number;
  /** Pointer interaction radius in CSS px. */
  radius?: number;
};

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class ParticleLogo {
  progress = 0;
  scatter = 0;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private pointer = { x: -9999, y: -9999 };
  private t = 0;
  private raf = 0;
  private ro?: ResizeObserver;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: ParticleLogoOptions,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
  }

  async init() {
    this.resize();
    await this.sample();
    this.ro = new ResizeObserver(() => {
      const prev = { w: this.w, h: this.h };
      this.resize();
      // Re-centre targets without resampling.
      const dx = (this.w - prev.w) / 2;
      const dy = (this.h - prev.h) / 2;
      for (const p of this.particles) {
        p.tx += dx;
        p.ty += dy;
      }
    });
    this.ro.observe(this.canvas);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerleave", this.onLeave);
    this.loop();
    return this;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerleave", this.onLeave);
  }

  private onPointer = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = e.clientX - r.left;
    this.pointer.y = e.clientY - r.top;
  };
  private onLeave = () => {
    this.pointer.x = this.pointer.y = -9999;
  };

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private async sample() {
    const img = new Image();
    img.decoding = "async";
    img.src = this.opts.src;
    await img.decode();

    const size = this.opts.logoSize;
    const step = this.opts.step ?? 4;
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const octx = off.getContext("2d", { willReadFrequently: true })!;
    octx.drawImage(img, 0, 0, size, size);
    const data = octx.getImageData(0, 0, size, size).data;

    const ox = (this.w - size) / 2;
    const oy = (this.h - size) / 2;
    const spread = Math.max(this.w, this.h);

    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        if (data[(y * size + x) * 4 + 3]! < 110) continue;
        const angle = Math.random() * Math.PI * 2;
        const dist = spread * (0.35 + Math.random() * 0.5);
        this.particles.push({
          sx: this.w / 2 + Math.cos(angle) * dist,
          sy: this.h / 2 + Math.sin(angle) * dist,
          tx: ox + x,
          ty: oy + y,
          ox: 0,
          oy: 0,
          delay: Math.random() * 0.35,
          size: step * (0.6 + Math.random() * 0.35),
          vx: Math.cos(angle) * (0.4 + Math.random()),
          vy: Math.sin(angle) * (0.4 + Math.random()) - 0.3,
        });
      }
    }
  }

  get count() {
    return this.particles.length;
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    this.t += 0.016;
    const { ctx } = this;
    const radius = this.opts.radius ?? 70;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = this.opts.color;
    const blow = this.scatter * this.scatter * Math.max(this.w, this.h) * 0.9;

    for (const p of this.particles) {
      const local = Math.min(
        1,
        Math.max(0, (this.progress - p.delay) / (1 - 0.35)),
      );
      const k = easeInOutCubic(local);
      let x = p.sx + (p.tx - p.sx) * k;
      let y = p.sy + (p.ty - p.sy) * k;

      // Gentle breathing once assembled.
      x += Math.sin(this.t * 1.6 + p.ty * 0.05) * 0.6 * k;
      y += Math.cos(this.t * 1.3 + p.tx * 0.05) * 0.6 * k;

      // Pointer repulsion with spring-back.
      const dx = x - this.pointer.x;
      const dy = y - this.pointer.y;
      const d2 = dx * dx + dy * dy;
      let px = 0;
      let py = 0;
      if (d2 < radius * radius) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / radius) * 28;
        px = (dx / d) * f;
        py = (dy / d) * f;
      }
      p.ox += (px - p.ox) * 0.14;
      p.oy += (py - p.oy) * 0.14;

      x += p.ox + p.vx * blow;
      y += p.oy + p.vy * blow;

      ctx.globalAlpha = (0.25 + 0.75 * k) * (1 - this.scatter);
      ctx.fillRect(x, y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  };
}
