/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as L from './core'

function expectedTypeMsg (expected: string, pos: number, fn: string, found: string): string {
  return `Type error: Expected ${expected} in position ${pos} of ${fn} but found ${found}`
}

/** @return the type of expression `e` */
export function typecheck (ctx: L.Ctx, e: L.Exp): L.Typ {
  switch (e.tag) {
    case 'var': {
      if (ctx.has(e.value)) {
        return ctx.get(e.value)!
      } else if (e.value[0] == "\"") {
        return L.tystr
      } else {
        throw new Error(`Type error: unbound variable: ${e.value}`)
      }
    }
    case 'num':
      return L.tynat
    case 'bool':
      return L.tybool
    case 'lam': {
      const outTy = typecheck(L.extendCtx(e.param, e.typ, ctx), e.body)
      return L.tyarr([e.typ], outTy)
    }
    case 'not': {
      const t = typecheck(ctx, e.exp)
      if (t.tag !== 'bool') {
        throw new Error(`Type error: expected bool but found ${L.prettyTyp(t)}`)
      }
      return L.tybool
    }
    case 'plus': {
      const t1 = typecheck(ctx, e.e1)
      const t2 = typecheck(ctx, e.e2)
      if (t1.tag !== 'nat' || t2.tag !== 'nat') {
        throw new Error(`Type error: expected nat but found ${L.prettyTyp(t1)} and ${L.prettyTyp(t2)}`)
      }
      return L.tynat
    }
    case 'eq': {
      const t1 = typecheck(ctx, e.e1)
      const t2 = typecheck(ctx, e.e2)
      if (t1.tag !== 'bool' || t2.tag !== 'bool') {
        throw new Error(`Type error: expected bool but found ${L.prettyTyp(t1)} and ${L.prettyTyp(t2)}`)
      }
      return L.tybool
    }
    case 'and': {
      const t1 = typecheck(ctx, e.e1)
      const t2 = typecheck(ctx, e.e2)
      if (t1.tag !== 'bool' || t2.tag !== 'bool') {
        throw new Error(`Type error: expected bool but found ${L.prettyTyp(t1)} and ${L.prettyTyp(t2)}`)
      }
      return L.tybool
    }
    case 'or': {
      const t1 = typecheck(ctx, e.e1)
      const t2 = typecheck(ctx, e.e2)
      if (t1.tag !== 'bool' || t2.tag !== 'bool') {
        throw new Error(`Type error: expected bool but found ${L.prettyTyp(t1)} and ${L.prettyTyp(t2)}`)
      }
      return L.tybool
    }
    case 'app': {
      const thead = typecheck(ctx, e.head)
      const targs = e.args.map(arg => typecheck(ctx, arg))
      if (thead.tag !== 'arr') {
        throw new Error(`Type error: expected arrow type but found '${L.prettyTyp(thead)}'`)
      } else if (thead.inputs.length !== targs.length) {
        throw new Error(`Type error: expected ${thead.inputs.length} arguments but found ${targs.length}`)
      } else {
        thead.inputs.forEach((t, i) => {
          if (!L.typEquals(t, targs[i])) {
            throw new Error(`Type error: expected ${L.prettyTyp(t)} but found ${L.prettyTyp(targs[i])}`)
          }
        })
        return thead.output
      }
    }
    case 'if': {
      const t1 = typecheck(ctx, e.e1)
      const t2 = typecheck(ctx, e.e2)
      const t3 = typecheck(ctx, e.e3)
      if (t1.tag !== 'bool') {
        throw new Error(expectedTypeMsg('bool', 1, 'if', t1.tag))
      } else if (t2.tag !== t3.tag) {
        throw new Error(expectedTypeMsg(t2.tag, 3, 'if', t3.tag))
      }
      return t3
    }
    case 'pair': {
      const t1 = typecheck(ctx, e.exp1)
      const t2 = typecheck(ctx, e.exp2)
      return L.typair(t1, t2)
    }
    case 'fst': {
      const t = typecheck(ctx, e.exp)
      if (t.tag !== 'pair') {
        throw new Error(`Type error: expected pair but found ${L.prettyTyp(t)}`) 
      } else {
        return t.typ1
      }
    }
    case 'snd': {
      const t = typecheck(ctx, e.exp)
      if (t.tag !== 'pair') {
        throw new Error(`Type error: expected pair but found ${L.prettyTyp(t)}`) 
      } else {
        return t.typ2
      }
    }
    case 'construct': {
      if (ctx.has(e.id)) {
        const typC = ctx.get(e.id)!
        if (e.exps.length === 0){
          return typC
        } else if (typC.tag === 'arr') {
          e.exps.forEach((exp, i) => {
            const t = typecheck(ctx, exp)
            // console.log("what i have"+ L.prettyTyp(t))
            // console.log("what i want"+ L.prettyTyp(typC.inputs[i]))
            if (!L.typEquals(t, typC.inputs[i])) {
              throw new Error(`Type error: expected ${L.prettyTyp(typC.inputs[i])} but found ${L.prettyTyp(t)}`)
            }
          })
          if (typC.output.tag === 'data'){
            return L.tyconstruct(e.id, typC.inputs, typC.output)
          } else{
            throw new Error(`Type error: expected data type but found ${L.prettyTyp(typC.output)}`)
          }
        } else {
          throw new Error(`Type error: constructor with argument not currently supported: ${e.id}`)
        }
      } else{
        throw new Error(`Type error: unbound constructor: ${e.id}`)
      }
      
    }
    case 'match': {
      const t1 = typecheck(ctx, e.exp)
      // this should do it but how does this become non-exhaustive?
      console.log("t1 "+ L.prettyTyp(t1))
      e.pats.forEach(pat => typecheckPattern(ctx, t1, pat))
      const t = typecheck(ctx, e.exps[0])
      const tlist = e.exps.map(exp => typecheck(ctx, exp))
      tlist.forEach((t2) => {
        if (!L.typEquals(t, t2)) {
          throw new Error(`Type error: expected ${L.prettyTyp(t)} but found ${L.prettyTyp(t2)} for match expression`)
        }
      })
      return t
    }
  }
}

