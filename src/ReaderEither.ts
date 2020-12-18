/**
 * @since 3.0.0
 */
import { Alt3, Alt3C } from './Alt'
import { Applicative3, Applicative3C } from './Applicative'
import { apFirst_, apSecond_, apS_ } from './Apply'
import { Bifunctor3 } from './Bifunctor'
import * as E from './Either'
import { flow, identity, pipe, Predicate, Refinement, tuple } from './function'
import { bindTo_, Functor3 } from './Functor'
import { bind_, chainFirst_, Monad3 } from './Monad'
import { MonadThrow3 } from './MonadThrow'
import { Monoid } from './Monoid'
import { Option } from './Option'
import * as R from './Reader'
import { Semigroup } from './Semigroup'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

import Either = E.Either
import Reader = R.Reader

/**
 * @category model
 * @since 3.0.0
 */
export interface ReaderEither<R, E, A> extends Reader<R, Either<E, A>> {}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 3.0.0
 */
export const left: <R, E = never, A = never>(e: E) => ReaderEither<R, E, A> =
  /*#__PURE__*/
  flow(E.left, R.of)

/**
 * @category constructors
 * @since 3.0.0
 */
export const right: <R, E = never, A = never>(a: A) => ReaderEither<R, E, A> =
  /*#__PURE__*/
  flow(E.right, R.of)

/**
 * @category constructors
 * @since 3.0.0
 */
export const rightReader: <R, E = never, A = never>(ma: Reader<R, A>) => ReaderEither<R, E, A> =
  /*#__PURE__*/
  R.map(E.right)

/**
 * @category constructors
 * @since 3.0.0
 */
export const leftReader: <R, E = never, A = never>(me: Reader<R, E>) => ReaderEither<R, E, A> =
  /*#__PURE__*/
  R.map(E.left)

/**
 * @category constructors
 * @since 3.0.0
 */
export const ask: <R, E = never>() => ReaderEither<R, E, R> = () => E.right

/**
 * @category constructors
 * @since 3.0.0
 */
export const asks: <R, E = never, A = never>(f: (r: R) => A) => ReaderEither<R, E, A> = (f) => flow(f, E.right)

/**
 * Derivable from `MonadThrow`.
 *
 * @category constructors
 * @since 3.0.0
 */
export const fromEither: <R, E, A>(ma: E.Either<E, A>) => ReaderEither<R, E, A> =
  /*#__PURE__*/
  E.fold(left, (a) => right(a))

/**
 * Derivable from `MonadThrow`.
 *
 * @category constructors
 * @since 3.0.0
 */
export const fromOption: <E>(onNone: () => E) => <R, A>(ma: Option<A>) => ReaderEither<R, E, A> = (onNone) => (ma) =>
  ma._tag === 'None' ? left(onNone()) : right(ma.value)

/**
 * Derivable from `MonadThrow`.
 *
 * @category constructors
 * @since 3.0.0
 */
export const fromPredicate: {
  <A, B extends A, E>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <U>(a: A) => ReaderEither<U, E, B>
  <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E): <R>(a: A) => ReaderEither<R, E, A>
} = <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E) => (a: A) => (predicate(a) ? right(a) : left(onFalse(a)))

// -------------------------------------------------------------------------------------
// destructors
// -------------------------------------------------------------------------------------

/**
 * @category destructors
 * @since 3.0.0
 */
export const fold: <E, R, B, A>(
  onLeft: (e: E) => Reader<R, B>,
  onRight: (a: A) => Reader<R, B>
) => (ma: ReaderEither<R, E, A>) => Reader<R, B> =
  /*#__PURE__*/
  flow(E.fold, R.chain)

/**
 * Less strict version of [`getOrElse`](#getOrElse).
 *
 * @category destructors
 * @since 3.0.0
 */
