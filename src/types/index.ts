export interface DataItem {
  id?: bigint
  datetime: string
  date?: string
  time?: string
  price: number
  type?: string
  volume: number
  volumeInBase: number
  volumeInQuote: number
  volumeInAvailable?: number
  volumeInAvailableNat?: string
  volumeInLocked?: number
  volumeInLockedNat?: string
  volumeInTotal?: number
  volumeInTotalNat?: string
  priceDecimals?: number
  volumeDecimals?: number
  quoteDecimals?: number
  volumeInBaseDecimals?: number
  volumeInQuoteDecimals?: number
  priceDigitsLimit?: number
}
export interface TokenMetadata {
  symbol: string
  name: string
  decimals: number
  logo: string
  fee: number
  feeNat: string
  quote: string
  base: string
  principal?: string
}
export interface TokenDataItem extends DataItem, TokenMetadata {
  [key: string]: any
}
