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

// const prog3 = `
//   (define ts1 (rec a 1 b 2 c 3))
//   (define tsF (lambda x (Rec a Nat b Nat) (field x a)))
//   (print (tsF (rec a 1 b 2 c 3)))
// `

// describe('an example test suite', () => {
//   test('basic addition', () => {
//     expect(1 + 1).toBe(2)
//   })
//   test('prettyExp(e1)', () => {
//     expect(L.prettyExp(L.e1)).toBe('(+ 1 2)')
//   })
//   test('prettyExp(e2)', () => {
//     expect(L.prettyExp(L.e2)).toBe('(eq 1 2)')
//   })
//   test('prettyExp(e3)', () => {
//     expect(L.prettyExp(L.e3)).toBe('(&& true false)')
//   })
//   test('prettyExp(e4)', () => {
//     expect(L.prettyExp(L.e4)).toBe('(|| true false)')
//   })
//   test('prettyExp(e5)', () => {
//     expect(L.prettyExp(L.e5)).toBe('(if true 1 2)')
//   })
//   test('prettyExp(e6)', () => {
//     expect(L.prettyExp(L.e6)).toBe('(not true)')
//   })
//   test('prettyExp(e7)', () => {
//     expect(L.prettyExp(L.e7)).toBe('apple')
//   })
// })

describe('interpretation', () => {
  test('prog1', () => {
    expect(compileAndInterpret(prog1, true)).toStrictEqual(['1','2', '9'])
  })
  // test('prog2', () => {
  //   expect(compileAndInterpret(prog2, false)).toStrictEqual(['120'])
  // })
  // test('prog3', () => {
  //   expect(compileAndInterpret(prog3, false)).toStrictEqual(['1'])
  // })
})
