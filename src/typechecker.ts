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
    case 'list': {
      if (e.exps.length === 0) {
        const emptyList: L.Typ[] = []
        return L.tylist(emptyList)
      }
      else{
        const t = typecheck(ctx, e.exps[0])
        const tlist = e.exps.map(exp => typecheck(ctx, exp))
        tlist.forEach((t2) => {
          if (!L.typEquals(t, t2)) {
            throw new Error(`Type error: expected ${L.prettyTyp(t)} but found ${L.prettyTyp(t2)}`)
          }
        })
        return L.tylist(tlist)
      }
    }
    case 'head': {
      const t = typecheck(ctx, e.exp)
      if (t.tag !== 'list') {
        throw new Error(`Type error: expected list but found ${L.prettyTyp(t)}`) 
      } else {
        return t.typ[0]
      }
    }
    case 'tail': {
      const t = typecheck(ctx, e.exp)
      if (t.tag !== 'list') {
        throw new Error(`Type error: expected list but found ${L.prettyTyp(t)}`) 
      } else {
        return t // same thing no?
      }
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
    case 'match': {
      const t1 = typecheck(ctx, e.exp)
      // this should do it but how does this become non-exhaustive?
      e.pats.forEach(pat => typecheckPattern(ctx, t1, pat))
      const t2 = typecheck(ctx, e.exps)
      if (t2.tag !== 'list') {
        throw new Error(`Type error: expected list but found ${L.prettyTyp(t2)}`) 
      } else {
        return t2.typ[0]
      }
    }
    case 'cons': {
      const t1 = typecheck(ctx, e.x)
      const t2 = typecheck(ctx, e.xs)
      if (t2.tag !== 'list') {
        throw new Error(`Type error: expected list but found ${L.prettyTyp(t2)}`) 
      } else {
        if (!L.typEquals(t1, t2.typ[0])) {
          throw new Error(`Type error: expected ${L.prettyTyp(t2.typ[0])} for first argument type but found ${L.prettyTyp(t1)}`)
        }
        return L.tylist([t1].concat(t2.typ))
      }
    }
  }
}

export function typecheckPattern (ctx: L.Ctx, exp: L.Typ, pat: L.Pattern) : L.Typ {
  switch (exp.tag) {
    case 'bool': {
      if (pat.tag === 'var' && ( pat.value === 'true' || pat.value === 'false')) {
        return L.tybool
      } else if (pat.tag === 'hole') {
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
      } else {
        throw new Error(`Type error: expected bool but found ${L.prettyPat(pat)}`)
      }
    }
    case 'str': {
      if (pat.tag === 'var' && pat.value.startsWith('"', 0) && pat.value.endsWith('"', pat.value.length - 1)) {
        return L.tystr
      } else if (pat.tag === 'hole') {
        return L.tystr
      } else {
        throw new Error(`Type error: expected str but found ${L.prettyPat(pat)}`)
      }
    } 
    case 'poly': {
      throw new Error(`Type error: typ poly not supported`)
    } 
    case 'arr': {
      throw new Error(`Type error: typ arr not supported`)
    }
    case 'list': {
      if (pat.tag === 'list'){
        if (pat.patterns[0].tag === 'var' && pat.patterns[0].value === 'list') {
          if (pat.patterns.length === 1) {
            return L.tylist([])
          } else {
            const t = typecheckPattern(ctx, exp.typ[0], pat.patterns[1])
            const tlist = pat.patterns.slice(1).map(pat => typecheckPattern(ctx, exp.typ[0], pat))
            tlist.forEach((t2) => {
              if (!L.typEquals(t, t2)) {
                throw new Error(`Type error: expected ${L.prettyTyp(t)} but found ${L.prettyTyp(t2)}`)
              }
            })
            return L.tylist(tlist)
          }
        } else {
          throw new Error(`Type error: expected list but found ${L.prettyPat(pat)}`)
        }
      } else if (pat.tag === 'hole') {
        return exp
      } else {
        throw new Error(`Type error: expected list but found ${L.prettyPat(pat)}`)
      }
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
    }
  })
}
