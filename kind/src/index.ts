import { assertParamsObject, defineBlockKind } from "@platforma-sdk/block-kind";
import type { PlRef } from "@platforma-sdk/model";
import { isPlRef } from "@platforma-sdk/model";
import { name, version } from "../package.json" with { type: "json" };

/** The metric mmseqs2 scores a pair of paratope sequences with. */
export type SimilarityType =
  | "sequence-identity"
  | "blosum40"
  | "blosum50"
  | "blosum62"
  | "blosum80"
  | "blosum90";

/** mmseqs2's `--cov-mode`: which of the two sequences the coverage threshold is measured against. */
export type CoverageMode = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * This block's init-params contract — everything a user sets by hand: the
 * dataset to read CDRs from, the paratope probability cutoff, the three
 * clustering parameters mmseqs2 takes, the subtitle they type, and the resource
 * knobs the Advanced Settings section exposes.
 *
 * Left out are the five view-state fields (`tableState`, `alignmentModel` and
 * the three graph states) and `defaultBlockLabel`, which a `watchEffect` in
 * `ui/src/app.ts` recomputes from the clustering parameters.
 *
 * Every field is optional because the projection hands live state back
 * untouched, and a half-configured block is ordinary state the UI reaches.
 * Requiring one would make the block export a file its own kind refuses to
 * apply, so export and apply would stop being inverses.
 */
export type BlockParams = {
  datasetRef?: PlRef;
  paratopeThreshold?: number;
  identity?: number;
  similarityType?: SimilarityType;
  coverageThreshold?: number;
  coverageMode?: CoverageMode;
  customBlockLabel?: string;
  mem?: number;
  cpu?: number;
};

/** The same contract at runtime, for params arriving from a template file rather than typed code. */
function parseInitializationParams(value: unknown): BlockParams {
  assertParamsObject(value);

  const {
    datasetRef,
    paratopeThreshold,
    identity,
    similarityType,
    coverageThreshold,
    coverageMode,
    customBlockLabel,
    mem,
    cpu,
  } = value;

  return {
    datasetRef: optionalPlRef(datasetRef),
    paratopeThreshold: optionalFraction(paratopeThreshold, "paratopeThreshold"),
    identity: optionalFraction(identity, "identity"),
    similarityType: optionalEnum(similarityType, SIMILARITY_TYPES, "similarityType"),
    coverageThreshold: optionalFraction(coverageThreshold, "coverageThreshold"),
    coverageMode: optionalCoverageMode(coverageMode),
    customBlockLabel: optionalString(customBlockLabel, "customBlockLabel"),
    mem: optionalPositiveInteger(mem, "mem"),
    cpu: optionalPositiveInteger(cpu, "cpu"),
  };
}

// Identity (`name`/`version`) comes from this package's own `package.json`, so
// the on-wire `{name}@{version}` reference can never drift from what npm
// publishes; the bundler inlines the JSON import.
export const kind = defineBlockKind<BlockParams>({
  name,
  version,
  parseInitializationParams,
});

// Internals

const SIMILARITY_TYPES: readonly SimilarityType[] = [
  "sequence-identity",
  "blosum40",
  "blosum50",
  "blosum62",
  "blosum80",
  "blosum90",
];

const COVERAGE_MODES: readonly CoverageMode[] = [0, 1, 2, 3, 4, 5];

/** A reference to a column another block published. Checked with the SDK's own
 *  guard, so the brand and the optional enrichment flag stay in step with it. */
function optionalPlRef(value: unknown): PlRef | undefined {
  if (value === undefined) return undefined;
  if (!isPlRef(value)) throw new Error("'datasetRef' must be a dataset reference.");
  return value;
}

/** A probability or a proportion of sequence length. Anything outside 0..1 has
 *  no reading: the paratope cutoff is compared against a Parapred probability,
 *  and the other two reach mmseqs2 as `--min-seq-id` and `-c`. `typeof` alone
 *  would also let `.nan` and `.inf` through, both of which YAML admits. */
function optionalFraction(value: unknown, at: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)
    throw new Error(`'${at}' must be a number between 0 and 1.`);
  return value;
}

/** GiB of memory, or a count of cores. Both reach the run request verbatim, and
 *  neither a fraction of a core nor zero memory is a request that can be met. */
function optionalPositiveInteger(value: unknown, at: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1)
    throw new Error(`'${at}' must be a whole number, 1 or more.`);
  return value;
}

function optionalCoverageMode(value: unknown): CoverageMode | undefined {
  if (value === undefined) return undefined;
  if (!COVERAGE_MODES.includes(value as CoverageMode))
    throw new Error(`'coverageMode' must be one of: ${COVERAGE_MODES.join(", ")}.`);
  return value as CoverageMode;
}

function optionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  at: string,
): T | undefined {
  if (value === undefined) return undefined;
  if (!allowed.includes(value as T))
    throw new Error(`'${at}' must be one of: ${allowed.join(", ")}.`);
  return value as T;
}

function optionalString(value: unknown, at: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`'${at}' must be a string.`);
  return value;
}
