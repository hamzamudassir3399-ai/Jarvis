type Token = { type: 'num'; value: number } | { type: 'op'; value: string } | { type: 'ident'; value: string } | { type: 'paren'; value: '(' | ')' } | { type: 'comma' };

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  round: (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d,
  floor: Math.floor,
  ceil: Math.ceil,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  log: Math.log10,
  ln: Math.log,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
};

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.replace(/×/g, '*').replace(/÷/g, '/').replace(/,(?=\d{3})/g, '');
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (/[\d.]/.test(ch)) {
      let j = i;
      while (j < src.length && /[\d.]/.test(src[j])) j++;
      tokens.push({ type: 'num', value: parseFloat(src.slice(i, j)) });
      i = j;
    } else if (/[a-zA-Z]/.test(ch)) {
      let j = i;
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j++;
      tokens.push({ type: 'ident', value: src.slice(i, j).toLowerCase() });
      i = j;
    } else if ('+-*/%^'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
    } else if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
    } else if (ch === ',') {
      tokens.push({ type: 'comma' });
      i++;
    } else {
      throw new Error(`Unexpected character "${ch}"`);
    }
  }
  return tokens;
}

export function evaluate(expression: string): number {
  const tokens = tokenize(expression);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr(): number {
    let left = parseTerm();
    while (peek()?.type === 'op' && (peek() as any).value in { '+': 1, '-': 1 }) {
      const op = (next() as any).value;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (peek()?.type === 'op' && (peek() as any).value in { '*': 1, '/': 1, '%': 1 }) {
      const op = (next() as any).value;
      const right = parseFactor();
      if (op === '*') left *= right;
      else if (op === '/') left /= right;
      else left %= right;
    }
    return left;
  }

  function parseFactor(): number {
    const base = parseUnary();
    if (peek()?.type === 'op' && (peek() as any).value === '^') {
      next();
      return Math.pow(base, parseFactor());
    }
    return base;
  }

  function parseUnary(): number {
    const t = peek();
    if (t?.type === 'op' && (t.value === '-' || t.value === '+')) {
      next();
      const v = parseUnary();
      return t.value === '-' ? -v : v;
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const t = next();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.type === 'num') return t.value;
    if (t.type === 'paren' && t.value === '(') {
      const v = parseExpr();
      const close = next();
      if (!close || close.type !== 'paren' || close.value !== ')') throw new Error('Missing ")"');
      return v;
    }
    if (t.type === 'ident') {
      if (t.value in CONSTANTS) return CONSTANTS[t.value];
      const fn = FUNCTIONS[t.value];
      if (!fn) throw new Error(`Unknown function "${t.value}"`);
      const open = next();
      if (!open || open.type !== 'paren' || open.value !== '(') throw new Error(`Expected "(" after ${t.value}`);
      const args: number[] = [];
      if (!(peek()?.type === 'paren' && (peek() as any).value === ')')) {
        args.push(parseExpr());
        while (peek()?.type === 'comma') {
          next();
          args.push(parseExpr());
        }
      }
      const close = next();
      if (!close || close.type !== 'paren' || close.value !== ')') throw new Error('Missing ")"');
      return fn(...args);
    }
    throw new Error('Invalid expression');
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error('Unexpected trailing input');
  if (!Number.isFinite(result)) throw new Error('Result is not a finite number');
  return result;
}
