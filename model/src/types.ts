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
 * The fields above the blank line are the user's settings; the args derive the
 * workflow's inputs and the provenance trace label from them. The five below
 * are what V1 kept in `uiState`: table, alignment and graph view state that no
 * template reads and the workflow never sees.
 */
export type BlockData = {
  customBlockLabel: string;
  datasetRef?: PlRef;
  /** Subset column picked with the dataset in PlDatasetSelector (e.g. a Repertoire Labeling label). */
  filterRef?: PlRef;
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
 * Workflow-facing args. The view state stays behind. The lambda's other job is
 * the run gate, which V1 expressed as `.argsValid`.
 */
export type BlockArgs = {
  /** Provenance trace label: the user's custom label, else one built from the clustering parameters. */
  traceLabel: string;
  datasetRef?: PlRef;
  paratopeThreshold: number;
  identity: number;
  similarityType: SimilarityType;
  coverageThreshold: number;
  coverageMode: CoverageMode;
  mem?: number;
  cpu?: number;
  /** The subset's canonical column id. Set only on a subset run, so unfiltered args are unchanged. */
  inputFilter?: string;
};

/** Data version v1, which also stored the settings-derived label the UI computed. */
export type BlockDataV1 = BlockData & {
  defaultBlockLabel: string;
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
