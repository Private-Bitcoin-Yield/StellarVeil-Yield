import { MerkleProofData } from "@stellar-veilyield/shared";
import { poseidonHash } from "./note";

export class VeilMerkleTree {
  public depth: number;
  public leaves: bigint[];
  private layers: bigint[][];

  constructor(depth: number = 16, initialLeaves: string[] = []) {
    this.depth = depth;
    this.leaves = initialLeaves.map((l) => BigInt(l));
    this.layers = [];
    this.rebuildTree();
  }

  public insert(leaf: string): number {
    const leafIndex = this.leaves.length;
    this.leaves.push(BigInt(leaf));
    this.rebuildTree();
    return leafIndex;
  }

  public rebuildTree(): void {
    const capacity = 1 << this.depth;
    let currentLevel: bigint[] = [...this.leaves];

    // Pad with zero leaves up to capacity
    while (currentLevel.length < capacity) {
      currentLevel.push(0n);
    }

    this.layers = [currentLevel];

    for (let d = 0; d < this.depth; d++) {
      const prev = this.layers[d];
      const next: bigint[] = [];
      for (let i = 0; i < prev.length; i += 2) {
        next.push(poseidonHash([prev[i], prev[i + 1]]));
      }
      this.layers.push(next);
    }
  }

  public getRoot(): string {
    if (this.layers.length === 0) return "0";
    return this.layers[this.depth][0].toString();
  }

  public getProof(leafIndex: number): MerkleProofData {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds`);
    }

    const pathElements: string[] = [];
    const pathIndices: number[] = [];
    let curIdx = leafIndex;

    for (let d = 0; d < this.depth; d++) {
      const isRight = curIdx % 2;
      const siblingIdx = isRight ? curIdx - 1 : curIdx + 1;
      pathElements.push(this.layers[d][siblingIdx].toString());
      pathIndices.push(isRight);
      curIdx = Math.floor(curIdx / 2);
    }

    return {
      root: this.getRoot(),
      pathElements,
      pathIndices,
      leafIndex,
    };
  }
}
