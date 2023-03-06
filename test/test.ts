import { describe, expect, test } from '@jest/globals'
import * as C from '../src/core'
import * as S from '../src/sexp'
import * as T from '../src/typechecker'
import * as R from '../src/runtime'

describe('an example test suite', () => {
  test('basic addition', () => {
    expect(1 + 1).toBe(2)
  })
  test('prettyExp(e1)', () => {
    expect(C.prettyExp(C.e1)).toBe('(1 + 2)')
  })
  test('prettyExp(e2)', () => {
    expect(C.prettyExp(C.e2)).toBe('(1 == 2)')
  })
  test('prettyExp(e3)', () => {
    expect(C.prettyExp(C.e3)).toBe('(true && false)')
  })
  test('prettyExp(e4)', () => {
    expect(C.prettyExp(C.e4)).toBe('(true || false)')
  })
  test('prettyExp(e5)', () => {
    expect(C.prettyExp(C.e5)).toBe('if true then 1 else 2')
  })
  test('prettyExp(e6)', () => {
    expect(C.prettyExp(C.e6)).toBe('(not true)')
  })
  test('prettyExp(e7)', () => {
    expect(C.prettyExp(C.e7)).toBe('apple')
  })
})

describe('Parser', () => {
  test('e1 test', () => {
    expect(S.parseExp1(S.e1)).toStrictEqual(
      C.plus(
        C.plus(C.num(7), C.num(5)),
        C.plus(C.num(2), C.num(4))
      )
    )
  })
  test('e2 test', () => {
    expect(S.parseExp1(S.e2)).toStrictEqual(
      C.ife(
        C.not(C.eq(C.num(3), C.num(3))),
        C.or(C.bool(true), C.bool(false)),
        C.and(C.bool(false), C.bool(false))
      )
    )
  })
})
const ctx = C.makeEmptyContext()
const env = C.makeEmptyEnv()

describe('Evaluate', () => {
  test('Test 1', () => {
    expect(R.evaluate(S.parseExp1(T.t1), env)).toStrictEqual(C.num(8))
  })
  test('Test 2', () => {
    expect(R.evaluate(S.parseExp1(T.t2), env)).toStrictEqual(C.bool(false))
  })
})

describe('Typechecking', () => {
  test('Test 1', () => {
    expect(T.typecheck(ctx, S.parseExp1(T.t1))).toStrictEqual(C.tynat)
  })
  test('Test 2', () => {
    expect(T.typecheck(ctx, S.parseExp1(T.t2))).toStrictEqual(C.tybool)
  })
})



