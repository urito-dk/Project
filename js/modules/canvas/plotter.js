/**
 * Связка математики и Canvas: график + заливка решения.
 */
import { CoordinatePlane } from './coordinate-plane.js';
import { evaluateQuadratic, solveQuadraticInequality } from '../math/quadratic.js';

export class InequalityPlotter {
  constructor(canvas) {
    this.plane = new CoordinatePlane(canvas);
  }

  render(preset, paramValue) {
    const { A, B, C } = preset.coeffs(paramValue);
    const op = preset.inequality;
    const fn = (x) => evaluateQuadratic(A, B, C, x);

    this.plane._readTheme();
    this.plane.resize();
    this.plane.clear();
    this.plane.drawGrid();
    this.plane.drawAxes();

    const solution = solveQuadraticInequality(A, B, C, op);

    this.plane.shadeInequality(fn, (x) => pointInSolution(x, solution.intervals, op, fn(x)));

    this.plane.plotFunction(fn);
    if (solution.roots?.length) {
      this.plane.markRoots(solution.roots.filter(Number.isFinite));
    }

    return solution;
  }
}

/** op[0] === '>' покрывает '>' и '>=' без ловушки парсера ''>='' */
function pointInSolution(x, intervals, op, y) {
  const strict = op.length === 1;
  const wantsPositive = op[0] === '>';

  for (const iv of intervals) {
    const afterStart = iv.from === -Infinity || x > iv.from || (iv.inclusive && Math.abs(x - iv.from) < 1e-8);
    const beforeEnd = iv.to === Infinity || x < iv.to || (iv.inclusive && Math.abs(x - iv.to) < 1e-8);
    if (afterStart && beforeEnd) {
      if (strict) return wantsPositive ? y > 0 : y < 0;
      return wantsPositive ? y >= 0 : y <= 0;
    }
  }
  return false;
}