export const getOrElseW = <E, R2, B>(onLeft: (e: E) => Reader<R2, B>) => <R1, A>(
  ma: ReaderEither<R1, E, A>
): Reader<R1 & R2, A | B> => pipe(ma, R.chain(E.fold<E, R.Reader<R1 & R2, A | B>, A>(onLeft, R.of)))

/**
 * @category destructors
 * @since 3.0.0
 */
export const getOrElse: <E, R, A>(
  onLeft: (e: E) => Reader<R, A>
) => (ma: ReaderEither<R, E, A>) => Reader<R, A> = getOrElseW

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 3.0.0
 */
export const orElse: <E1, R, E2, A>(
  onLeft: (e: E1) => ReaderEither<R, E2, A>
) => (ma: ReaderEither<R, E1, A>) => ReaderEither<R, E2, A> = (f) => R.chain(E.fold(f, right))

/**
 * @category combinators
 * @since 3.0.0
 */
export const swap: <R, E, A>(ma: ReaderEither<R, E, A>) => ReaderEither<R, A, E> =
  /*#__PURE__*/
  R.map(E.swap)

/**
 * @category combinators
 * @since 3.0.0
 */
export function fromEitherK<E, A extends ReadonlyArray<unknown>, B>(
  f: (...a: A) => Either<E, B>
): <R>(...a: A) => ReaderEither<R, E, B> {
  return (...a) => fromEither(f(...a))
}

/**
 * Less strict version of [`chainEitherK`](#chainEitherK).
 *
 * @category combinators
 * @since 3.0.0
 */
export const chainEitherKW: <A, E2, B>(
  f: (a: A) => Either<E2, B>
) => <R, E1>(ma: ReaderEither<R, E1, A>) => ReaderEither<R, E1 | E2, B> = (f) => chainW(fromEitherK(f))

/**
 * @category combinators
 * @since 3.0.0
 */
export const chainEitherK: <E, A, B>(
  f: (a: A) => Either<E, B>
) => <R>(ma: ReaderEither<R, E, A>) => ReaderEither<R, E, B> = chainEitherKW

/**
 * Less strict version of [`filterOrElse`](#filterOrElse).
 *
 * @since 3.0.0
 */
export const filterOrElseW: {
  <A, B extends A, E2>(refinement: Refinement<A, B>, onFalse: (a: A) => E2): <R, E1>(
    ma: ReaderEither<R, E1, A>
  ) => ReaderEither<R, E1 | E2, B>
  <A, E2>(predicate: Predicate<A>, onFalse: (a: A) => E2): <R, E1>(
    ma: ReaderEither<R, E1, A>
  ) => ReaderEither<R, E1 | E2, A>
} = <A, E2>(
  predicate: Predicate<A>,
  onFalse: (a: A) => E2
): (<R, E1>(ma: ReaderEither<R, E1, A>) => ReaderEither<R, E1 | E2, A>) =>
  chainW((a) => (predicate(a) ? right(a) : left(onFalse(a))))

/**
 * Derivable from `MonadThrow`.
 *
 * @category combinators
 * @since 3.0.0
 */
export const filterOrElse: {
  <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <R>(
    ma: ReaderEither<R, E, A>
  ) => ReaderEither<R, E, B>
  <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): <R>(ma: ReaderEither<R, E, A>) => ReaderEither<R, E, A>
} = filterOrElseW

/**
 * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
 * use the type constructor `F` to represent some computational context.
 *
 * @category Functor
 * @since 3.0.0
 */
export const map: <A, B>(f: (a: A) => B) => <R, E>(fa: ReaderEither<R, E, A>) => ReaderEither<R, E, B> = (f) =>
  R.map(E.map(f))

/**
 * Map a pair of functions over the two last type arguments of the bifunctor.
 *
 * @category Bifunctor
 * @since 3.0.0
 */
export const bimap: Bifunctor3<URI>['bimap'] =
  /*#__PURE__*/
  flow(E.bimap, R.map)

/**
 * Map a function over the second type argument of a bifunctor.
 *
 * @category Bifunctor
 * @since 3.0.0
 */
