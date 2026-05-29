/**
 * Отрисовка координатной плоскости и преобразования координат.
 */
export class CoordinatePlane {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.xMin = options.xMin ?? -6;
    this.xMax = options.xMax ?? 6;
    this.yMin = options.yMin ?? -4;
    this.yMax = options.yMax ?? 8;
    this.padding = options.padding ?? 48;
    this.dpr = window.devicePixelRatio || 1;
    this._readTheme();
  }

  _readTheme() {
    const style = getComputedStyle(document.documentElement);
    this.colors = {
      grid: style.getPropertyValue('--grid-line').trim() || 'rgba(79,70,229,0.08)',
      axis: style.getPropertyValue('--graph-axis').trim() || '#94a3b8',
      text: style.getPropertyValue('--text-muted').trim() || '#5c6378',
      curve: style.getPropertyValue('--graph-curve').trim() || '#4f46e5',
      fillPos: style.getPropertyValue('--graph-positive').trim() || 'rgba(79,70,229,0.25)',
      accent: style.getPropertyValue('--accent').trim() || '#4f46e5',
    };
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = Math.min(rect.width, 800);
    const h = Math.min(w * 0.6, 480);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.plotW = this.width - 2 * this.padding * this.dpr;
    this.plotH = this.height - 2 * this.padding * this.dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
    this.cssW = w;
    this.cssH = h;
  }

  /** Мировые координаты → пиксели (CSS) */
  toScreen(x, y) {
    const px = this.padding + ((x - this.xMin) / (this.xMax - this.xMin)) * (this.cssW - 2 * this.padding);
    const py =
      this.cssH -
      this.padding -
      ((y - this.yMin) / (this.yMax - this.yMin)) * (this.cssH - 2 * this.padding);
    return { px, py };
  }

  clear() {
    this.ctx.clearRect(0, 0, this.cssW, this.cssH);
  }

  drawGrid() {
    const { ctx } = this;
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;

    const xStep = niceStep(this.xMax - this.xMin);
    const yStep = niceStep(this.yMax - this.yMin);

    for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
      const { px } = this.toScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(px, this.padding);
      ctx.lineTo(px, this.cssH - this.padding);
      ctx.stroke();
    }

    for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
      const { py } = this.toScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(this.padding, py);
      ctx.lineTo(this.cssW - this.padding, py);
      ctx.stroke();
    }
  }

  drawAxes() {
    const { ctx } = this;
    const o = this.toScreen(0, 0);
    ctx.strokeStyle = this.colors.axis;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(this.padding, o.py);
    ctx.lineTo(this.cssW - this.padding, o.py);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(o.px, this.padding);
    ctx.lineTo(o.px, this.cssH - this.padding);
    ctx.stroke();

    ctx.fillStyle = this.colors.text;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('x', this.cssW - this.padding + 6, o.py + 4);
    ctx.fillText('y', o.px + 6, this.padding - 6);
    ctx.fillText('O', o.px - 14, o.py + 14);
  }

  /** Закраска области под/над графиком где predicate(x) === true */
  shadeInequality(fn, predicate, samples = 400) {
    const { ctx } = this;
    const dx = (this.xMax - this.xMin) / samples;
    let inRegion = false;
    let startX = this.xMin;

    ctx.fillStyle = this.colors.fillPos;

    for (let i = 0; i <= samples; i++) {
      const x = this.xMin + i * dx;
      const y = fn(x);
      const ok = predicate(x, y);

      if (ok && !inRegion) {
        inRegion = true;
        startX = x;
      } else if (!ok && inRegion) {
        this._fillRegion(startX, x, fn, true);
        inRegion = false;
      }
    }
    if (inRegion) this._fillRegion(startX, this.xMax, fn, true);
  }

  _fillRegion(x1, x2, fn, aboveAxis) {
    const { ctx } = this;
    const steps = 60;
    const dx = (x2 - x1) / steps;
    const o = this.toScreen(0, 0);

    ctx.beginPath();
    const p0 = this.toScreen(x1, 0);
    ctx.moveTo(p0.px, o.py);

    for (let i = 0; i <= steps; i++) {
      const x = x1 + i * dx;
      const y = fn(x);
      const p = this.toScreen(x, y);
      ctx.lineTo(p.px, p.py);
    }

    const pEnd = this.toScreen(x2, 0);
    ctx.lineTo(pEnd.px, o.py);
    ctx.closePath();
    ctx.fill();
  }

  plotFunction(fn, color) {
    const { ctx } = this;
    const samples = 500;
    const dx = (this.xMax - this.xMin) / samples;
    let started = false;

    ctx.strokeStyle = color || this.colors.curve;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let i = 0; i <= samples; i++) {
      const x = this.xMin + i * dx;
      const y = fn(x);
      if (!Number.isFinite(y) || y < this.yMin - 20 || y > this.yMax + 20) {
        started = false;
        continue;
      }
      const { px, py } = this.toScreen(x, y);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  markRoots(roots) {
    const { ctx } = this;
    const o = this.toScreen(0, 0);
    roots.forEach((x) => {
      const p = this.toScreen(x, 0);
      ctx.fillStyle = this.colors.accent;
      ctx.beginPath();
      ctx.arc(p.px, o.py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.colors.text;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(x.toFixed(2), p.px - 12, o.py + 18);
    });
  }
}

function niceStep(range) {
  const rough = range / 10;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const r = rough / pow;
  if (r < 1.5) return pow;
  if (r < 3.5) return 2 * pow;
  if (r < 7.5) return 5 * pow;
  return 10 * pow;
}
