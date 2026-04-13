import { isU8a, u8aToHex } from '@polkadot/util';
import { decodeAddress, isAddress } from '@polkadot/util-crypto';

export function toActorId(address: string): `0x${string}` {
  const trimmed = address.trim();
  if (!trimmed || !isAddress(trimmed)) {
    throw new Error(`Invalid address: ${address}`);
  }

  return u8aToHex(decodeAddress(trimmed)) as `0x${string}`;
}

export function toActorIdBytes(address: string): Uint8Array {
  const trimmed = address.trim();
  if (!trimmed || !isAddress(trimmed)) {
    throw new Error(`Invalid address: ${address}`);
  }

  return decodeAddress(trimmed);
}

export function normalizeChainAddress(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || String(value);
  }

  if (isU8a(value)) {
    return u8aToHex(value);
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'number')) {
    return u8aToHex(new Uint8Array(value));
  }

  if (value && typeof value === 'object') {
    if ('toHex' in value && typeof value.toHex === 'function') {
      return String(value.toHex());
    }

    if ('toU8a' in value && typeof value.toU8a === 'function') {
      return u8aToHex(value.toU8a());
    }
  }

  return String(value);
}

export function isValidWalletAddress(address: string): boolean {
  const trimmed = address.trim();
  return Boolean(trimmed) && isAddress(trimmed);
}

export function normalizeAddressKey(address: string): string {
  try {
    return toActorId(address);
  } catch {
    return address.trim();
  }
}

export function addressesEqual(left: string, right: string): boolean {
  try {
    return toActorId(left) === toActorId(right);
  } catch {
    return left.trim() === right.trim();
  }
}
