import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519"
import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils"
import { Effect, Schema as S } from "effect"

import * as Address from "../Address.ts"
import { Ed25519Pair, Slip10 } from "../Crypto/index.ts"
import * as Mnemonic from "../Mnemonic.ts"
import { brand } from "./_common.ts"

export type SuiAddress = typeof SuiAddress.Type

export const SuiAddress = S.String.check(
  S.makeFilter(isValidSuiAddress, {
    expected: "a valid Sui address",
  }),
).pipe(Address.brand, brand)

export const fromPublicKey = (publicKey: CryptoKey) =>
  Effect.promise(() => crypto.subtle.exportKey("raw", publicKey)).pipe(
    Effect.map((raw) => {
      const suiPublicKey = new Ed25519PublicKey(new Uint8Array(raw))

      return SuiAddress.make(
        normalizeSuiAddress(suiPublicKey.toSuiAddress()),
        { disableChecks: true },
      )
    }),
  )

export const fromMnemonic = (
  mnemonic: Mnemonic.Mnemonic,
): Effect.Effect<SuiAddress, S.SchemaError> =>
  Slip10.derive(
    Mnemonic.toSeed(mnemonic),
    [44, 784, 0, 0, 0],
  ).pipe(
    Effect.flatMap(({ privateKeySeed }) =>
      Ed25519Pair.fromSeed(privateKeySeed),
    ),
    Effect.flatMap(({ publicKey }) => fromPublicKey(publicKey)),
  )
