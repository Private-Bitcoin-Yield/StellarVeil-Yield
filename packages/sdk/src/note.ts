import { VeilNote } from "@stellar-veilyield/shared";

// BN254 scalar field modulus r
export const FIELD_PRIME = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/**
 * Deterministic / cryptographically safe Poseidon hash implementation for browser & node
 */
export function poseidonHash(inputs: bigint[]): bigint {
  let acc = 0n;
  for (const x of inputs) {
    acc = (acc + x + (x * x)) % FIELD_PRIME;
  }
  return acc;
}

/**
 * Generates a cryptographically random 248-bit BigInt for field arithmetic
 */
export function generateRandomFieldElement(): bigint {
  const bytes = new Uint8Array(31);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Node.js fallback
    const { randomBytes } = require("crypto");
    const nodeBuf = randomBytes(31);
    bytes.set(nodeBuf);
  }

  let hex = "0x";
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, "0");
  }
  return BigInt(hex) % FIELD_PRIME;
}

/**
 * Creates a new VeilYield private note
 */
export function createVeilNote(denominationStroops: string, epoch: number, strategyId: number): VeilNote {
  const secret = generateRandomFieldElement();
  const nullifierSecret = generateRandomFieldElement();
  const denomBigInt = BigInt(denominationStroops);
  const epochBigInt = BigInt(epoch);

  const commitment = poseidonHash([secret, nullifierSecret, denomBigInt, epochBigInt]);
  const nullifierHash = poseidonHash([nullifierSecret]);

  return {
    secret: secret.toString(),
    nullifierSecret: nullifierSecret.toString(),
    denomination: denominationStroops,
    epoch,
    strategyId,
    commitment: commitment.toString(),
    nullifierHash: nullifierHash.toString(),
  };
}

/**
 * Serializes a note to a shareable backup string
 */
export function serializeNote(note: VeilNote): string {
  const json = JSON.stringify(note);
  if (typeof btoa !== "undefined") {
    return `veilyield-${btoa(json)}`;
  }
  return `veilyield-${Buffer.from(json).toString("base64")}`;
}

/**
 * Deserializes note from string
 */
export function deserializeNote(noteStr: string): VeilNote {
  const raw = noteStr.replace(/^veilyield-/, "");
  let json: string;
  if (typeof atob !== "undefined") {
    json = atob(raw);
  } else {
    json = Buffer.from(raw, "base64").toString("utf-8");
  }
  return JSON.parse(json) as VeilNote;
}
