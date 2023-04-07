/* eslint-disable @typescript-eslint/no-non-null-assertion */

/* eslint-disable spaced-comment */
/** *** Abstract Syntax Tree ***************************************************/

// Types
export type Typ = TyNat | TyBool | TyArr

export interface TyNat { tag: 'nat' }
export interface TyBool { tag: 'bool' }
export interface TyArr { tag: 'arr', inputs: Typ[], output: Typ }

export const tybool: Typ = ({ tag: 'bool' })
export const tynat: Typ = ({ tag: 'nat' })
export const tyarr = (inputs: Typ[], output: Typ): Typ => ({ tag: 'arr', inputs, output })

// Expressions

export type Exp = Var | Num | Bool | Not | Plus | Eq | And | Or | If | Lam | App

export interface Var { tag: 'var', value: string }
export const evar = (value: string): Var => ({ tag: 'var', value })

export interface Num { tag: 'num', value: number }
export const num = (value: number): Num => ({ tag: 'num', value })

export interface Bool { tag: 'bool', value: boolean }
export const bool = (value: boolean): Bool => ({ tag: 'bool', value })

export interface Not { tag: 'not', exp: Exp }
export const not = (exp: Exp): Exp => ({ tag: 'not', exp })

export interface Plus { tag: 'plus', e1: Exp, e2: Exp }
export const plus = (e1: Exp, e2: Exp): Exp => ({ tag: 'plus', e1, e2 })

export interface Eq { tag: 'eq', e1: Exp, e2: Exp }
export const eq = (e1: Exp, e2: Exp): Exp => ({ tag: 'eq', e1, e2 })

export interface And { tag: 'and', e1: Exp, e2: Exp }
export const and = (e1: Exp, e2: Exp): Exp => ({ tag: 'and', e1, e2 })

export interface Or { tag: 'or', e1: Exp, e2: Exp }
export const or = (e1: Exp, e2: Exp): Exp => ({ tag: 'or', e1, e2 })

export interface If { tag: 'if', e1: Exp, e2: Exp, e3: Exp }
export const ife = (e1: Exp, e2: Exp, e3: Exp): Exp =>
  ({ tag: 'if', e1, e2, e3 })

export interface Lam { tag: 'lam', param: string, typ: Typ, body: Exp }
export const lam = (param: string, typ: Typ, body: Exp): Exp =>
  ({ tag: 'lam', param, typ, body })

export interface App { tag: 'app', head: Exp, args: Exp[] }
export const app = (head: Exp, args: Exp[]): Exp => ({ tag: 'app', head, args })

// TODO: need to add more expressions

// test expressions
export const e1 = plus(num(1), num(2))
export const e2 = eq(num(1), num(2))
export const e3 = and(bool(true), bool(false))
export const e4 = or(bool(true), bool(false))
export const e5 = ife(bool(true), num(1), num(2))
export const e6 = not(bool(true))
export const e7 = evar('apple')

// Values
export type Value = Num | Bool | Closure | Prim

export interface Prim { tag: 'prim', name: string, fn: (args: Value[]) => Value }
export interface Closure { tag: 'closure', param: string, body: Exp, env: Env }

export const prim = (name: string, fn: (args: Value[]) => Value): Prim => ({ tag: 'prim', name, fn })
export const closure = (param: string, body: Exp, env: Env): Closure => ({ tag: 'closure', param, body, env })

// Statements
export type Stmt = SDefine | SPrint | SAssign // | SBody

export interface SDefine { tag: 'define', id: string, exp: Exp }
export const sdefine = (id: string, exp: Exp): Stmt => ({ tag: 'define', id, exp })

export interface SPrint { tag: 'print', exp: Exp }
export const sprint = (exp: Exp): Stmt => ({ tag: 'print', exp })

export interface SAssign { tag: 'assign', loc: Exp, exp: Exp }
export const sassign = (loc: Exp, exp: Exp): Stmt => ({ tag: 'assign', loc, exp })

// export type SBody = { tag: 'body', id: string, exp: Exp[] }
// export const sbody = (id: string, exp: Exp[]): Stmt => ({ tag: 'body', id, exp })

// Programs
export type Prog = Stmt[]

/**
 * *** Environments and Contexts **********************************************/

/** *** Runtime Environment ****************************************************/

export class Env {
  private outer?: Env
  private bindings: Map<string, Value>

  constructor (bindings?: Map<string, Value>) {
    this.bindings = (bindings === null) ? bindings : new Map()
  }

