import { coinWithBalance, Transaction } from "@mysten/sui/transactions"
import { Effect, Schema as S } from "effect"

import * as Scheme from "../Scheme.ts"
import * as SuiAddress from "./SuiAddress.ts"
import * as SuiAsset from "./SuiAsset.ts"
import { SuiSigner } from "./SuiSigner.ts"
import { SuiState } from "./SuiState.ts"

export type Known = typeof Known.Type
export const Known = S.Struct({})

export type Extra = typeof Extra.Type
export const Extra = S.Struct({})

export class SuiScheme extends Scheme.Service<
  SuiScheme,
  Known,
  Extra
>()("@crosshatch/Sui/SuiScheme") {}

export const layer = SuiScheme.layer(
  {
    known: Known,
    extra: Extra,
  },
  () =>
    Effect.fnUntraced(
      function* ({ accepted }) {
        const signer = yield* SuiSigner
        const client = yield* SuiState

        const asset = yield* S.decodeUnknownEffect(
          SuiAsset.SuiAsset,
        )(accepted.asset)

        const payTo = yield* S.decodeUnknownEffect(
          SuiAddress.SuiAddress,
        )(accepted.payTo)

        const transaction = new Transaction()

        transaction.setSender(signer.toSuiAddress())

        transaction.transferObjects(
          [
            coinWithBalance({
              balance: BigInt(accepted.amount),
              type: asset,
            }),
          ],
          payTo,
        )

        const bytes = yield* Effect.promise(() =>
          transaction.build({ client }),
        )

        const signed = yield* Effect.tryPromise({
          try: () => signer.signTransaction(bytes),
          catch: (cause) =>
            new Scheme.CreatePayloadError({ cause }),
        })

        return {
          transaction: signed.bytes,
          signature: signed.signature,
        }
      },
      Effect.mapError(
        (cause) => new Scheme.CreatePayloadError({ cause }),
      ),
    ),
)