export function randomVar (val : string) : boolean {
  if (val === 'true' || val === 'false') {
    return false
  } else if (val.startsWith('"', 0) && val.endsWith('"', val.length - 1)) {
    return false
  } else if (!isNaN(Number(val))) {
    return false
  } else {
    return true
  }
}

export function typecheckPattern (ctx: L.Ctx, exp: L.Typ, pat: L.Pattern) : L.Typ {
  switch (exp.tag) {
    case 'bool': {
      if (pat.tag === 'var' && ( pat.value === 'true' || pat.value === 'false')) {
        return L.tybool
      } else if (pat.tag === 'hole') {
        return L.tybool
      } else if (pat.tag === 'var' && randomVar(pat.value)) {
        ctx.set(pat.value, L.tybool)
        return L.tybool
      } else {
        throw new Error(`Type error: expected bool but found ${L.prettyPat(pat)}`)
      }
    }
    case 'nat': {
      if (pat.tag === 'var' && !isNaN(Number(pat.value))) {
        return L.tynat
      } else if (pat.tag === 'hole') {
        return L.tynat
      } else if (pat.tag === 'var' && randomVar(pat.value)) {
        ctx.set(pat.value, L.tynat)
        return L.tynat
      } else {
        throw new Error(`Type error: expected bool but found ${L.prettyPat(pat)}`)
      }
    }
    case 'str': {
      if (pat.tag === 'var' && pat.value.startsWith('"', 0) && pat.value.endsWith('"', pat.value.length - 1)) {
        return L.tystr
      } else if (pat.tag === 'hole') {
        return L.tystr
      } else if (pat.tag === 'var' && randomVar(pat.value)) {
        ctx.set(pat.value, L.tystr)
        return L.tystr
      } else {
        throw new Error(`Type error: expected str but found ${L.prettyPat(pat)}`)
      }
    } 
    case 'arr': {
      throw new Error(`Type error: typ arr not supported`)
    }
    case 'pair': {
      if (pat.tag === 'list' && pat.patterns.length === 3){
        if (pat.patterns[0].tag === 'var' && pat.patterns[0].value === 'pair') {
          const t1 = typecheckPattern(ctx, exp.typ1, pat.patterns[1])
          const t2 = typecheckPattern(ctx, exp.typ2, pat.patterns[2])
          return L.typair(t1, t2)
        } else {
          throw new Error(`Type error: expected pair but found ${L.prettyPat(pat)}`)
        }
      } else if (pat.tag === 'hole') {
        return exp
      } else {
        throw new Error(`Type error: expected pair with 2 expressions but found ${L.prettyPat(pat)}`)
      }
    }
    case 'data': {
      if (pat.tag === 'var' && ctx.has(pat.value)) {
        const holdT = ctx.get(pat.value)!
        if (holdT.tag === 'data') {
          if (holdT.id === exp.id) {
            return exp
          } else {
            throw new Error(`Type error: expected ${exp.id} but found ${holdT.id}`)
          }
        } else {
          throw new Error(`Type error: expected data type but found ${L.prettyTyp(holdT)}`)
        }
      } else if (pat.tag === 'hole') {
        return exp
      } else if (pat.tag === 'list' && pat.patterns.length >= 1){
        if (pat.patterns[0].tag === 'var' && ctx.has(pat.patterns[0].value)) {
          const holdT = ctx.get(pat.patterns[0].value)!
          if (holdT.tag === 'arr' && holdT.output.tag === 'data') {
            pat.patterns.slice(1).forEach((pat, i) => {
              const t = typecheckPattern(ctx, holdT.inputs[i], pat)
            })
            return exp
          } else if (holdT.tag === 'data') {
            if (holdT.id === exp.id) {
              return exp
            } else {
              throw new Error(`Type error: expected ${exp.id} data type but found ${holdT.id}`)
            }
          } else {
            throw new Error(`Type error: expected data type but found ${L.prettyTyp(holdT)}`)
          }
        } else {
          throw new Error(`Type error: expected var to be in context but found ${L.prettyPat(pat)}`)
        }
      } else if (pat.tag === 'var' && randomVar(pat.value)) {
        ctx.set(pat.value, exp)
        return exp
      } else {
        throw new Error(`Type error: expected data type but found ${L.prettyPat(pat)}`)
      }
      // throw new Error(`Type error: typ data not supported`)
    }
    case 'construct': {
      if (exp.typs.length === 0) {
        if (pat.tag === 'var' && pat.value === exp.id) {
          return exp
        } else if (pat.tag === 'hole'){
          return exp
        } else if (pat.tag === 'var' && randomVar(pat.value)) {
          ctx.set(pat.value, exp)
          return exp
        } else {
          throw new Error(`Type error: expected ${exp.id} but found ${L.prettyPat(pat)}`)
        }
      } else {
        if (pat.tag === 'list' && pat.patterns.length >= 2) {
          if (pat.patterns[0].tag === 'var' && pat.patterns[0].value === exp.id) {
            exp.typs.forEach((typ, i) => {
              const t = typecheckPattern(ctx, typ, pat.patterns[i+1])
              // if (!L.typEquals(t, typ)) {
              //   throw new Error(`Type error: expected ${L.prettyTyp(typ)} but found ${L.prettyTyp(t)}`)
              // }
            })
            // const t1 = typecheckPattern(ctx, exp.typs[0], pat.patterns[1])
            return exp
          } else {
            throw new Error(`Type error: expected ${exp.id} but found ${L.prettyPat(pat)}`)
          }
        } else if (pat.tag === 'hole') {
          return exp
        } else if (pat.tag === 'var' && randomVar(pat.value)) {
          ctx.set(pat.value, exp)
          return exp
        } else {
          throw new Error(`Type error: expected ${exp.id} but found ${L.prettyPat(pat)}`)
        }
      }
      
    }
  }
}

