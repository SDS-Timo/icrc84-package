import { HttpAgent } from '@dfinity/agent'
import { IcrcLedgerCanister, decodeIcrcAccount } from '@dfinity/ledger-icrc'
import { Principal } from '@dfinity/principal'

import { TokenMetadata, Result } from '../types'
import {
  convertVolumeFromCanister,
  getDecimals,
} from '../utils/calculationsUtils'
import { getActor } from '../utils/canisterUtils'
import {
  hexToUint8Array,
  getSubAccountFromPrincipal,
} from '../utils/convertionsUtils'
import { getToken } from '../utils/tokenUtils'

/**
 * Custom hook for fetching and managing user wallet.
 * @param idlFactory - The IDL factory for the specific canister.
 * @param canisterId - The principal ID of the canister.
 */
const useWallet = <T extends Record<string, (...args: any[]) => any>>(
  userAgent: HttpAgent,
  canisterId: string,
  idlFactory: any,
) => {
  /**
   * Fetches the balance for a given token and account.
   *
   * @param tokens - An array of token objects.
   * @param principal - The principal ID of the token as a string.
   * @param account - The account identifier as a string.
   * @param action - Action to identify which account should be monitored
   * @returns The balance or an empty array in case of an error.
   */
  const getBalance = async (
    tokens: TokenMetadata[],
    principal: string,
    account: string,
    action: string,
  ): Promise<number | []> => {
    try {
      if (!tokens || tokens.length === 0) return []

      const tokenCanisterId = Principal.fromText(principal)

      const { balance } = IcrcLedgerCanister.create({
        agent: userAgent,
        canisterId: tokenCanisterId,
      })

      const decodeAccount = decodeIcrcAccount(account)
      let owner = decodeAccount.owner
      let subaccount = decodeAccount.subaccount

      if (action === 'claim') {
        owner = Principal.fromText(canisterId)
        const hexSubAccountId = getSubAccountFromPrincipal(account).subAccountId
        subaccount = new Uint8Array(hexToUint8Array(hexSubAccountId))
      }

      const myBalance = await balance({
        owner: owner,
        subaccount: subaccount,
        certified: false,
      })

      const token = getToken(tokens, tokenCanisterId)

      const { volumeInBase } = convertVolumeFromCanister(
        Number(myBalance),
        getDecimals(token),
        0,
      )

      return volumeInBase
    } catch (error) {
      return []
    }
  }

  /**
   * Fetches the tracked deposit for a given principal or all balances if no principal is provided.
   *
   * @param tokens - An array of token objects representing metadata for the tokens.
   * @param principal - (Optional) The principal ID as a string. If provided, fetches the deposit for the specific principal.
   *                    If not provided, fetches the balances for all available tokens.
   * @returns An array of objects containing token metadata and the corresponding tracked deposit volume in base units.
   *          If a specific principal is provided, the array contains a single object. If an error occurs, returns 0.
   */
  const getTrackedDeposit = async (
    tokens: TokenMetadata[],
    principal?: string,
  ): Promise<{ token: TokenMetadata; volumeInBase: number }[] | Result> => {
    try {
      if (!tokens || tokens.length === 0) return []

      const serviceActor = getActor<T>(userAgent, canisterId, idlFactory)

      if (principal) {
        const tokenCanisterId = Principal.fromText(principal)

        const deposit: Result = await serviceActor.icrc84_query([
          tokenCanisterId,
        ])

        const volume = deposit[0] ? deposit[0][1]['tracked_deposit'] : undefined

        const token = getToken(tokens, tokenCanisterId)

        if (volume !== undefined) {
          const { volumeInBase } = convertVolumeFromCanister(
            Number(volume),
            getDecimals(token),
            0,
          )

          return [{ token, volumeInBase }]
        } else {
          return [{ token, volumeInBase: 0 }]
        }
      } else {
        const deposits: Array<Result> = await serviceActor.icrc84_query([])
        if (deposits.length === 0) {
          return tokens.map(token => ({
            token,
            volumeInBase: 0,
          }))
        }

        return deposits.map(deposit => {
          const tokenCanisterId = deposit[0]
          const token = getToken(tokens, tokenCanisterId)

          const volume = deposit[1]['tracked_deposit']
          const { volumeInBase } = convertVolumeFromCanister(
            Number(volume ?? 0),
            getDecimals(token),
            0,
          )

          return { token, volumeInBase }
        })
      }
    } catch (error) {
      console.error('Error fetching tracked deposit:', error)
      return []
    }
  }

  /**
   * Notifies the service actor to update the balance information for a specific token.
   *
   * @param principal - The principal identifier of the token.
   * @returns A promise that resolves to the result of the notification operation.
   */
  const balanceNotify = async (principal: string | undefined) => {
    try {
      if (!principal) return []

      const serviceActor = getActor<T>(userAgent, canisterId, idlFactory)
      const result = await serviceActor.icrc84_notify({
        token: Principal.fromText(principal),
      })

      return result
    } catch (error) {
      console.error('Error balance notify:', error)
      return []
    }
  }

  /**
   * Withdraws credit from the user's account using the ICRC-84 protocol.
   *
   * @param principal - The principal identifier of the token.
   * @param account - The account identifier as a hexadecimal string.
   * @param amount - The amount of credit to withdraw.
   * @returns The result of the withdrawal transaction.
   */
  const withdrawCredit = async (
    principal: string | undefined,
    account: string | undefined,
    amount: number,
  ) => {
    try {
      if (!principal || !account) return null

      const decodeAccount = decodeIcrcAccount(account)

      const serviceActor = getActor<T>(userAgent, canisterId, idlFactory)
      const result = await serviceActor.icrc84_withdraw({
        token: Principal.fromText(principal),
        to: {
          owner: decodeAccount.owner,
          subaccount: decodeAccount?.subaccount
            ? [decodeAccount.subaccount]
            : [],
        },
        amount: BigInt(amount),
        expected_fee: [],
      })

      return result
    } catch (error) {
      console.error('Error withdraw credit:', error)
      return null
    }
  }

  /**
   * Get Deposit Allowance info from the user's account using the ICRC-84 protocol.
   *
   * @param principal - The principal identifier of the token.
   * @param account - The account identifier as a hexadecimal string.
   * @returns The info of the deposit allowance.
   */
  const getDepositAllowanceInfo = async (
    principal: string | undefined,
    account: string | undefined,
  ) => {
    try {
      if (!principal || !account) return null

      const decodeAccount = decodeIcrcAccount(account)

      const userPrincipal = await userAgent.getPrincipal()
      const hexSubAccountId = getSubAccountFromPrincipal(userPrincipal.toText())
        .subAccountId

      const ledgerActor = IcrcLedgerCanister.create({
        agent: userAgent,
        canisterId: Principal.fromText(principal),
      })
      const result = await ledgerActor.allowance({
        account: {
          owner: decodeAccount.owner,
          subaccount: decodeAccount?.subaccount
            ? [decodeAccount.subaccount]
            : [],
        },
        spender: {
          owner: Principal.fromText(canisterId),
          subaccount: [new Uint8Array(hexToUint8Array(hexSubAccountId))],
        },
        certified: false,
      })

      return result
    } catch (error) {
      return null
    }
  }

  /**
   * Deposit credit from the user's account using the ICRC-84 protocol.
   *
   * @param principal - The principal identifier of the token.
   * @param account - The account identifier as a hexadecimal string.
   * @param amount - The amount of credit to withdraw.
   * @returns The result of the deposit transaction.
   */
  const deposit = async (
    principal: string | undefined,
    account: string | undefined,
    amount: number,
  ) => {
    try {
      if (!principal || !account) return null

      const decodeAccount = decodeIcrcAccount(account)

      const serviceActor = getActor<T>(userAgent, canisterId, idlFactory)
      const result = await serviceActor.icrc84_deposit({
        token: Principal.fromText(principal),
        from: {
          owner: decodeAccount.owner,
          subaccount: decodeAccount?.subaccount
            ? [decodeAccount.subaccount]
            : [],
        },
        amount: BigInt(amount),
        expected_fee: [],
      })

      return result
    } catch (error) {
      console.error('Error deposit credit:', error)
      return null
    }
  }

  return {
    getBalance,
    getTrackedDeposit,
    balanceNotify,
    withdrawCredit,
    getDepositAllowanceInfo,
    deposit,
  }
}

export default useWallet
