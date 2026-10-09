import { pgTable, serial, text, integer, bigint, timestamp, boolean } from "drizzle-orm/pg-core";

export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  leafIndex: integer("leaf_index").notNull().unique(),
  commitment: text("commitment").notNull().unique(),
  denomination: text("denomination").notNull(),
  epoch: integer("epoch").notNull(),
  strategyId: integer("strategy_id").notNull(),
  txHash: text("tx_hash").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  leafIndex: integer("leaf_index").notNull().unique(),
  commitment: text("commitment").notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
});

export const nullifiers = pgTable("nullifiers", {
  id: serial("id").primaryKey(),
  nullifierHash: text("nullifier_hash").notNull().unique(),
  spentInTx: text("spent_in_tx").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const epochs = pgTable("epochs", {
  id: serial("id").primaryKey(),
  epochNumber: integer("epoch_number").notNull().unique(),
  indexStrategyA: bigint("index_strategy_a", { mode: "number" }).notNull(),
  indexStrategyB: bigint("index_strategy_b", { mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditProofs = pgTable("audit_proofs", {
  id: serial("id").primaryKey(),
  proofHash: text("proof_hash").notNull().unique(),
  threshold: text("threshold").notNull(),
  epochIndexCommitment: text("epoch_index_commitment").notNull(),
  merkleRoot: text("merkle_root").notNull(),
  proofJson: text("proof_json").notNull(),
  publicSignalsJson: text("public_signals_json").notNull(),
  verified: boolean("verified").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
