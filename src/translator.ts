import * as S from './sexp'
import * as L from './core'

export function translateTyp (e: S.Sexp): L.Typ {
  if (e.tag === 'atom') {
    if (e.value === 'Nat') {
      return L.tynat
    } else if (e.value === 'Bool') {
      return L.tybool
    } else {
      throw new Error(`Parse error: unknown type '${e.value}'`)
    }
  } else {
    const head = e.exps[0]
    const args = e.exps.slice(1)
    if (head.tag === 'atom' && head.value === '->') {
      if (args.length < 2) {
        throw new Error(`Parse error: '->' expects at least 2 arguments but ${args.length} were given`)
      } else {
        return L.tyarr(args.slice(0, args.length - 1).map(translateTyp), translateTyp(args[args.length - 1]))
      }
    } else {
      throw new Error(`Parse error: unknown type '${S.sexpToString(e)}'`)
    }
  }
}

/** @returns the expression parsed from the given s-expression. */
export function translateExp (e: S.Sexp): L.Exp {
  if (e.tag === 'atom') {
    if (e.value === 'true') {
      return L.bool(true)
    } else if (e.value === 'false') {
      return L.bool(false)
    } else if (/\d+$/.test(e.value)) {
      return L.num(parseInt(e.value))
    } else {
      // N.B., any other chunk of text will be considered a variable
      return L.evar(e.value)
    }
  } else if (e.exps.length === 0) {
    throw new Error('Parse error: empty expression list encountered')
  } else {
    const head = e.exps[0]
    const args = e.exps.slice(1)
    if (head.tag === 'atom' && head.value === 'lambda') {
      if (args.length !== 3) {
        throw new Error(`Parse error: 'lambda' expects 3 arguments but ${args.length} were given`)
      } else if (args[0].tag !== 'atom') {
        throw new Error(`Parse error: 'lambda' expects its first argument to be an identifier but ${S.sexpToString(args[0])} was given`)
      } else {
        return L.lam(args[0].value, translateTyp(args[1]), translateExp(args[2]))
      }
    } else if (head.tag === 'atom' && head.value === 'if') {
      if (args.length !== 3) {
        throw new Error(`Parse error: 'if' expects 3 arguments but ${args.length} were given`)
      } else {
        return L.ife(translateExp(args[0]), translateExp(args[1]), translateExp(args[2]))
      }
    // } else if (head.tag === 'atom' && head.value === 'rec') {
    //   if (args.length % 2 !== 0) {
    //     throw new Error(`Parse error: 'rec' expects an even number of arguments but ${args.length} were given`)
    //   } else {
    //     const outMap = new Map<string, L.Exp>()
    //     for (let i = 0; i < args.length; i += 2) {
    //       const hold = args[i]
    //       if (hold.tag !== 'atom') {
    //         throw new Error(`Parse error: 'rec' expects its ${i}th argument to be an identifier but ${S.sexpToString(args[i])} was given`)
    //       } else {
    //         outMap.set(hold.value, translateExp(args[i + 1]))
    //       }
    //     }
    //     return L.rec(outMap)
    //   }

    // } else if (head.tag === 'atom' && head.value === 'field') {
    //   if (args.length !== 2) {
    //     throw new Error(`Parse error: 'field' expects 2 arguments but ${args.length} were given`)
    //   } else if (args[1].tag === 'atom') {
    //     const hold = args[1];
    //     return L.field(translateExp(args[0]), hold.value)
    //   } else {
    //     throw new Error(`Parse error: 'field' expects its second argument to be an identifier but ${S.sexpToString(args[1])} was given`)
    //   }
    } else {
      return L.app(translateExp(head), args.map(translateExp))
    }
  }
}

export function translateStmt (e: S.Sexp): L.Stmt {
  if (e.tag === 'atom') {
    throw new Error(`Parse error: an atom cannot be a statement: '${e.value}'`)
  } else {
    const head = e.exps[0]
    const args = e.exps.slice(1)
    if (head.tag !== 'atom') {
      throw new Error('Parse error: identifier expected at head of operator/form')
    } else if (head.value === 'define') {
      if (args.length !== 2) {
        throw new Error(`Parse error: 'define' expects 2 argument but ${args.length} were given`)
      } else if (args[0].tag !== 'atom') {
        throw new Error("Parse error: 'define' expects its first argument to be an identifier")
      } else {
        return L.sdefine(args[0].value, translateExp(args[1]))
      }
    } else if (head.value === 'assign') {
      if (args.length !== 2) {
        throw new Error(`Parse error: 'assign' expects 2 argument but ${args.length} were given`)
      } else {
        return L.sassign(translateExp(args[0]), translateExp(args[1]))
      }
    } else if (head.value === 'print') {
      if (args.length !== 1) {
        throw new Error(`Parse error: 'print' expects 1 argument but ${args.length} were given`)
      } else {
        return L.sprint(translateExp(args[0]))
      }
    } else {
      throw new Error(`Parse error: unknown statement form '${S.sexpToString(e)}'`)
    }
  }
}

export function translateProg (es: S.Sexp[]): L.Prog {
  return es.map(translateStmt)
}