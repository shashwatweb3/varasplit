const DEFAULT_RPC = 'wss://testnet.vara.network';

export const APP_NAME = 'VaraSplit';
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_VARA_RPC ?? DEFAULT_RPC;
export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? '';
export const VOUCHER_ID = process.env.NEXT_PUBLIC_VOUCHER_ID ?? '';

export function configError(): string | null {
  if (!PROGRAM_ID) {
    return 'VaraSplit program ID is not configured. Cannot connect to contract.';
  }

  return null;
}
