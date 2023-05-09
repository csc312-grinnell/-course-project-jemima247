import { describe, expect, test } from '@jest/globals'
import * as L from '../src/core'
import * as Sexp from '../src/sexp'
import * as Trans from '../src/translator'
import * as TC from '../src/typechecker'
import * as Interp from '../src/interpreter'
import * as Runtime from '../src/runtime'

function compile (src: string, typecheck: boolean = false): L.Prog {
  const prog = Trans.translateProg(Sexp.parse(src))
  if (typecheck) {
    TC.checkWF(Runtime.initialCtx, prog)
  }
  return prog
}

function compileAndPrint (src: string, typecheck: boolean = false): string {
  return L.prettyProg(compile(src, typecheck))
}

function compileAndInterpret (src: string, typecheck: boolean = false): Interp.Output {
  return Interp.execute(Runtime.makeInitialEnv(), compile(src, typecheck))
}

const prog1 = `
  (define x 1)
  (define y 1)
  (print (+ x y))
  (assign x 10)
  (print (- x y))
  (define tList (list 1 2 3))
  (print (head tList))
  (print (tail tList))
`

const prog2 = `
  (define result 0)
  (define empList (list))
  (print empList)
  (define factorial
    (lambda n Nat
      (if (zero? n)
          1
          (* n (factorial (- n 1))))))
  (assign result (factorial 5))
  (print result)
`

const prog3 = `
  (define apple 
    (lambda x Nat
      (match (list (% x 5) (% x 3))
      ( (cons 0 (cons 0 (list))) "fizzbuzz"
        (list _ 0) "fizz"
        (list 0 _) "buzz"
        _ "apple"))))
  (print (apple 15))
`


describe('interpretation', () => {
  test('prog1', () => {
    expect(compileAndInterpret(prog1, true)).toStrictEqual(['2', '9', '1', '(list 2 3)'])
  })
  test('prog2', () => {
    expect(compileAndInterpret(prog2, false)).toStrictEqual(['(list )','120'])
  })
  test('prog3', () => {
    expect(compileAndInterpret(prog3, true)).toStrictEqual(['\"fizzbuzz\"'])
  })
})
