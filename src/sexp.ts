import * as C from '../src/core'
/** A `Tok` is a semantically meaningful chunk of text. */
export type Tok = string

/** A `Lexer` statefully transforms an input string into a list of tokens. */
export class Lexer {
  private pos: number
  private src: string

  /** Constructs a new `Lexer` from the given `src` string. */
  constructor(src: string) {
    this.pos = 0
    this.src = src
  }

  /** @returns true if the lexer has exhausted its input. */
  empty(): boolean {
    return this.pos >= this.src.length
  }

  /** @returns the next character of the input. */
  private peek(): string { 
    if (this.empty()) {
      throw new Error('Lexer error: unexpected end of input while lexing.')
    } else {
      return this.src[this.pos]
    }
  }

  /** Advances the tokenizer forward one character. */
  private advance() { this.pos += 1 }

  /** @return the next `Tok` from this lexer's source string. */
  private lex1(): Tok {
    const leader = this.peek()
    if (leader === '(') {
      this.advance()
      return '('
    } else if (leader === ')') {
      this.advance()
      return ')'
    } else {
      // N.B., identifiers are non-parentheses chunks of text
      let chk = leader
      this.advance()
      let cur = this.peek()
      while (!this.empty() && /\S/.test(cur) && cur !== '(' && cur !== ')') {
        chk += cur
        this.advance()
        cur = this.peek()
      }
      return chk
    }
  }

  /**
   * Consumes leading whitespace in the input up until the next non-whitespace
   * character.
   */
  whitespace() {
    while (!this.empty() && /\s/.test(this.peek())) { this.advance() }
  }

  /** @returns a list of tokens lexed from this lexer's source string. */
  tokenize(): Tok[] {
    const ret: Tok[] = []
    this.whitespace()
    while (!this.empty()) {
      ret.push(this.lex1())
      this.whitespace()
    }
    return ret
  }
}

/***** S-expression Datatypes *************************************************/

/** An `Atom` is a non-delineating chunk of text. */
export type Atom = { tag: 'atom', value: string }
const atom = (value: string): Sexp => ({ tag: 'atom', value })

/** A `SList` is a list of s-expressions. */
export type SList = { tag: 'slist', exps: Sexp [] }
const slist = (exps: Sexp[]): Sexp => ({ tag: 'slist', exps })

/** An s-expression is either an `Atom` of a list of s-expressions, a `SList`. */
export type Sexp = Atom | SList

/** @returns a string representation of `Sexp` `e`. */
export function sexpToString(e: Sexp): string {
  if (e.tag === 'atom') {
    return e.value
  } else {
    return `(${e.exps.map(sexpToString).join(' ')})`
  }
}

/***** S-expression Parsing ***************************************************/

/**
 * A `Parser` statefully transforms a list of tokens into a s-expression
 * or a collection of s-expressions.
 */
class Parser {
  private pos: number
  private toks: Tok[]

  constructor(toks: Tok[]) {
    this.pos = 0
    this.toks = toks
  }

  /** @returns true if the parser has exhausted its input. */
  empty(): boolean {
    return this.pos >= this.toks.length
  }

  /** @returns the next token of the input. */
  peek() { 
    if (this.empty()) {
      throw new Error('Parser error: unexpected end of input while parsing.')
    } else {
      return this.toks[this.pos]
    }
  }

  /** Advances the parser one token forward. */
  advance() { this.pos += 1 }
 
  expression(): C.Exp {
    let exp = this.comparison()
    if (this.empty()){
        return exp
    }

    if (this.peek() === '==') {
        this.advance()
        exp = C.eq(exp, this.comparison())
    } else if (this.peek() === '||') {
        this.advance()
        exp = C.or(exp, this.comparison())
    } else if (this.peek() === '&&') {
        this.advance()
        exp = C.and(exp, this.comparison())
    }
    return exp
  }
  
  comparison(): C.Exp {
    let exp = this.factor()
    if (this.empty()){
        return exp
    }
    if (this.peek() === '+') {
        this.advance()
        exp = C.plus(exp, this.factor())
    }
    return exp
  }
  
  factor(): C.Exp {
    let exp: C.Exp
    
    if (this.peek() === 'not') {
        this.advance()
        exp = C.not(this.factor())
    } else {
        exp = this.primary()
    }
    return exp
  }
  
  primary(): C.Exp {
    let exp: C.Exp
    let t = this.peek()
    if (/\d/.test(t)) {
        this.advance()
        return C.num(parseInt(t))
    }
  
    // token is not a number
    switch (t) {
      case 'true':
        this.advance()
        return C.bool(true)
      case 'false':
        this.advance()
        return C.bool(false)
      case '(':
        this.advance()
        exp = this.expression()
        this.advance()
        return exp
      case 'if':
        this.advance()
        const e1 = this.expression()
        let e2!: C.Exp
        let e3!: C.Exp
        if (this.peek() === 'then') {
            this.advance()
            e2 = this.expression()
            if (this.peek() === 'else') {
                this.advance()
                e3 = this.expression()
            }
        }
        return C.ife(e1, e2, e3)
      default:
        throw new Error(`token made to primary: ${t}`)
    }
  }

  /** @returns the next `Sexp` parsed from the input. */
  parse1(): Sexp {
    const head = this.peek()
    if (head === '(') {
      // N.B., move past the '('
      this.advance()
      if (this.empty()) {
        throw new Error('Parser error: unexpected end of input while parsing.')
      }
      const ret: Sexp[] = []
      while (this.peek() !== ')') {
        ret.push(this.parse1())
      }
      // N.B., move past the ')'
      this.advance()
      return slist(ret)
    } else if (head === ')') {
      throw new Error('Parser error: unexpected close parentheses encountered.')
    } else {
      // N.B., move past the head
      this.advance()
      return atom(head)
    }
  }

  /** @return the collection of `Sexp`s parsed from the input. */
  parse(): Sexp[] {
    const ret: Sexp[] = []
    while (!this.empty()) {
      ret.push(this.parse1())
    }
    return ret
  }

  parseE(): C.Exp[] {
    const ret: C.Exp[] = []
    while (!this.empty()) {
      ret.push(this.expression())
    }
    return ret
  } 
}

/** @returns a single sexp */
export function parse1(src: string): Sexp {
    const parser = new Parser(new Lexer(src).tokenize())
    const result = parser.parse1()
    if (parser.empty()) {
        return result
    } else {
        throw new Error(`Parse error: input not completely consumed: '${parser.peek()}'`)
    }
}

/** @returns a list of Sexps parsed from the input source string. */
export function parse(src: string): Sexp[] {
    const parser = new Parser(new Lexer(src).tokenize())
    const result = parser.parse()
    if (parser.empty()) {
        return result
    } else {
        throw new Error(`Parse error: input not completely consumed: '${parser.peek()}'`)
    }
}



/**
 * @param src the input program in sensible syntax
 * @returns the `Exp` corresponding to the provided input program
 */
export function parseExp1(src: string): C.Exp {
    const parser = new Parser(new Lexer(src).tokenize())
    const ret = parser.expression()
    if (parser.empty()) {
        return ret
    } else {
        throw new Error(`Parse error: input not completely consumed: '${parser.peek()}'`)
    }
}

export function parseExp(src: string): C.Exp[] {
    const parser = new Parser(new Lexer(src).tokenize())
    const ret = parser.parseE()
    if (parser.empty()) {
        return ret
    } else {
        throw new Error(`Parse error: input not completely consumed: '${parser.peek()}'`)
    }
}

export const e1 = '(7 + 5) + (2 + 4)'
export const e2 = 'if not(3 == 3) then (true || false) else (false && false)'