export const mapLeft: Bifunctor3<URI>['mapLeft'] = (f) => (fa) => (r) => pipe(fa(r), E.mapLeft(f))

/**
 * Less strict version of [`ap`](#ap).
 *
 * @category Apply
 * @since 3.0.0
 */
export const apW = <R2, E2, A>(
  fa: ReaderEither<R2, E2, A>
): (<R1, E1, B>(fab: ReaderEither<R1, E1, (a: A) => B>) => ReaderEither<R1 & R2, E1 | E2, B>) =>
  flow(
    R.map((gab) => (ga: E.Either<E2, A>) => E.apW(ga)(gab)),
    R.apW(fa)
  )

/**
 * Apply a function to an argument under a type constructor.
 *
 * @category Apply
 * @since 3.0.0
 */
export const ap: Applicative3<URI>['ap'] = apW

/**
 * Wrap a value into the type constructor.
 *
 * Equivalent to [`right`](#right).
 *
 * @category Applicative
 * @since 3.0.0
 */
export const of: Applicative3<URI>['of'] = right

/**
 * Less strict version of [`chain`](#chain).
 *
 * @category Monad
 * @since 3.0.0
 */
export const chainW = <A, R2, E2, B>(f: (a: A) => ReaderEither<R2, E2, B>) => <R1, E1>(
  ma: ReaderEither<R1, E1, A>
): ReaderEither<R1 & R2, E1 | E2, B> => pipe(ma, R.chain(E.fold<E1, ReaderEither<R1 & R2, E1 | E2, B>, A>(left, f)))

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation.
 *
 * @category Monad
 * @since 3.0.0
 */
export const chain: Monad3<URI>['chain'] = chainW

/**
 * Derivable from `Monad`.
 *
 * @category derivable combinators
 * @since 3.0.0
 */
export const flatten: <R, E, A>(mma: ReaderEither<R, E, ReaderEither<R, E, A>>) => ReaderEither<R, E, A> =
  /*#__PURE__*/
  chain(identity)

/**
 * Less strict version of [`alt`](#alt).
 *
 * @category Alt
 * @since 3.0.0
 */
export const altW = <R2, E2, B>(second: () => ReaderEither<R2, E2, B>) => <R1, E1, A>(
  first: ReaderEither<R1, E1, A>
): ReaderEither<R1 & R2, E1 | E2, A | B> =>
  pipe(first, R.chain(E.fold<E1, ReaderEither<R1 & R2, E1 | E2, A | B>, A>(second, right)))

/**
 * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
 * types of kind `* -> *`.
 *
 * @category Alt
 * @since 3.0.0
 */
export const alt: Alt3<URI>['alt'] = altW

/**
 * @category MonadThrow
 * @since 3.0.0
 */
export const throwError: MonadThrow3<URI>['throwError'] = left

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * @category instances
 * @since 3.0.0
 */
export const URI = 'ReaderEither'

/**
 * @category instances
 * @since 3.0.0
 */
export type URI = typeof URI

declare module './HKT' {
  interface URItoKind3<R, E, A> {
    readonly [URI]: ReaderEither<R, E, A>
  }
}

/**
 * Semigroup returning the left-most non-`Left` value. If both operands are `Right`s then the inner values are
 * concatenated using the provided `Semigroup`
 *
 * @category instances
 * @since 3.0.0
 */
export function getSemigroup<R, E, A>(S: Semigroup<A>): Semigroup<ReaderEither<R, E, A>> {
  return R.getSemigroup(E.getSemigroup(S))
}

/**
 * Semigroup returning the left-most `Left` value. If both operands are `Right`s then the inner values
 * are concatenated using the provided `Semigroup`
 *
 * @category instances
 * @since 3.0.0
 */
export function getApplySemigroup<R, E, A>(S: Semigroup<A>): Semigroup<ReaderEither<R, E, A>> {
  return R.getSemigroup(E.getApplySemigroup(S))
}

