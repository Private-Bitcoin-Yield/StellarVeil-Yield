import { xdr, Address, nativeToScVal } from "@stellar/stellar-sdk";
import { DENOMINATIONS, NETWORK_CONFIG } from "@stellar-veilyield/shared";

/**
 * Encodes 32-byte hex string to Soroban BytesN<32> ScVal
 */
export function hexToBytesN32ScVal(hexStr: string): xdr.ScVal {
  const clean = hexStr.replace(/^0x/, "").padStart(64, "0");
  const buffer = Buffer.from(clean, "hex");
  return xdr.ScVal.scvBytes(buffer);
}

/**
 * Helpers for contract call argument construction
 */
export const ContractArgs = {
  deposit: (fromAddress: string, commitmentHex: string, denominationStroops: string, strategyId: number) => {
    return [
      new Address(fromAddress).toScVal(),
      hexToBytesN32ScVal(commitmentHex),
      nativeToScVal(BigInt(denominationStroops), { type: "i128" }),
      nativeToScVal(strategyId, { type: "u32" }),
    ];
  },

  withdraw: (
    proof: any,
    publicSignals: string[],
    merkleRootHex: string,
    nullifierHashHex: string,
    recipientAddress: string,
    denominationStroops: string,
    depositEpoch: number,
    strategyId: number
  ) => {
    return [
      // Proof struct
      nativeToScVal(proof),
      // public signals
      nativeToScVal(publicSignals),
      hexToBytesN32ScVal(merkleRootHex),
      hexToBytesN32ScVal(nullifierHashHex),
      new Address(recipientAddress).toScVal(),
      nativeToScVal(BigInt(denominationStroops), { type: "i128" }),
      nativeToScVal(BigInt(depositEpoch), { type: "u64" }),
      nativeToScVal(strategyId, { type: "u32" }),
    ];
  },
};
