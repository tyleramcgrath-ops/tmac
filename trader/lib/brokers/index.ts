import type { AppState } from '../db'
import { getSecret } from '../config'
import type { AssetType, TradingMode } from '../types'
import type { BrokerAdapter } from './adapter'
import { PaperTradingAdapter } from './paper'
import { RobinhoodCryptoAdapter } from './robinhood-crypto'
import { RobinhoodEquitiesOptionsAdapter } from './robinhood-equities-options'

export type { BrokerAdapter, PlaceOrderRequest } from './adapter'
export { BrokerNotConfiguredError } from './adapter'

// Broker factory. Resolves the correct adapter for a given trading mode and
// asset type. In PAPER mode everything routes to the simulator. In LIVE mode,
// crypto uses the official Robinhood Crypto API; equities/options route to the
// (scaffolded) approved-API adapter.

export async function getAdapter(
  state: AppState,
  mode: TradingMode,
  assetType: AssetType,
): Promise<BrokerAdapter> {
  if (mode === 'paper') {
    return new PaperTradingAdapter(state)
  }
  // LIVE mode
  if (assetType === 'crypto') {
    const apiKey = await getSecret('RH_CRYPTO_API_KEY')
    const privateKeyBase64 = await getSecret('RH_CRYPTO_PRIVATE_KEY')
    return new RobinhoodCryptoAdapter(
      apiKey && privateKeyBase64 ? { apiKey, privateKeyBase64 } : null,
    )
  }
  return new RobinhoodEquitiesOptionsAdapter()
}

export { PaperTradingAdapter, RobinhoodCryptoAdapter, RobinhoodEquitiesOptionsAdapter }
