import type { GraphMakerState } from "@milaboratories/graph-maker";
import type {
  PlDataTableStateV2,
  PlMultiSequenceAlignmentModel,
  PlRef,
} from "@platforma-sdk/model";
// The clustering vocabulary lives in the kind: its init-params contract names
// these types and a kind cannot import from the model.
import type {
  CoverageMode,
  SimilarityType,
} from "@platforma-open/milaboratories.paratope-clustering.kind";

/**
 * Unified V3 data — the block's persisted state.
 *
 * The first ten fields are what V1 kept in `args` and the workflow consumes,
 * including both label fields (it reads them for the provenance trace). The
 * five below them are what V1 kept in `uiState`: table, alignment and graph
 * view state that no template reads and the workflow never sees.
 */
export type BlockData = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  datasetRef?: PlRef;
  paratopeThreshold: number;
  identity: number;
  similarityType: SimilarityType;
  coverageThreshold: number;
  coverageMode: CoverageMode;
  mem?: number;
  cpu?: number;

  tableState: PlDataTableStateV2;
  graphStateBubble: GraphMakerState;
  alignmentModel: PlMultiSequenceAlignmentModel;
  graphStateHistogram: GraphMakerState;
  graphStateProbDist: GraphMakerState;
};

/**
 * Workflow-facing args — the same ten fields V1 projected, in the same order,
 * so an upgraded project hashes to what it hashed before and does not re-run.
 * The view state stays behind. The lambda's other job is the run gate, which
 * V1 expressed as `.argsValid`.
 */
export type BlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  datasetRef?: PlRef;
  paratopeThreshold: number;
  identity: number;
  similarityType: SimilarityType;
  coverageThreshold: number;
  coverageMode: CoverageMode;
  mem?: number;
  cpu?: number;
};

/** Legacy (V1) `args`, consumed once by `.upgradeLegacy`. */
export type LegacyBlockArgs = {
  defaultBlockLabel?: string;
  customBlockLabel?: string;
  datasetRef?: PlRef;
  paratopeThreshold?: number;
  identity?: number;
  similarityType?: SimilarityType;
  coverageThreshold?: number;
  coverageMode?: CoverageMode;
  mem?: number;
  cpu?: number;
};

/** Legacy (V1) `uiState`, consumed once by `.upgradeLegacy`. */
export type LegacyUiState = {
  tableState?: PlDataTableStateV2;
  graphStateBubble?: GraphMakerState;
  alignmentModel?: PlMultiSequenceAlignmentModel;
  graphStateHistogram?: GraphMakerState;
  graphStateProbDist?: GraphMakerState;
};
