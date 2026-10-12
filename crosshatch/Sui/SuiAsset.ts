import { Schema as S } from "effect"

import * as Asset from "../Asset.ts"
import { brand } from "./_common.ts"

export type SuiAsset = typeof SuiAsset.Type

export const SuiAsset = S.String.pipe(
  Asset.brand,
  brand,
)
