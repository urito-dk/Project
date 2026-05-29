/**
 * Генерация пошагового аналитического решения для пресета визуализации.
 */
import { findRoots, discriminant, formatNumber, solveQuadraticInequality } from './quadratic.js';

const OP_TEXT = {
  '>': '>',
  '<': '<',
  '>=': '≥',
  '<=': '≤',
};

export function buildSteps(preset, paramValue) {
  const { A, B, C } = preset.coeffs(paramValue);
  const op = preset.inequality;
  const opSym = OP_TEXT[op] || op;
  const a = formatNumber(paramValue);
  const steps = [];

  steps.push({
    text: `Подставим ${preset.param} = ${a}. Получаем неравенство с числовыми коэффициентами.`,
    math: formatPolynomial(A, B, C, opSym),
  });

  if (Math.abs(A) < 1e-9) {
    steps.push({
      text: 'Старший коэффициент равен 0 — это линейное (или константное) неравенство.',
      math: `${formatNumber(B)}x + ${formatNumber(C)} ${opSym} 0`,
    });
  } else {
    steps.push({
      text: `Старший коэффициент A = ${formatNumber(A)}. ${A > 0 ? 'Ветви параболы направлены вверх.' : 'Ветви параболы направлены вниз.'}`,
      math: `f(x) = ${formatPolynomial(A, B, C, '').replace(/>\s*$|≥\s*$|<\s*$|≤\s*$/, '')}`,
    });
  }

  const D = discriminant(A, B, C);
  steps.push({
    text: 'Вычислим дискриминант для анализа корней.',
    math: `D = B^2 - 4AC = ${formatNumber(D)}`,
  });

  const rootsInfo = findRoots(A, B, C);
  if (rootsInfo.type === 'no-real') {
    steps.push({
      text: rootsInfo.message + '. Парабола не пересекает ось Ox.',
      math: 'D < 0',
    });
    const signNote = A > 0 ? 'f(x) > 0 на всей оси' : 'f(x) < 0 на всей оси';
    steps.push({
      text: `Знак функции постоянен: ${signNote}.`,
      math: A > 0 ? '+' : '−',
    });
  } else if (rootsInfo.type === 'double') {
    const x0 = formatNumber(rootsInfo.roots[0]);
    steps.push({
      text: 'Парабола касается оси Ox в одной точке.',
      math: `x_0 = ${x0}`,
    });
  } else if (rootsInfo.type === 'two') {
    const [r1, r2] = rootsInfo.roots.map(formatNumber);
    steps.push({
      text: 'Отметим корни на оси и разобьём числовую прямую на интервалы.',
      math: `x_1 = ${r1},\\; x_2 = ${r2}`,
    });
  } else if (rootsInfo.type === 'linear') {
    steps.push({
      text: 'Линейное неравенство — один «корень» границы.',
      math: `x_0 = ${formatNumber(rootsInfo.roots[0])}`,
    });
  }

  const solution = solveQuadraticInequality(A, B, C, op);
  const intervalText = formatIntervals(solution.intervals);
  steps.push({
    text: 'Метод интервалов: выбираем промежутки, где выполняется неравенство.',
    math: intervalText || '\\varnothing',
  });

  steps.push({
    text: 'Сравните с графиком: закрашенная область — те же x, что в аналитическом ответе.',
    math: `x \\in ${intervalText || '\\varnothing'}`,
  });

  return steps;
}

function formatPolynomial(A, B, C, op) {
  const parts = [];
  if (Math.abs(A) > 1e-9) parts.push(`${formatNumber(A)}x^2`);
  if (Math.abs(B) > 1e-9) parts.push(`${B > 0 ? '+' : ''}${formatNumber(B)}x`);
  if (Math.abs(C) > 1e-9) parts.push(`${C > 0 ? '+' : ''}${formatNumber(C)}`);
  const body = parts.length ? parts.join(' ') : '0';
  return op ? `${body} ${op} 0` : body;
}

function formatIntervals(intervals) {
  if (!intervals.length) return '';
  return intervals
    .map((iv) => {
      const left = iv.from === -Infinity ? '(-\\infty' : `(${formatNumber(iv.from)}`;
      const right = iv.to === Infinity ? '+\\infty)`' : `${formatNumber(iv.to)})`;
      const bracketL = iv.inclusive && iv.from !== -Infinity ? '[' : '(';
      const bracketR = iv.inclusive && iv.to !== Infinity ? ']' : ')';
      if (iv.from === -Infinity && iv.to === Infinity) return '\\mathbb{R}';
      if (iv.from === -Infinity) return `(-\\infty; ${formatNumber(iv.to)}${iv.inclusive ? ']' : ')'}`;
      if (iv.to === Infinity) return `${iv.inclusive ? '[' : '('}${formatNumber(iv.from)}; +\\infty)`;
      return `${bracketL}${formatNumber(iv.from)}; ${formatNumber(iv.to)}${bracketR}`;
    })
    .join(' \\cup ');
}
