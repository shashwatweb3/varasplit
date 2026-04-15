export const APP_NAME = 'VaraSplit';
export const PROGRAM_ID = '0xbc80a0240c21d2cbcde676110d3b7b72be2aeade7e0d2c1c0f404b66f57efda0';
export const WORK_PAYOUT_PROGRAM_ID = '0x183bfc9f25a1c5aac52402c5484c07bea5c32f01f1bb794a8d36d040b0d541d4';
export const RPC_ENDPOINT = 'wss://testnet.vara.network';
export const VARA_RPC = RPC_ENDPOINT;
export const VARA_DECIMALS = 12;
export const VARA_EXPLORER_EXTRINSIC_URL = 'https://vara.subscan.io/extrinsic';

export function requiredConfigError(): string | null {
  if (!PROGRAM_ID) return 'Program ID is not configured.';
  if (!VARA_RPC) return 'Vara RPC endpoint is not configured.';
  return null;
}

export function requiredWorkPayoutConfigError(): string | null {
  if (!WORK_PAYOUT_PROGRAM_ID) return 'Work & Payouts program ID is not configured.';
  if (!VARA_RPC) return 'Vara RPC endpoint is not configured.';
  return null;
}