/**
 * @category instances
 * @since 3.0.0
 */
export function getApplyMonoid<R, E, A>(M: Monoid<A>): Monoid<ReaderEither<R, E, A>> {
  return {
    concat: getApplySemigroup<R, E, A>(M).concat,
    empty: right(M.empty)
  }
}

/**
 * @category instances
 * @since 3.0.0
 */
export function getApplicativeReaderValidation<E>(SE: Semigroup<E>): Applicative3C<URI, E> {
  const AV = E.getApplicativeValidation(SE)
  const ap = <EF, A>(
    fga: R.Reader<EF, E.Either<E, A>>
  ): (<B>(fgab: R.Reader<EF, E.Either<E, (a: A) => B>>) => R.Reader<EF, E.Either<E, B>>) =>
    flow(
      R.map((gab) => (ga: E.Either<E, A>) => pipe(gab, AV.ap(ga))),
      R.ap(fga)
    )
  return {
    URI,
    map,
    ap,
    of
  }
}

/**
 * @category instances
 * @since 3.0.0
 */
export function getAltReaderValidation<E>(SE: Semigroup<E>): Alt3C<URI, E> {
  const A = E.getAltValidation(SE)
  return {
    URI,
    map,
    alt: (second) => (first) => (r) =>
      pipe(
        first(r),
        A.alt(() => second()(r))
      )
  }
}

/**
 * @category instances
 * @since 3.0.0
 */
export const Functor: Functor3<URI> = {
  URI,
  map
}

/**
 * @category instances
 * @since 3.0.0
 */
export const Applicative: Applicative3<URI> = {
  URI,
  map,
  ap,
  of
}

/**
 * Combine two effectful actions, keeping only the result of the first.
 *
 * Derivable from `Apply`.
 *
 * @category derivable combinators
 * @since 3.0.0
 */
export const apFirst: <R, E, B>(
  second: ReaderEither<R, E, B>
) => <A>(first: ReaderEither<R, E, A>) => ReaderEither<R, E, A> =
  /*#__PURE__*/
  apFirst_(Applicative)

/**
 * Combine two effectful actions, keeping only the result of the second.
 *
 * Derivable from `Apply`.
 *
 * @category derivable combinators
 * @since 3.0.0
 */
export const apSecond: <R, E, B>(
  second: ReaderEither<R, E, B>
) => <A>(first: ReaderEither<R, E, A>) => ReaderEither<R, E, B> =
  /*#__PURE__*/
  apSecond_(Applicative)

/**
 * @category instances
 * @since 3.0.0
 */
export const Monad: Monad3<URI> = {
  URI,
  map,
  of,
  chain
}

/**
 * Less strict version of [`chainFirst`](#chainFirst)
 *
 * @category combinators
 * @since 3.0.0
 */
export const chainFirstW: <A, R2, E2, B>(
  f: (a: A) => ReaderEither<R2, E2, B>
) => <R1, E1>(first: ReaderEither<R1, E1, A>) => ReaderEither<R1 & R2, E1 | E2, A> =
  /*#__PURE__*/
  chainFirst_(Monad) as any

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation and
 * keeping only the result of the first.
 *
 * Derivable from `Monad`.
 *
 * @category derivable combinators
 * @since 3.0.0
 */
export const chainFirst: <A, R, E, B>(
  f: (a: A) => ReaderEither<R, E, B>
) => (first: ReaderEither<R, E, A>) => ReaderEither<R, E, A> = chainFirstW

/**
 * @category instances
 * @since 3.0.0
 */
export const Bifunctor: Bifunctor3<URI> = {
  URI,
  bimap,
  mapLeft
}

/**
 * @category instances
 * @since 3.0.0
 */
export const Alt: Alt3<URI> = {
  URI,
  map,
  alt
}

/**
 * @category instances
 * @since 3.0.0
 */
export const MonadThrow: MonadThrow3<URI> = {
  URI,
  throwError
}