export function checkWF (ctx: L.Ctx, prog: L.Prog): void {
  prog.forEach((s) => {
    switch (s.tag) {
      case 'define': {
        const t = typecheck(ctx, s.exp)
        ctx = L.extendCtx(s.id, t, ctx)
        break
      }
      case 'assign': {
        const t = typecheck(ctx, s.exp)
        if (s.loc.tag !== 'var') {
          throw new Error(`Type Error: assignment to non-location '${L.prettyExp(s.loc)}'`)
        } else if (!ctx.has(s.loc.value)) {
          throw new Error(`Type Error: unbound variable '${s.loc.value}'`)
        } else if (!L.typEquals(t, ctx.get(s.loc.value)!)) {
          throw new Error(`Type Error: expected ${L.prettyTyp(ctx.get(s.loc.value)!)} but found ${L.prettyTyp(t)}`)
        }
        break
      }
      case 'print': {
        typecheck(ctx, s.exp)
        break
      }
      case 'data': {
        if (ctx.has(s.id)) {
          throw new Error(`Type error: duplicate type name '${s.id}'`)
        }
        ctx = L.extendCtx(s.id, L.tydata(s.id, s.cons), ctx)
        s.cons.forEach((cons) => {
          if (cons.typs.length === 0) {
            ctx = L.extendCtx(cons.id, ctx.get(s.id)!, ctx)
          } else {
            cons.typs.forEach((typ) => {
              if (typ.tag === 'data' && !ctx.has(typ.id)) {
                throw new Error(`Type error: unbound type '${typ}'`)
              }
            })
            ctx = L.extendCtx(cons.id, L.tyarr(cons.typs, ctx.get(s.id)!), ctx)
          }
        })
      }
    }
  })
}
