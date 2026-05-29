/**
 * Аналитика квадратного трёхчлена Ax² + Bx + C.
 */

const EPS = 1e-9;

export function discriminant(A, B, C) {
  return B * B - 4 * A * C;
}

export function evaluateQuadratic(A, B, C, x) {
  return A * x * x + B * x + C;
}

/** Корни уравнения Ax² + Bx + C = 0 */
export function findRoots(A, B, C) {
  if (Math.abs(A) < EPS) {
    if (Math.abs(B) < EPS) return { type: 'none', roots: [], message: 'Нет переменной x (константа)' };
    return { type: 'linear', roots: [-C / B], message: 'Линейное уравнение' };
  }

  const D = discriminant(A, B, C);

  if (D < -EPS) {
    return { type: 'no-real', roots: [], D, message: 'D < 0 — нет действительных корней' };
  }

  if (Math.abs(D) <= EPS) {
    const x0 = -B / (2 * A);
    return { type: 'double', roots: [x0], D: 0, message: 'D = 0 — один корень' };
  }

  const sqrtD = Math.sqrt(D);
  const x1 = (-B - sqrtD) / (2 * A);
  const x2 = (-B + sqrtD) / (2 * A);
  const roots = x1 < x2 ? [x1, x2] : [x2, x1];
  return { type: 'two', roots, D, message: 'D > 0 — два корня' };
}

/** Знак числа с учётом EPS */
export function signOf(n) {
  if (n > EPS) return 1;
  if (n < -EPS) return -1;
  return 0;
}

/** Знак трёхчлена в точке x */
export function signAt(A, B, C, x) {
  return signOf(evaluateQuadratic(A, B, C, x));
}

/**
 * Интервалы, где выполняется неравенство.
 * @param {'>'|'<'|'>='|'<='} op
 */
export function solveQuadraticInequality(A, B, C, op) {
  const wantsPositive = op === '>' || op === ">=";
  const strict = op === '>' || op === '<';
  const rootsInfo = findRoots(A, B, C);

  if (Math.abs(A) < EPS) {
    return solveLinear(B, C, op, rootsInfo);
  }

  const intervals = [];
  const { roots, type, D } = rootsInfo;
  const leadSign = signOf(A);

  if (type === 'no-real') {
    const satisfied = (leadSign > 0 && wantsPositive) || (leadSign < 0 && !wantsPositive);
    if (satisfied) intervals.push({ from: -Infinity, to: Infinity, inclusive: true });
    return { intervals, roots: [], D, leadSign, type };
  }

  if (type === 'double') {
    const x0 = roots[0];
    const val = evaluateQuadratic(A, B, C, x0 + 1);
    const ok = wantsPositive ? val > 0 : val < 0;
    if (ok && !strict) intervals.push({ from: -Infinity, to: Infinity, inclusive: true });
    return { intervals, roots: [x0], D, leadSign, type };
  }

  if (type === 'two') {
    const [x1, x2] = roots;
    const mid = (x1 + x2) / 2;
    const midSign = signAt(A, B, C, mid);

    const outsidePositive = leadSign > 0;
    const targetPositive = wantsPositive;

    if (outsidePositive === targetPositive) {
      intervals.push({ from: -Infinity, to: x1, inclusive: !strict });
      intervals.push({ from: x2, to: Infinity, inclusive: !strict });
    } else {
      intervals.push({ from: x1, to: x2, inclusive: !strict });
    }

    return { intervals, roots, D, leadSign, type, midSign };
  }

  return { intervals: [], roots: [], D, leadSign, type };
}

function solveLinear(B, C, op, rootsInfo) {
  const intervals = [];
  if (Math.abs(B) < EPS) {
    const constOk =
      (op === '>' && C > 0) ||
      (op === ">=" && C >= 0) ||
      (op === '<' && C < 0) ||
      (op === "<=" && C <= 0);
    if (constOk) intervals.push({ from: -Infinity, to: Infinity, inclusive: true });
    return { intervals, roots: [], type: 'constant', message: rootsInfo.message };
  }

  const x0 = -C / B;
  const strict = op === '>' || op === '<';
  const wantsPositive = op === '>' || op === ">=";

  if (B > 0) {
    if (wantsPositive) intervals.push({ from: x0, to: Infinity, inclusive: !strict });
    else intervals.push({ from: -Infinity, to: x0, inclusive: !strict });
  } else {
    if (wantsPositive) intervals.push({ from: -Infinity, to: x0, inclusive: !strict });
    else intervals.push({ from: x0, to: Infinity, inclusive: !strict });
  }

  return { intervals, roots: [x0], type: 'linear', message: rootsInfo.message };
}

export function formatNumber(n, digits = 3) {
  if (!Number.isFinite(n)) return '∞';
  const r = Math.round(n * 10 ** digits) / 10 ** digits;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/\.?0+$/, '');
}
