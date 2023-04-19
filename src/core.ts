/* eslint-disable @typescript-eslint/no-non-null-assertion */

/* eslint-disable spaced-comment */
/** *** Abstract Syntax Tree ***************************************************/

// Types
export type Typ = TyNat | TyBool | TyArr | TyList | TyPoly | TyPair | TyHole

export interface TyNat { tag: 'nat' }
export interface TyBool { tag: 'bool' }
export interface TyHole { tag: 'hole' }
export interface TyArr { tag: 'arr', inputs: Typ[], output: Typ }
export interface TyList { tag: 'list', typ: Typ[] }
export interface TyPair { tag: 'pair', typ1: Typ, typ2: Typ }
export interface TyPoly { tag: 'poly', id: string } // is this even needed?

export const tybool: Typ = ({ tag: 'bool' })
export const tynat: Typ = ({ tag: 'nat' })
export const tyhole: Typ = ({ tag: 'hole' })
export const tyarr = (inputs: Typ[], output: Typ): Typ => ({ tag: 'arr', inputs, output })
export const tylist = (typ: Typ[]): Typ => ({ tag: 'list', typ })
export const typair = (typ1: Typ, typ2: Typ): Typ => ({ tag: 'pair', typ1, typ2 })
export const typoly = (id: string): Typ => ({ tag: 'poly', id })

// Expressions

export type Exp = Var | Num | Bool | Not | Plus | Eq | And | Or | If | Lam | App | List | 
                  Head | Tail | Match | Pair | Fst | Snd

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

export interface List { tag: 'list', exps: Exp[] }
export const list = (exps: Exp[]): Exp => ({ tag: 'list', exps })

export interface Head { tag: 'head', exp: Exp }
export const head = (exp: Exp): Exp => ({ tag: 'head', exp })

export interface Tail { tag: 'tail', exp: Exp }
export const tail = (exp: Exp): Exp => ({ tag: 'tail', exp })

export interface Pair { tag: 'pair', exp1: Exp, exp2: Exp}
export const pair = (exp1: Exp, exp2: Exp): Exp => ({ tag: 'pair', exp1, exp2 })

export interface Fst { tag: 'fst', exp: Exp }
export const fst = (exp: Exp): Exp => ({ tag: 'fst', exp })

export interface Snd { tag: 'snd', exp: Exp } 
export const snd = (exp: Exp): Exp => ({ tag: 'snd', exp })

export interface Match { tag: 'match', exp: Exp, ls: Exp }
export const match = (exp: Exp, ls: Exp): Exp => ({ tag: 'match', exp, ls})

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
export type Value = Num | Bool | Closure | Prim | List | Pair | Hole

export interface Prim { tag: 'prim', name: string, fn: (args: Value[]) => Value }
export interface Closure { tag: 'closure', param: string, body: Exp, env: Env }
export interface Hole { tag: 'hole' }

export const prim = (name: string, fn: (args: Value[]) => Value): Prim => ({ tag: 'prim', name, fn })
export const hole = (): Hole => ({ tag: 'hole' })
export const closure = (param: string, body: Exp, env: Env): Closure => ({ tag: 'closure', param, body, env })

// Statements
export type Stmt = SDefine | SPrint | SAssign 

export interface SDefine { tag: 'define', id: string, exp: Exp }
export const sdefine = (id: string, exp: Exp): Stmt => ({ tag: 'define', id, exp })

export interface SPrint { tag: 'print', exp: Exp }
export const sprint = (exp: Exp): Stmt => ({ tag: 'print', exp })

export interface SAssign { tag: 'assign', loc: Exp, exp: Exp }
export const sassign = (loc: Exp, exp: Exp): Stmt => ({ tag: 'assign', loc, exp })

// Programs
export type Prog = Stmt[]

/**
 * *** Environments and Contexts **********************************************/

/** *** Runtime Environment ****************************************************/

export class Env {
  private outer?: Env
  private bindings: Map<string, Value>

  constructor (bindings?: Map<string, Value>) {
    this.bindings = bindings || new Map()
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
    case 'list': return `(list ${e.exps.map(prettyExp).join(' ')})`
    case 'head': return `(head ${prettyExp(e.exp)})`
    case 'tail': return `(tail ${prettyExp(e.exp)})`
    case 'match': return `(match ${prettyExp(e.exp)} ${prettyExp(e.ls)})`
    case 'pair': return `(cons ${prettyExp(e.exp1)} ${prettyExp(e.exp2)})`
    case 'fst': return `(fst ${prettyExp(e.exp)})`
    case 'snd': return `(snd ${prettyExp(e.exp)})`
  }
}

/** @returns a pretty version of the value `v`, suitable for debugging. */
export function prettyValue (v: Value): string {
  switch (v.tag) {
    case 'num': return `${v.value}`
    case 'bool': return v.value ? 'true' : 'false'
    case 'hole': return '<hole>'
    case 'closure': return '<closure>'
    case 'prim': return `<prim ${v.name}>`
    case 'list': return `'(${v.exps.map(prettyExp).join(' ')})`
    case 'pair': return `(cons ${prettyExp(v.exp1)} ${prettyExp(v.exp2)})`
  }
}