  has (x: string): boolean {
    return this.bindings.has(x) || (this.outer?.has(x) ?? false)
  }

  get (x: string): Value {
    if (this.bindings.has(x)) {
      return this.bindings.get(x)!
    } else if (this.outer !== undefined) {
      return this.outer.get(x)
    } else {
      throw new Error(`Runtime error: unbound variable '${x}'`)
    }
  }

  set (x: string, v: Value): void {
    if (this.bindings.has(x)) {
      throw new Error(`Runtime error: redefinition of variable '${x}'`)
    } else {
      this.bindings.set(x, v)
    }
  }

  update (x: string, v: Value): void {
    this.bindings.set(x, v)
    if (this.bindings.has(x)) {
      this.bindings.set(x, v)
    } else if (this.outer !== undefined) {
      this.outer.update(x, v)
    } else {
      throw new Error(`Runtime error: unbound variable '${x}'`)
    }
  }

  extend1 (x: string, v: Value): Env {
    const ret = new Env()
    ret.outer = this
    ret.bindings = new Map([[x, v]])
    return ret
  }
}

/** A context maps names of variables to their types. */
export type Ctx = Map<string, Typ>

/** @returns a copy of `ctx` with the additional binding `x:t` */
export function extendCtx (x: string, t: Typ, ctx: Ctx): Ctx {
  const ret = new Map(ctx.entries())
  ret.set(x, t)
  return ret
}

export function makeEmptyContext (): Ctx {
  return new Map()
}

/** *** Pretty-printer *********************************************************/

/** @returns a pretty version of the expression `e`, suitable for debugging. */
export function prettyExp (e: Exp): string {
  switch (e.tag) {
    case 'var': return `${e.value}`
    case 'num': return `${e.value}`
    case 'bool': return e.value ? 'true' : 'false'
    case 'not': return `(not ${prettyExp(e.exp)})`
    case 'plus': return `(+ ${prettyExp(e.e1)} ${prettyExp(e.e2)})`
    case 'eq': return `(eq ${prettyExp(e.e1)} ${prettyExp(e.e2)})`
    case 'lam': return `(lambda ${e.param} ${prettyTyp(e.typ)} ${prettyExp(e.body)})`
    case 'app': return `(${prettyExp(e.head)} ${e.args.map(prettyExp).join(' ')})`
    case 'if': return `(if ${prettyExp(e.e1)} ${prettyExp(e.e2)} ${prettyExp(e.e3)})`
    case 'and': return `(&& ${prettyExp(e.e1)} ${prettyExp(e.e2)})`
    case 'or': return `(|| ${prettyExp(e.e1)} ${prettyExp(e.e2)})`
  }
}

/** @returns a pretty version of the value `v`, suitable for debugging. */
export function prettyValue (v: Value): string {
  switch (v.tag) {
    case 'num': return `${v.value}`
    case 'bool': return v.value ? 'true' : 'false'
    case 'closure': return '<closure>'
    case 'prim': return `<prim ${v.name}>`
  }
}

/** @returns a pretty version of the type `t`. */
export function prettyTyp (t: Typ): string {
  switch (t.tag) {
    case 'nat': return 'nat'
    case 'bool': return 'bool'
    case 'arr': return `(-> ${t.inputs.map(prettyTyp).join(' ')} ${prettyTyp(t.output)})`
  }
}

/** @returns a pretty version of the statement `s`. */
export function prettyStmt (s: Stmt): string {
  switch (s.tag) {
    case 'define': return `(define ${s.id} ${prettyExp(s.exp)})`
    case 'assign': return `(assign ${prettyExp(s.loc)} ${prettyExp(s.exp)}))`
    case 'print': return `(print ${prettyExp(s.exp)})`
  }
}

/** @returns a pretty version of the program `p`. */
export function prettyProg (p: Prog): string {
  return p.map(prettyStmt).join('\n')
}
/** *** Equality ***************************************************************/

/** @returns true iff t1 and t2 are equivalent types */
export function typEquals (t1: Typ, t2: Typ): boolean {
  if (t1.tag === 'nat' && t2.tag === 'nat') {
    return true
  } else if (t1.tag === 'bool' && t2.tag === 'bool') {
    return true
  } else if (t1.tag === 'arr' && t2.tag === 'arr') {
    return typEquals(t1.output, t2.output) &&
      t1.inputs.length === t2.inputs.length &&
      t1.inputs.every((t, i) => typEquals(t, t2.inputs[i]))
  } else {
    return false
  }
}
