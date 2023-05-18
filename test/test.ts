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
`

const prog2 = `
  (define result 0)
  (define factorial
    (lambda n Nat
      (if (zero? n)
          1
          (* n (factorial (- n 1))))))
  (assign result (factorial 5))
  (print result)
`

const prog4 = `
  (data List (construct Nil) (construct Cons Nat List))
  (data ListBool (construct NilB) (construct ConsB Bool ListBool))
  (define ap (construct Cons 5 (construct Cons 3 (construct Nil))))
  (define bp (construct ConsB true (construct ConsB false (construct NilB))))
  (print ap)
  (print bp)
  (define apple 
    (lambda x Nat
      (match (construct Cons (% x 5) (construct Cons (% x 3) (construct Nil)))
      ( (Cons 0 (Cons 0 (Nil))) "fizzbuzz"
        (Cons _ (Cons 0 (Nil))) "fizz"
        (Cons 0 _) "buzz"
        _ "apple"))))
  (print (apple 15))
`


describe('interpretation', () => {
  test('prog1', () => {
    expect(compileAndInterpret(prog1, true)).toStrictEqual(['2', '9'])
  })
  test('prog2', () => {
    expect(compileAndInterpret(prog2, false)).toStrictEqual(['120'])
  })
  test('prog4', () => {
    expect(compileAndInterpret(prog4, true)).toStrictEqual(['(Cons 5 (Cons 3 (Nil)))', '(ConsB true (ConsB false (NilB)))', '\"fizzbuzz\"'])
  })
})