/** @returns a pretty version of the type `t`. */
export function prettyTyp (t: Typ): string {
  switch (t.tag) {
    case 'nat': return 'nat'
    case 'bool': return 'bool'
    case 'arr': return `(-> ${t.inputs.map(prettyTyp).join(' ')} ${prettyTyp(t.output)})`
    case 'list': return `(list ${t.typ.map(prettyTyp).join(' ')})`
    case 'pair': return `(cons ${prettyTyp(t.typ1)} ${prettyTyp(t.typ2)})`
    case 'poly': return `(forall ${t.id}.)` //or change to just be the id
    case 'hole': return '<hole>'
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
  } else if (t1.tag === 'pair' && t2.tag === 'pair') {
    return typEquals(t1.typ1, t2.typ1) && typEquals(t1.typ2, t2.typ2)
  } else if (t1.tag === 'list' && t2.tag === 'list') {
    return typEquals(t1.typ[0], t2.typ[0])
  } else if (t1.tag === 'hole' || t2.tag === 'hole') {
    return true
  } else {
    return false
  }
}

/**@returns true if e1 and e2 are equivalent exp */
export function expEquals (e1: Exp, e2: Exp): boolean {
  switch (e1.tag) {
    case 'var': {
      if (e2.tag === 'var') {
        return e1.value === e2.value
      }
      return false
    }
    case 'num': {
      if (e2.tag === 'num') {
        return e1.value === e2.value
      }
      return false
    }
    case 'bool': {
      if (e2.tag === 'bool') {
        return e1.value === e2.value
      }
      return false
    }
    case 'not': {
      if (e2.tag === 'not') {
        return expEquals(e1.exp, e2.exp)
      }
      return false
    }
    case 'plus': {
      if (e2.tag === 'plus') {
        return expEquals(e1.e1, e2.e1) && expEquals(e1.e2, e2.e2)
      } 
      return false
    }
    case 'eq': {
      if (e2.tag === 'eq') {
        return expEquals(e1.e1, e2.e1) && expEquals(e1.e2, e2.e2)
      }
      return false
    }
    case 'lam': {
      if (e2.tag === 'lam' && typEquals(e1.typ, e2.typ)) {
        return expEquals(e1.body, e2.body)
      }
      return false
    }
    case 'app': {
      if (e2.tag === 'app' && expEquals(e1.head, e2.head)) {
        return e1.args.every((e, i) => expEquals(e, e2.args[i]))
      }
      return false
    }
    case 'if': {
      if (e2.tag === 'if') {
        return expEquals(e1.e1, e2.e1) && expEquals(e1.e2, e2.e2) && expEquals(e1.e3, e2.e3)
      }
      return false
    }
    case 'and': {
      if (e2.tag === 'and') {
        return expEquals(e1.e1, e2.e1) && expEquals(e1.e2, e2.e2)
      }
      return false
    }
    case 'or': {
      if (e2.tag === 'or') {
        return expEquals(e1.e1, e2.e1) && expEquals(e1.e2, e2.e2)
      }
      return false
    }
    case 'list': {
      if (e2.tag === 'list') {
        return e1.exps.length === e2.exps.length && e1.exps.every((e, i) => expEquals(e, e2.exps[i]))
      }
      return false
    }
    case 'head': {
      if (e2.tag === 'head') {
        return expEquals(e1.exp, e2.exp)
      }
      return false
    }
    case 'tail': {
      if (e2.tag === 'tail') {
        return expEquals(e1.exp, e2.exp)
      }
      return false
    }
    case 'match': {
      if (e2.tag === 'match') {
        return expEquals(e1.exp, e2.exp) && expEquals(e1.ls, e2.ls)
      }
      return false
    }
    case 'pair': {
      if (e2.tag === 'pair') {
        return expEquals(e1.exp1, e2.exp1) && expEquals(e1.exp2, e2.exp2)
      }
      return false
    }
    case 'fst': {
      if (e2.tag === 'fst') {
        return expEquals(e1.exp, e2.exp)
      }
      return false
    }
    case 'snd': {
      if (e2.tag === 'snd') {
        return expEquals(e1.exp, e2.exp)
      }
      return false
    }
  }
}

export function valueEquals (v1: Value, v2: Value): boolean {
  if (v1.tag === 'num' && v2.tag === 'num') {
    return v1.value === v2.value
  } else if (v1.tag === 'bool' && v2.tag === 'bool') {
    return v1.value === v2.value
  } else if (v1.tag === 'list' && v2.tag === 'list') {
    return v1.exps.length === v2.exps.length &&
      v1.exps.every((e, i) => expEquals(e, v2.exps[i]))
  } else if (v1.tag === 'pair' && v2.tag === 'pair') {
    return expEquals(v1.exp1, v2.exp1) && expEquals(v1.exp2, v2.exp2)
  } else if (v1.tag === 'hole' || v2.tag === 'hole') {
    return true
  } else {
    return false
  }
}