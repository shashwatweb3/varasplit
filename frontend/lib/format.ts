import { decodeAddress, encodeAddress, isAddress } from '@polkadot/util-crypto';
import { hexToU8a, u8aToHex } from '@polkadot/util';

import { VARA_DECIMALS } from './constants';

const UNIT = BigInt(10) ** BigInt(VARA_DECIMALS);

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export function isValidAddress(address: string) {
  return Boolean(address.trim()) && isAddress(address.trim());
}

export function addressToActorId(address: string): Uint8Array {
  const trimmed = address.trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    return hexToU8a(trimmed);
  }
  if (!isValidAddress(trimmed)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return decodeAddress(trimmed);
}

export function addressToHex(address: string): `0x${string}` {
  return u8aToHex(addressToActorId(address)) as `0x${string}`;
}

export function normalizeActorId(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (trimmed.startsWith('0x')) return trimmed.toLowerCase();
    try {
      return addressToHex(trimmed).toLowerCase();
    } catch {
      return trimmed;
    }
  }

  if (value instanceof Uint8Array) {
    return u8aToHex(value).toLowerCase();
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'number')) {
    return u8aToHex(new Uint8Array(value)).toLowerCase();
  }

  if (value && typeof value === 'object') {
    const candidate = value as { toHex?: () => string; toU8a?: () => Uint8Array };
    if (typeof candidate.toHex === 'function') return candidate.toHex().toLowerCase();
    if (typeof candidate.toU8a === 'function') return u8aToHex(candidate.toU8a()).toLowerCase();
  }

  return String(value);
}

export function actorIdToDisplay(value: string) {
  if (!value.startsWith('0x')) return value;
  try {
    return encodeAddress(value);
  } catch {
    return value;
  }
}

export function addressesEqual(left: string, right: string) {
  try {
    return normalizeActorId(left) === normalizeActorId(right);
  } catch {
    return left.trim() === right.trim();
  }
}

export function formatTvara(value: bigint) {
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  const whole = absolute / UNIT;
  const fraction = absolute % UNIT;
  const fractionText = fraction.toString().padStart(VARA_DECIMALS, '0').replace(/0+$/, '');
  const text = fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();
  return negative ? `-${text}` : text;
}

export function parseTvara(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Amount is required.');

  if (!/^\d+(?:\.\d{0,12})?$/.test(trimmed)) {
    throw new Error('Enter a valid TVARA amount with up to 12 decimal places.');
  }

  const [whole, fraction = ''] = trimmed.split('.');
  const amount = BigInt(whole) * UNIT + BigInt((fraction || '').padEnd(VARA_DECIMALS, '0'));

  if (amount <= BigInt(0)) {
    throw new Error('Amount must be greater than 0 TVARA.');
  }

  return amount;
}

export function isValidTvaraInput(value: string) {
  return value === '' || /^\d*(?:\.\d{0,12})?$/.test(value);
}

export function parseRouteBigInt(value: string | undefined, label = 'id') {
  if (!value || !/^\d+$/.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }

  return BigInt(value);
}

export function formatTimestamp(timestamp: number) {
  if (!timestamp) return 'Unknown';
  const milliseconds = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  return new Date(milliseconds).toLocaleString();
}
