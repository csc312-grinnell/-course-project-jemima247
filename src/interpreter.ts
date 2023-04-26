import * as L from './core'
// import { typecheck } from './typechecker'

/** The output of our programs: a list of strings that our program printed. */
export type Output = string[]

/** @returns the value that expression `e` evaluates to. */
export function evaluate (env: L.Env, e: L.Exp): L.Value {
  console.log(`Evaluating ${L.prettyExp(e)}`)
  switch (e.tag) {
    case 'var': {
      if (env.has(e.value)) {
        return env.get(e.value)
      } else if (e.value[0] == "\"") { 
        return L.stringv(e.value)
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
        console.log("the fuck")
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
      let out: L.Value[] = [];
      e.exps.forEach((v) => {
        out.push(evaluate(env, v))
      })
      return L.listv(out)
    }
    case 'head': {
      const v = evaluate(env, e.exp)
      if (v.tag === 'list') {
        if (v.values.length === 0) {
          throw new Error(`Runtime error: cannot take head of empty list`)
        } else {
          return v.values[0]
        }
      } else {
        throw new Error(`Type error: 'head' expects a list in guard position but a ${v.tag} was given.`)
      }
    }
    case 'tail': {
      const v = evaluate(env, e.exp)
      if (v.tag === 'list') {
        if (v.values.length === 0) {
          throw new Error(`Runtime error: cannot take tail of empty list`)
        } else {
          return L.listv(v.values.slice(1))
        }
      } else {
        throw new Error(`Type error: 'tail' expects a list in guard position but a ${v.tag} was given.`)
      }
    }
    case 'pair': {
      const v = evaluate(env, e.exp1)
      const w = evaluate(env, e.exp2)
      return L.pairv(v, w)
    }
    case 'fst': {
      const v = evaluate(env, e.exp)
      if (v.tag === 'pair') {
        return v.value1
      } else {
        throw new Error(`Type error: 'fst' expects a pair in guard position but a ${v.tag} was given.`)
      }
    }
    case 'snd': {
      const v = evaluate(env, e.exp)
      if (v.tag === 'pair') {
        return v.value2
      } else {
        throw new Error(`Type error: 'snd' expects a pair in guard position but a ${v.tag} was given.`)
      }
    }
    case 'match': {
      const v = evaluate(env, e.exp)
      // let holdI : number = 0
      e.pats.forEach((pat, i) => {
        console.log(L.prettyPat(pat))
        const newenv = env.extend()
        if (patternMatch(v, newenv, pat)) {
          console.log("matched") 
          // holdI = i
          const ls = evaluate(newenv, e.exps)
          if (ls.tag !== 'list') {
            throw new Error(`Type error: 'match' expects a list but a ${ls.tag} was given.`)
          } else { 
            console.log(ls.values[i])
            return ls.values[i]
          }
        }
      })
      throw new Error(`Runtime error: 'match' did not match any patterns.`)
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
function patternMatch(v: L.Value, env: L.Env, pat: L.Pattern): Boolean {  
  console.log(L.prettyValue(v) + " " + L.prettyPat(pat))
  switch (pat.tag) {
    case 'hole': {
      return true
    }
    case 'var': {
      if (/\d+$/.test(pat.value) && v.tag === 'num') {
        console.log("yes: " + L.prettyValue(v) + " " + pat.value)
        console.log(v.value === parseInt(pat.value))
        return v.value === parseInt(pat.value)? true : false
      } else if (v.tag === 'bool' && (pat.value === 'true' || pat.value === 'false')) {
        return L.prettyValue(v) === pat.value? true : false
      } else if (pat.value !== 'list' && v.tag !== 'list') {
        env.set(pat.value, v)
        return true
      } else {
        return false
      }
    }
    case 'list': {
      if (v.tag === "list" && pat.patterns[0].tag === "var" && pat.patterns[0].value === "list") {
        console.log("made into list case")
        if (pat.patterns.length === 1 && v.values.length === 0) {
          return true
        } else if (pat.patterns.length - 1 === v.values.length) {
          for (let i = 0; i < (pat.patterns.length - 1); i++) {
            if (!patternMatch(v.values[i], env, pat.patterns[i+1])) {
              console.log("please no")
              return false
            }
          }
          console.log("hi")
          return true
        }
      } else if (v.tag === "pair" && pat.patterns[0].tag === "var" && pat.patterns[0].value === "pair") {
        if (pat.patterns.length === 3) {
          if (!patternMatch(v.value1, env, pat.patterns[1])) {
            return false
          }
          if (!patternMatch(v.value2, env, pat.patterns[2])) {
            return false
          }
          return true
        }
      } else {
        throw new Error(`Runtime error: pattern matching only on list, pair, bool, num, and var`)
      }
    }
  }
  return false // why is this necessary?
}

