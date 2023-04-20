import * as L from './core'
// import { typecheck } from './typechecker'

/** The output of our programs: a list of strings that our program printed. */
export type Output = string[]

/** @returns the value that expression `e` evaluates to. */
export function evaluate (env: L.Env, e: L.Exp): L.Value {
  switch (e.tag) {
    case 'var': {
      if (env.has(e.value)) {
        return env.get(e.value)
      } else {
        throw new Error(`Runtime error: unbound variable '${e.value}'`)
      }
    }
    case 'num':
      return e
    case 'bool':
      return e
    case 'lam':
      return L.closure(e.param, e.body, env)
    case 'not': {
      const v = evaluate(env, e.exp)
      if (v.tag === 'bool') {
        return L.bool(!v.value)
      }
      throw new Error(`Type error: 'not' expects a boolean in guard position but a ${v.tag} was given.`)
    }
    case 'eq': {
      const v = evaluate(env, e.e1)
      const w = evaluate(env, e.e2)
      return L.bool(v.tag === 'bool' && v.tag === w.tag && v.value === w.value)
    }
    case 'plus': {
      const v = evaluate(env, e.e1)
      const w = evaluate(env, e.e2)
      if (v.tag === 'num' && w.tag === 'num') {
        return L.num(v.value + w.value)
      }
      throw new Error(`Type error: 'plus' expects two numbers in guard position but a ${v.tag} and a ${w.tag} were given.`)
    }
    case 'and': {
      const v = evaluate(env, e.e1)
      const w = evaluate(env, e.e2)
      if (v.tag === 'bool' && w.tag === 'bool') {
        return L.bool(v.value && w.value)
      }
      throw new Error(`Type error: 'and' expects two booleans in guard position but a ${v.tag} and a ${w.tag} were given.`)
    }
    case 'or': {
      const v = evaluate(env, e.e1)
      const w = evaluate(env, e.e2)
      if (v.tag === 'bool' && w.tag === 'bool') {
        return L.bool(v.value || w.value)
      }
      throw new Error(`Type error: 'or' expects two booleans in guard position but a ${v.tag} and a ${w.tag} were given.`)
    }
    case 'app': {
      const head = evaluate(env, e.head)
      const args = e.args.map(arg => evaluate(env, arg))
      if (head.tag === 'closure') {
        if (args.length !== 1) {
          throw new Error(`Runtime error: closure expects 1 argument but ${args.length} were given`)
        } else {
          return evaluate(head.env.extend1(head.param, args[0]), head.body)
        }
      } else if (head.tag === 'prim') {
        return head.fn(args)
      } else {
        throw new Error(`Runtime error: expected closure or primitive, but found '${L.prettyValue(head)}'`)
      }
    }
    case 'if': {
      const v = evaluate(env, e.e1)
      if (v.tag === 'bool') {
        return v.value ? evaluate(env, e.e2) : evaluate(env, e.e3)
      } else {
        throw new Error(`Type error: 'if' expects a boolean in guard position but a ${v.tag} was given.`)
      }
    }
    case 'list': {
      return e
    }
    case 'head': {
      const v = evaluate(env, e.exp)
      if (v.tag === 'list') {
        if (v.exps.length === 0) {
          throw new Error(`Runtime error: cannot take head of empty list`)
        } else {
          return evaluate(env, v.exps[0])
        }
      } else {
        throw new Error(`Type error: 'head' expects a list in guard position but a ${v.tag} was given.`)
      }
    }
    case 'tail': {
      const v = evaluate(env, e.exp)
      if (v.tag === 'list') {
        if (v.exps.length === 0) {
          throw new Error(`Runtime error: cannot take tail of empty list`)
        } else {
          return evaluate(env, L.list(v.exps.slice(1)))
        }
      } else {
        throw new Error(`Type error: 'tail' expects a list in guard position but a ${v.tag} was given.`)
      }
    }
    case 'pair': {
      return e
    }
    case 'fst': {
      const v = evaluate(env, e.exp)
      if (v.tag === 'pair') {
        return evaluate(env, v.exp1)
      } else {
        throw new Error(`Type error: 'fst' expects a pair in guard position but a ${v.tag} was given.`)
      }
    }
    case 'snd': {
      const v = evaluate(env, e.exp)
      if (v.tag === 'pair') {
        return evaluate(env, v.exp2)
      } else {
        throw new Error(`Type error: 'snd' expects a pair in guard position but a ${v.tag} was given.`)
      }
    }
    case 'match': {
      break
    }
  }
}

/** @returns the result of executing program `prog` under environment `env` */
export function execute (env: L.Env, prog: L.Prog): Output {
  const output: Output = []
  for (const s of prog) {
    switch (s.tag) {
      case 'define': {
        const v = evaluate(env, s.exp)
        env.set(s.id, v)
        break
      }
      case 'assign': {
        const rhs = evaluate(env, s.exp)
        if (s.loc.tag === 'var') {
          if (env.has(s.loc.value)) {
            env.update(s.loc.value, rhs)
          } else {
            throw new Error(`Runtime error: unbound variable: ${s.loc.value}`)
          }
        } else {
          throw new Error(`Runtime error: cannot assign to non-location '${L.prettyExp(s.loc)}'}`)
        }
        break
      }
      case 'print': {
        const v = evaluate(env, s.exp)
        output.push(L.prettyValue(v))
        break
      }
    }
  }
  return output
}
