'use client';

import type { GearApi } from '@gear-js/api';
import type { Signer } from '@polkadot/api/types';

import { RPC_ENDPOINT } from './constants';

let apiInstance: GearApi | null = null;
let apiPromise: Promise<GearApi> | null = null;
let pendingSigner: Signer | null = null;

export async function getGearApi() {
  if (apiInstance?.isConnected) {
    return apiInstance;
  }

  if (!apiPromise) {
    apiPromise = (async () => {
      try {
        const { GearApi } = await import('@gear-js/api');
        const api = await GearApi.create({ providerAddress: RPC_ENDPOINT });
        if (pendingSigner) api.setSigner(pendingSigner);
        apiInstance = api;
        return api;
      } catch (error) {
        apiInstance = null;
        throw new Error(`Failed to connect to Vara testnet RPC: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        apiPromise = null;
      }
    })();
  }

  return apiPromise;
}

export const getApi = getGearApi;

export async function setGearSigner(signer: Signer) {
  pendingSigner = signer;
  const api = await getGearApi();
  api.setSigner(signer);
}

export function disconnectGearApi() {
  if (apiInstance) {
    apiInstance.disconnect();
    apiInstance = null;
  }
  apiPromise = null;
}

export const disconnectApi = disconnectGearApi;
