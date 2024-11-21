import { HttpAgent } from '@dfinity/agent'
import {
  IcrcTokenMetadataResponse,
  IcrcMetadataResponseEntries,
  IcrcLedgerCanister,
} from '@dfinity/ledger-icrc'
import { Principal } from '@dfinity/principal'

import defSymbolLogo from '../assets/img/coins/default.svg'
import { TokenMetadata } from '../types'

/**
 * Parses the metadata response from the ICRC token canister to extract token information.
 *
 * @param metadata - The metadata response from the ICRC token canister.
 * @param quoteToken - The quote token selected.
 * @returns The extracted token metadata.
 */
const parseMetadata = (
  metadata: IcrcTokenMetadataResponse,
  quoteToken: string,
): TokenMetadata => {
  let symbol = 'unknown'
  let name = 'unknown'
  let decimals = 0
  let logo = ''
  let fee = ''

  metadata.forEach(entry => {
    switch (entry[0]) {
      case IcrcMetadataResponseEntries.SYMBOL:
        symbol = (entry[1] as { Text: string }).Text
        break
      case IcrcMetadataResponseEntries.NAME:
        name = (entry[1] as { Text: string }).Text
        break
      case IcrcMetadataResponseEntries.DECIMALS:
        decimals = Number(((entry[1] as unknown) as { Nat: string }).Nat)
        break
      case IcrcMetadataResponseEntries.LOGO:
        logo = (entry[1] as { Text: string }).Text
        break
      case IcrcMetadataResponseEntries.FEE:
        fee = ((entry[1] as unknown) as { Nat: string }).Nat.toString()
        break
    }
  })

  if (symbol.includes('ck') || name.includes('ck')) {
    symbol = symbol.replace('ck', '')
    name = name.replace('ck', '')
  }

  return {
    symbol,
    name,
    decimals,
    logo,
    fee,
    base: symbol,
    quote: quoteToken,
  }
}

/**
 * Finds and returns the logo URL for a given token.
 * If the logo is not provided in the token metadata, it attempts to fetch the logo from a default location.
 *
 * @param token - The token metadata object.
 * @returns A promise that resolves to the logo URL.
 */
const findLogo = async (token: TokenMetadata): Promise<string> => {
  let logo =
    token.logo ||
    new URL(
      `../assets/img/coins/${token.symbol.toLowerCase()}.svg`,
      import.meta.url,
    ).href

  if (!token.logo) {
    try {
      const response = await fetch(logo)
      const blob = await response.blob()
      if (blob.size === 0 || !blob.type.startsWith('image')) {
        throw new Error('Image not found or not an image')
      }
    } catch (error) {
      logo = defSymbolLogo
    }
  }

  return logo
}

/**
 * Retrieves the token information from the ICRC token canister, including the parsed metadata and logo URL.
 *
 * @param userAgent - The HTTP agent to interact with the canister.
 * @param canisterId - The principal ID of the ICRC token canister.
 * @param quoteToken - The quote token selected.
 * @returns A promise that resolves to an object containing the token metadata and logo URL.
 */
export async function getTokenInfo(
  userAgent: HttpAgent,
  canisterId: Principal,
  quoteToken: string,
) {
  const { metadata } = IcrcLedgerCanister.create({
    agent: userAgent,
    canisterId: canisterId,
  })

  const principalData = await metadata({ certified: false })
  const token = parseMetadata(principalData, quoteToken)
  const logo = await findLogo(token)

  return { token, logo }
}

/**
 * Retrieves the token information for a given principal from a list of tokens.
 *
 * @param tokens - An array of token objects.
 * @param principal - The principal object used to identify a specific token.
 * @returns - The token information matching the given principal, or a standard token object if not found.
 */
export function getToken(tokens: TokenMetadata[], principal: Principal) {
  const standard = {
    symbol: '',
    name: '',
    decimals: 0,
    logo: '',
    fee: '',
    quote: '',
    base: '',
    principal: '',
  }

  if (!tokens || !principal || tokens.length === 0) return standard

  const token =
    tokens.find(token => token.principal === principal.toText()) ?? standard

  return { ...token }
}
