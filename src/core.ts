/* eslint-disable @typescript-eslint/consistent-type-definitions */
/** *** Abstract Syntax Tree ***************************************************/

// Types

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TyNat = { tag: 'nat' }
export const tynat: Typ = ({ tag: 'nat' })

export type TyBool = { tag: 'bool' }
export const tybool: Typ = ({ tag: 'bool' })

export type TyStr = { tag: 'str' }
export const tystr: Typ = ({ tag: 'str' })

export type TyArrow = { tag: 'arrow', left: Typ[], right: Typ }
export const tyarrow = (left: Typ[], right: Typ): Typ => ({ tag: 'arrow', left, right })

export type Typ = TyNat | TyBool | TyArrow | TyStr

// Expressions

export type Var = { tag: 'var', value: string }
export const evar = (value: string): Var => ({ tag: 'var', value })

export type Num = { tag: 'num', value: number }
export const num = (value: number): Num => ({ tag: 'num', value })

export type Bool = { tag: 'bool', value: boolean }
export const bool = (value: boolean): Bool => ({ tag: 'bool', value })

export type Not = { tag: 'not', exp: Exp }
export const not = (exp: Exp): Exp => ({ tag: 'not', exp })

export type Plus = { tag: 'plus', e1: Exp, e2: Exp }
export const plus = (e1: Exp, e2: Exp): Exp => ({ tag: 'plus', e1, e2 })

export type Eq = { tag: 'eq', e1: Exp, e2: Exp }
export const eq = (e1: Exp, e2: Exp): Exp => ({ tag: 'eq', e1, e2 })

export type And = { tag: 'and', e1: Exp, e2: Exp }
export const and = (e1: Exp, e2: Exp): Exp => ({ tag: 'and', e1, e2 })

export type Or = { tag: 'or', e1: Exp, e2: Exp }
export const or = (e1: Exp, e2: Exp): Exp => ({ tag: 'or', e1, e2 })

export type If = { tag: 'if', e1: Exp, e2: Exp, e3: Exp }
export const ife = (e1: Exp, e2: Exp, e3: Exp): Exp =>
  ({ tag: 'if', e1, e2, e3 })

// need to add more expressions

//test expressions
export const e1 = plus(num(1), num(2))
export const e2 = eq(num(1), num(2))
export const e3 = and(bool(true), bool(false))
export const e4 = or(bool(true), bool(false))
export const e5 = ife(bool(true), num(1), num(2))
export const e6 = not(bool(true))
export const e7 = evar('apple')

export type Exp = Var | Num | Bool | Not | Plus | Eq | And | Or | If

// Values

export type Value = Num | Bool

// Statements

export type SDefine = { tag: 'define', id: string, exp: Exp }
export const sdefine = (id: string, exp: Exp): Stmt => ({ tag: 'define', id, exp })

// export type SPrint = { tag: 'print', exp: Exp }
// export const sprint = (exp: Exp): Stmt => ({ tag: 'print', exp })

export type SBody = { tag: 'body', id: string, exp: Exp[] }
export const sbody = (id: string, exp: Exp[]): Stmt => ({ tag: 'body', id, exp })

export type Stmt = SDefine | SBody

export type Func = { tag: 'func', def: SDefine, body: SBody[] }
export const func = (def: SDefine, body: SBody[]): Func => ({ tag: 'func', def, body })
// Programs

export type Prog = Func[]

/** *** Pretty-printer *********************************************************/

/** @returns a pretty version of the expression `e`, suitable for debugging. */
export function prettyExp (e: Exp): string {
  switch (e.tag) {
    case 'var': return `${e.value}`
    case 'num': return `${e.value}`
    case 'bool': return e.value ? 'true' : 'false'
    case 'not': return `(not ${prettyExp(e.exp)})`
    case 'plus': return `(${prettyExp(e.e1)} + ${prettyExp(e.e2)})`
    case 'eq': return `(${prettyExp(e.e1)} == ${prettyExp(e.e2)})`
    case 'and': return `(${prettyExp(e.e1)} && ${prettyExp(e.e2)})`
    case 'or': return `(${prettyExp(e.e1)} || ${prettyExp(e.e2)})`
    case 'if': return `if ${prettyExp(e.e1)} then ${prettyExp(e.e2)} else ${prettyExp(e.e3)}`
  }
}
const prettyTypHelper = (t: Typ[]): string => {
  let ret = ''
  t.forEach((x) => {
    ret += prettyTyp(x) + '->'
  })
  return ret
}

/** @returns a pretty version of the type `t`. */
export function prettyTyp (t: Typ): string {
  switch (t.tag) {
    case 'nat': return 'nat'
    case 'bool': return 'bool'
    case 'str': return 'str'
    case 'arrow': return `${prettyTypHelper(t.left)} -> ${prettyTyp(t.right)}`
  }
}

/** @returns a pretty version of the statement `s`. */
export function prettyStmt (s: Stmt): string {
  switch (s.tag) {
    case 'define': return `${s.id} :: ${prettyExp(s.exp)}`
    case 'body': return `${s.id} =  ${s.exp.map(prettyExp).join('\n')}`
  }
}

/** *** Equality ***************************************************************/

/** @returns true iff t1 and t2 are equivalent types */
export function typEquals (t1: Typ, t2: Typ): boolean {
  // N.B., this could be collapsed into a single boolean expression. But we
  // maintain this more verbose form because you will want to follow this
  // pattern of (a) check the tags and (b) recursively check sub-components
  // if/when you add additional types to the language.
  if (t1.tag === 'nat' && t2.tag === 'nat') {
    return true
  } else if (t1.tag === 'bool' && t2.tag === 'bool') {
    return true
  } else if (t1.tag === 'arrow' && t2.tag === 'arrow') {
    return true
  } else {
    return false
  }
}

/**
 * *** Environments and Contexts **********************************************/

/** A runtime environment maps names of variables to their bound variables. */
export type Env = Map<string, Value>

/** @returns a copy of `env` with the additional binding `x:v` */
export function extendEnv (x: string, v: Value, env: Env): Env {
  const ret = new Map(env.entries())
  ret.set(x, v)
  return ret
}

export function makeEmptyEnv (): Env {
  return new Map()
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
/**
 * *** Substitution ***********************************************************/

/**
 * @param v the value that is being substituted
 * @param x the variable being replaced
 * @param e the expression in which substitution occurs
 * @returns `e` but with every occurrence of `x` replaced with `v`
 */
export function substitute (v: Value, x: string, e: Exp): Exp {
  // TODO: implement me!
  return e
}
