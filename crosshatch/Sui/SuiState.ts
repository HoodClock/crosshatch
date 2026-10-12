import { SuiGrpcClient } from "@mysten/sui/grpc"
import { Context, Effect, Layer } from "effect"

export class SuiState extends Context.Service<
  SuiState,
  SuiGrpcClient
>()("crosshatch/Sui/SuiState") {}

export const layer = (
  url: string,
  network: "mainnet" | "testnet" | "devnet" | "localnet",
) =>
  Layer.effect(
    SuiState,
    Effect.sync(
      () =>
        new SuiGrpcClient({
          network,
          baseUrl: url,
        }),
    ),
  )
