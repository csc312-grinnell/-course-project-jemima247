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
    } else if (head.tag === 'atom' && head.value === 'list') {
      if (args.length === 0) {
        return L.tylist([])
      } else {
        return L.tylist(args.map(translateTyp))
      }
    } else if (head.tag === 'atom' && head.value === 'cons') {
      if (args.length !== 2) {
        throw new Error(`Parse error: 'cons' expects 2 arguments but ${args.length} were given`)
      } else {
        return L.typair(translateTyp(args[0]), translateTyp(args[1]))
      }
    } else if (head.tag === 'atom' && head.value === 'forall') {
      if (args.length !== 1) {
        throw new Error(`Parse error: 'forall' expects 1 argument but ${args.length} were given`)
      } else if (args[0].tag !== 'atom') {
        throw new Error(`Parse error: 'forall' expects an id name but '${S.sexpToString(args[0])}' was given`)
      } else {
        return L.typoly(args[0].value)
      }
    } else {
      throw new Error(`Parse error: unknown type '${S.sexpToString(e)}'`)
    }
  }
}

export function translatePattern (e: S.Sexp): L.Pattern {
  if (e.tag === 'atom') {
    if (e.value === "_") {
      return L.hole()
    } else {
      return L.evar(e.value)
    }
  } else {
    return L.patternList(e.exps.map(translatePattern))
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
    } else if (head.tag === 'atom' && head.value === 'list') {
        if (args.length === 0) {
          return L.list([])
        } else {
          return L.list(args.map(translateExp))
        }
    } else if (head.tag === 'atom' && head.value === 'head') {
      if (args.length !== 1) {
        throw new Error(`Parse error: 'head' expects 1 argument but ${args.length} were given`)
      } else {
        return L.head(translateExp(args[0]))
      }
    } else if (head.tag === 'atom' && head.value === 'tail') {
      if (args.length !== 1) {
        throw new Error(`Parse error: 'tail' expects 1 argument but ${args.length} were given`)
      } else {
        return L.tail(translateExp(args[0]))
      }
    } else if (head.tag === 'atom' && head.value === 'cons') {
      if (args.length !== 2) {
        throw new Error(`Parse error: 'cons' expects 2 argument but ${args.length} were given`)
      } else {
        return L.pair(translateExp(args[0]), translateExp(args[1]))
      }
    } else if (head.tag === 'atom' && head.value === 'fst') {
      if (args.length !== 1) {
        throw new Error(`Parse error: 'fst' expects 1 argument but ${args.length} were given`)
      } else {
        return L.fst(translateExp(args[0]))
      }
    } else if (head.tag === 'atom' && head.value === 'snd') {
      if (args.length !== 1) {
        throw new Error(`Parse error: 'snd' expects 1 argument but ${args.length} were given`)
      } else {
        return L.snd(translateExp(args[0]))
      }
    } else if (head.tag === 'atom' && head.value === 'match') {
      if (args.length !== 2) {
        throw new Error(`Parse error: 'match' expects 2 argument but ${args.length} were given`)
      } else {
        const expM = translateExp(args[0])
        if (args[1].tag === 'atom'){
          throw new Error(`Parse error: 'match' expects a list of pattern and expression but ${S.sexpToString(args[1])} was given`)
        } else {
          if (args[1].exps.length % 2 !== 0) {
            throw new Error(`Parse error: 'match' expects an even number of list arguments but ${args[1].exps.length} were given`)
          } else {
            // const outMap = new Map<L.Pattern, L.Exp>() 
            let holdp: L.Pattern[] = [];
            let holdexp: L.Exp[] = [];
            let listArgs = args[1].exps;
            for (let i = 0; i < listArgs.length; i += 2) {
              const holdpat = translatePattern(listArgs[i])
              const exp = translateExp(listArgs[i + 1])
              // outMap.set(holdp, exp)
              holdp.push(holdpat)
              holdexp.push(exp)
            }
            return L.match(expM, holdp, L.list(holdexp))
          }
        }
      }
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
