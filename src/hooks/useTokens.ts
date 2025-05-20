import { HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { TokenMetadata } from '../types'
import { convertVolumeFromCanister } from '../utils/calculationsUtils'
import { getTokenInfo } from '../utils/tokenUtils'
import { getActor } from '../utils/canisterUtils'

/**
 * Custom hook for fetching and managing tokens.
 * @param userAgent - The HTTP agent for interacting with the Internet Computer.
 * @param idlFactory - The IDL factory for the specific canister.
 * @param canisterId - The principal ID of the canister.
 */
const useTokens = <T extends Record<string, (...args: any[]) => any>>(
  userAgent: HttpAgent,
  canisterId: string,
  idlFactory: any,
) => {
  /**
   * Fetches and returns the supported tokens.
   *
   * @returns A promise that resolves to an array of TokenMetadata objects representing the supported tokens.
   */
  const getTokens = async (): Promise<{
    tokens: TokenMetadata[]
    quoteToken: TokenMetadata | null
  }> => {
    try {
      const serviceActor = getActor<T>(userAgent, canisterId, idlFactory)

      const [quoteToken, principals] = await Promise.all([
        getQuoteToken(),
        serviceActor.icrc84_supported_tokens(),
      ])

      const tokens: TokenMetadata[] = await Promise.all(
        (principals ?? []).map(async (principal: Principal) => {
          const { token, logo } = await getTokenInfo(
            userAgent,
            principal,
            `${quoteToken?.base}`,
          )

          const { volumeInBase: fee } = convertVolumeFromCanister(
            Number(token.fee),
            token.decimals,
            0,
          )

          return {
            ...token,
            fee,
            feeNat: token.fee.toString(),
            logo,
            principal: principal.toText(),
          }
        }),
      )

      tokens.sort((a, b) => a.symbol.localeCompare(b.symbol))
      return { tokens, quoteToken }
    } catch (error) {
      console.error('Error fetching tokens:', error)
      return { tokens: [], quoteToken: null }
    }
  }

  /**
   * Fetches and returns the quote token.
   *
   * @returns A promise that resolves to the quote token.
   */
  const getQuoteToken = async (): Promise<TokenMetadata | null> => {
    try {
      const serviceActor = getActor<T>(userAgent, canisterId, idlFactory)

      const quotePrincipal = await serviceActor.getQuoteLedger()
      const { token, logo } = await getTokenInfo(userAgent, quotePrincipal, '')

      const { volumeInBase: fee } = convertVolumeFromCanister(
        Number(token.fee),
        token.decimals,
        0,
      )

      return {
        ...token,
        fee,
        feeNat: token.fee.toString(),
        logo,
        principal: quotePrincipal.toText(),
      }
    } catch (error) {
      console.error('Error fetching quote token:', error)
      return null
    }
  }

  return { getTokens, getQuoteToken }
}

export default useTokens
