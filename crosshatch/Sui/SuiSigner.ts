import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519"
import {
  Signer as SuiSdkSigner,
  type SignatureScheme,
} from "@mysten/sui/cryptography"

import { Context, Effect, Layer } from "effect"

import * as Ed25519Pair from "../Crypto/Ed25519Pair.ts"
import * as Ed25519PrivateKey from "../Crypto/Ed25519PrivateKey.ts"
import * as Slip10 from "../Crypto/Slip10.ts"
import * as Mnemonic from "../Mnemonic.ts"

class CrosshatchSuiSigner extends SuiSdkSigner {
  private readonly publicKey: Ed25519PublicKey

  constructor(
    privateKey: Ed25519PrivateKey.Ed25519PrivateKey,
    publicKey: Ed25519PublicKey,
  ) {
    super()
    this.privateKey = privateKey
    this.publicKey = publicKey
  }

  private readonly privateKey: Ed25519PrivateKey.Ed25519PrivateKey

  getKeyScheme(): SignatureScheme {
    return "ED25519"
  }

  getPublicKey(): Ed25519PublicKey {
    return this.publicKey
  }

  sign(bytes: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
    return Effect.runPromise(
      Ed25519PrivateKey.sign(this.privateKey, bytes),
    )
  }
}
export class SuiSigner extends Context.Service<
  SuiSigner,
  SuiSdkSigner
>()("crosshatch/Sui/SuiSigner") {}

export const layerFromMnemonic = Layer.effect(
  SuiSigner,
  Effect.gen(function* () {
    const mnemonic = yield* Mnemonic.Mnemonic

    const pair = yield* Slip10.derive(
      Mnemonic.toSeed(mnemonic),
      [44, 784, 0, 0, 0],
    ).pipe(
      Effect.flatMap(({ privateKeySeed }) =>
        Ed25519Pair.fromSeed(privateKeySeed),
      ),
    )

    const rawPublicKey = yield* Effect.promise(() =>
      crypto.subtle.exportKey("raw", pair.publicKey),
    )

    const suiPublicKey = new Ed25519PublicKey(
      new Uint8Array(rawPublicKey),
    )

    return new CrosshatchSuiSigner(
      pair.privateKey,
      suiPublicKey,
    )
  }),
)