// -------------------------------------------------------------------------------------
// do notation
// -------------------------------------------------------------------------------------

/**
 * @since 3.0.0
 */
export const Do: ReaderEither<unknown, never, {}> = of({})

/**
 * @since 3.0.0
 */
export const bindTo: <N extends string>(
  name: N
) => <R, E, A>(fa: ReaderEither<R, E, A>) => ReaderEither<R, E, { [K in N]: A }> =
  /*#__PURE__*/
  bindTo_(Functor)

/**
 * @since 3.0.0
 */
export const bindW: <N extends string, A, R2, E2, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderEither<R2, E2, B>
) => <R1, E1>(
  fa: ReaderEither<R1, E1, A>
) => ReaderEither<R1 & R2, E1 | E2, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> =
  /*#__PURE__*/
  bind_(Monad) as any

/**
 * @since 3.0.0
 */
export const bind: <N extends string, A, R, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderEither<R, E, B>
) => (fa: ReaderEither<R, E, A>) => ReaderEither<R, E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = bindW

// -------------------------------------------------------------------------------------
// pipeable sequence S
// -------------------------------------------------------------------------------------

/**
 * @since 3.0.0
 */
export const apSW: <A, N extends string, R2, E2, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderEither<R2, E2, B>
) => <R1, E1>(
  fa: ReaderEither<R1, E1, A>
) => ReaderEither<R1 & R2, E1 | E2, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> =
  /*#__PURE__*/
  apS_(Applicative) as any

/**
 * @since 3.0.0
 */
export const apS: <A, N extends string, R, E, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderEither<R, E, B>
) => (fa: ReaderEither<R, E, A>) => ReaderEither<R, E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = apSW

// -------------------------------------------------------------------------------------
// pipeable sequence T
// -------------------------------------------------------------------------------------

/**
 * @since 3.0.0
 */
export const ApT: ReaderEither<unknown, never, readonly []> = of([])

/**
 * @since 3.0.0
 */
export const tupled: <R, E, A>(a: ReaderEither<R, E, A>) => ReaderEither<R, E, readonly [A]> = map(tuple)

/**
 * @since 3.0.0
 */
export const apTW = <R2, E2, B>(fb: ReaderEither<R2, E2, B>) => <R1, E1, A extends ReadonlyArray<unknown>>(
  fas: ReaderEither<R1, E1, A>
): ReaderEither<R1 & R2, E1 | E2, readonly [...A, B]> =>
  pipe(
    fas,
    map((a) => (b: B): readonly [...A, B] => [...a, b]),
    apW(fb)
  )

/**
 * @since 3.0.0
 */
export const apT: <R, E, B>(
  fb: ReaderEither<R, E, B>
) => <A extends ReadonlyArray<unknown>>(fas: ReaderEither<R, E, A>) => ReaderEither<R, E, readonly [...A, B]> = apTW

// -------------------------------------------------------------------------------------
// array utils
// -------------------------------------------------------------------------------------

/**
 * @since 3.0.0
 */
export const traverseArrayWithIndex: <R, E, A, B>(
  f: (index: number, a: A) => ReaderEither<R, E, B>
) => (arr: ReadonlyArray<A>) => ReaderEither<R, E, ReadonlyArray<B>> = (f) =>
  flow(R.traverseArrayWithIndex(f), R.map(E.sequenceArray))

/**
 * @since 3.0.0
 */
export const traverseArray: <R, E, A, B>(
  f: (a: A) => ReaderEither<R, E, B>
) => (arr: ReadonlyArray<A>) => ReaderEither<R, E, ReadonlyArray<B>> = (f) => traverseArrayWithIndex((_, a) => f(a))

/**
 * @since 3.0.0
 */
export const sequenceArray: <R, E, A>(
  arr: ReadonlyArray<ReaderEither<R, E, A>>
) => ReaderEither<R, E, ReadonlyArray<A>> = traverseArray(identity)
