import { describe, expect, it } from "@effect/vitest"
import { Effect, Layer } from "effect"

import * as Mnemonic from "../Mnemonic.ts"
import { SuiSigner, layerFromMnemonic } from "./SuiSigner.ts"

const mnemonicText =
  "test test test test test test test test test test test junk"

describe(import.meta.url, () => {
  it.effect(
    "derives an Ed25519 Sui signer from a mnemonic",
    Effect.fn(function* () {
      const signer = yield* SuiSigner.pipe(
        Effect.provide(
          layerFromMnemonic.pipe(
            Layer.provide(Mnemonic.layerFromText(mnemonicText)),
          ),
        ),
      )

      expect(signer.getKeyScheme()).toBe("ED25519")
      expect(signer.getPublicKey()).toBeDefined()
    }),
  )

  it.effect(
    "signs message bytes with the derived Ed25519 key",
    Effect.fn(function* () {
      const signer = yield* SuiSigner.pipe(
        Effect.provide(
          layerFromMnemonic.pipe(
            Layer.provide(Mnemonic.layerFromText(mnemonicText)),
          ),
        ),
      )

      const message = new TextEncoder().encode("Crosshatch Sui signer test")
      const signature = yield* Effect.promise(() => signer.sign(message))

      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBeGreaterThan(0)
    }),
  )
})
