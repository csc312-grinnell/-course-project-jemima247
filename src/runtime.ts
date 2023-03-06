import * as C from './core'

/** The output of our programs: a list of strings that our program printed. */
export type Output = string[]

// TODO: modify evaluate to also pass the current execution environment around.
/** @returns the value that expression `e` evaluates to. */
export function evaluate (e: C.Exp, env: C.Env): C.Value {
  switch (e.tag) {
    case 'var':
      if(env.has(e.value)){
        return env.get(e.value)!
      }
      else {
        throw new Error("Var not initialized");
      }
    case 'num':
      return e
    case 'bool':
      return e
    case 'not': {
      const v = evaluate(e.exp, env)
      if (v.tag === 'bool') {
        return C.bool(!v.value)
      } else {
        throw new Error(`Type error: negation expects a boolean but a ${v.tag} was given.`)
      }
    }
    case 'plus': {
      const v1 = evaluate(e.e1, env)
      const v2 = evaluate(e.e2, env)
      if (v1.tag === 'num' && v2.tag === 'num') {
        return C.num(v1.value + v2.value)
      } else {
        throw new Error(`Type error: plus expects two numbers but a ${v1.tag} and ${v2.tag} was given.`)
      }
    }
    case 'eq': {
      const v1 = evaluate(e.e1, env)
      const v2 = evaluate(e.e2, env)
      return C.bool(v1 === v2)
    }
    case 'and': {
      const v1 = evaluate(e.e1, env)
      const v2 = evaluate(e.e2, env)
      if (v1.tag === 'bool' && v2.tag === 'bool') {
        return C.bool(v1.value && v2.value)
      } else {
        throw new Error(`Type error: && expects two booleans but a ${v1.tag} and ${v2.tag} was given.`)
      }
    }
    case 'or': {
      const v1 = evaluate(e.e1, env)
      const v2 = evaluate(e.e2, env)
      if (v1.tag === 'bool' && v2.tag === 'bool') {
        return C.bool(v1.value || v2.value)
      } else {
        throw new Error(`Type error: || expects two booleans but a ${v1.tag} and ${v2.tag} was given.`)
      }
    }
    case 'if': {
      const v = evaluate(e.e1, env)
      if (v.tag === 'bool') {
        return v.value ? evaluate(e.e2, env) : evaluate(e.e3, env)
      } else {
        throw new Error(`Type error: 'if' expects a boolean in guard position but a ${v.tag} was given.`)
      }
    }
    
  }
}

