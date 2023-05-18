import * as L from './core'
import * as T from './typechecker'
// import { typecheck } from './typechecker'

/** The output of our programs: a list of strings that our program printed. */
export type Output = string[]

/** @returns the value that expression `e` evaluates to. */
export function evaluate (env: L.Env, e: L.Exp): L.Value {
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
    case 'construct': {
      if (env.has(e.id)) {
        const out = env.get(e.id)
        if (out.tag === 'prim') {
          const outv = e.exps.map((x) => evaluate(env, x))
          return out.fn(outv)
        } else {
          throw new Error(`Runtime error: expected primitive, but found '${L.prettyValue(out)}'`)
        }
      } else {
        throw new Error(`Runtime error: unbound constructor '${e.id}'`)
      }
      
    }
    case 'match': {
      const v = evaluate(env, e.exp)
      let holdI : number = 0
      let matched : boolean = false
      const newenv = env.extend()
      const holdPat = e.pats
      for (let x = 0; x < holdPat.length; x++) {
        if (patternMatch(v, newenv, holdPat[x])) {
          console.log("matched") 
          matched = true
          holdI = x
          break
        }
      } 
      if (matched) {
        const out = evaluate(newenv, e.exps[holdI])
        console.log(out)
        return out
      } else {
        throw new Error(`Runtime error: 'match' did not match any patterns.`)
      }
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
      case 'data': {
        s.cons.forEach((x) => {
          env.set(x.id, L.prim(x.id, (args: L.Value[]): L.Value => {
            if (args.length === x.typs.length) {
              return L.constructv(x.id, args)
            } else {
              throw new Error(`Runtime error: constructor '${x.id}' expects ${x.typs.length} arguments but ${args.length} were given`)
            }
          }))
           
        })
        break
      }
    }
  }
  return output
}

/** @returns true if value `v` matches pattern `pat` under environment `env` */
function patternMatch(v: L.Value, env: L.Env, pat: L.Pattern): Boolean {  
  console.log(L.prettyValue(v) + " " + L.prettyPat(pat))
  switch (pat.tag) {
    case 'hole': {
      return true
    }
    case 'var': {
      if (/\d+$/.test(pat.value) && v.tag === 'num') {
        return v.value === parseInt(pat.value)? true : false
      } else if (v.tag === 'bool' && (pat.value === 'true' || pat.value === 'false')) {
        return L.prettyValue(v) === pat.value? true : false
      } else if (v.tag === 'string' && pat.value.startsWith("\"", 0) && pat.value.endsWith("\"", pat.value.length - 1)) {
        return L.prettyValue(v) === pat.value
      } else if (env.has(pat.value) && v.tag === 'constructv') {
        if (v.id === pat.value && v.vals.length === 0) {
          return true
        } else {
          throw new Error(`Runtime error: constructor ${v.id} expects 0 arguments with pat ${pat.value} but ${v.vals.length} were given or the pat does not exist`)
        }
      } else if (pat.value !== 'pair' && T.randomVar(pat.value)) {
        env.set(pat.value, v)
        return true
      } else {
        return false
      }
    }
    case 'list': {
      if (v.tag === 'constructv' && pat.patterns[0].tag === 'var' && pat.patterns[0].value === v.id) {
        if(pat.patterns.length - 1 === v.vals.length) {
          for (let i = 0; i < (pat.patterns.length - 1); i++) {
            if (!patternMatch(v.vals[i], env, pat.patterns[i+1])) {
              return false
            }
          }
          return true
        } else {
          throw new Error(`Runtime error: constructor ${v.id} expects  ${v.vals.length} but ${pat.patterns.length - 1} arguments were given`)  
        }
      } else if (v.tag === "pair" && pat.patterns[0].tag === "var" && pat.patterns[0].value === "pair") {
        if (pat.patterns.length === 3) {
          if (!patternMatch(v.value1, env, pat.patterns[1])) {
            return false
          } else if (!patternMatch(v.value2, env, pat.patterns[2])) {
            return false
          } else {
            return true
          }
        } else {
          return false
        }
      } else {
        throw new Error(`Runtime error: pattern matching only on constructor, pair, bool, num, and var`)
      }
      
    }
  }
}

