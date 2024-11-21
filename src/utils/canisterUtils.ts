import { Actor, ActorSubclass, HttpAgent } from '@dfinity/agent'

let actorCache: ActorSubclass<any> | null = null
let userAgentCache: HttpAgent | null = null

/**
 * Creates and returns an actor for interacting with the canister.
 * Ensures that the actor is only recreated if the userAgent changes or actor was not created.
 * @param userAgent - The HTTP agent to be used for creating the actor.
 * @param canisterId - The principal ID of the canister.
 * @param idlFactory - The IDL factory for the specific canister.
 * @returns The created service actor.
 */
export function getActor<T extends Record<string, (...args: any[]) => any>>(
  userAgent: HttpAgent,
  canisterId: string,
  idlFactory: any,
): ActorSubclass<T> {
  if (!actorCache || userAgentCache !== userAgent) {
    userAgentCache = userAgent

    actorCache = Actor.createActor<T>(idlFactory, {
      agent: userAgent,
      canisterId,
    })
  }

  return actorCache as ActorSubclass<T>
}
