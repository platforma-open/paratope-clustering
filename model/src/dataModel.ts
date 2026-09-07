import { kind } from "@platforma-open/milaboratories.paratope-clustering.kind";
import { createPlDataTableStateV2, DataModelBuilder } from "@platforma-sdk/model";
import { getDefaultBlockLabel } from "./label";
import type { BlockData, LegacyBlockArgs, LegacyUiState } from "./types";

export const blockDataModel = new DataModelBuilder({ kind })
  .from<BlockData>("v1")
  // V1 split the same field set across `args` and `uiState`, so the upgrade
  // flattens the two channels into one and defaults anything a V1 project
  // could have been saved without.
  .upgradeLegacy<LegacyBlockArgs, LegacyUiState>(({ args, uiState }) => ({
    defaultBlockLabel: args?.defaultBlockLabel ?? getDefaultBlockLabel({}),
    customBlockLabel: args?.customBlockLabel ?? "",
    datasetRef: args?.datasetRef,
    paratopeThreshold: args?.paratopeThreshold ?? DEFAULT_PARATOPE_THRESHOLD,
    identity: args?.identity ?? DEFAULT_IDENTITY,
    similarityType: args?.similarityType ?? DEFAULT_SIMILARITY_TYPE,
    coverageThreshold: args?.coverageThreshold ?? DEFAULT_COVERAGE_THRESHOLD,
    coverageMode: args?.coverageMode ?? DEFAULT_COVERAGE_MODE,
    mem: args?.mem,
    cpu: args?.cpu,

    tableState: uiState?.tableState ?? createPlDataTableStateV2(),
    graphStateBubble: uiState?.graphStateBubble ?? defaultGraphStateBubble(),
    alignmentModel: uiState?.alignmentModel ?? {},
    graphStateHistogram: uiState?.graphStateHistogram ?? defaultGraphStateHistogram(),
    graphStateProbDist: uiState?.graphStateProbDist ?? defaultGraphStateProbDist(),
  }))
  // A block created from a template starts on the params its kind accepted; one
  // created by hand gets the defaults V1 handed out unconditionally. The fields
  // the contract leaves out are the five view states and `defaultBlockLabel`,
  // which a watchEffect in ui/src/app.ts recomputes from the clustering
  // parameters.
  .init(({ params }) => ({
    defaultBlockLabel: getDefaultBlockLabel({}),
    customBlockLabel: params?.customBlockLabel ?? "",
    datasetRef: params?.datasetRef,
    paratopeThreshold: params?.paratopeThreshold ?? DEFAULT_PARATOPE_THRESHOLD,
    identity: params?.identity ?? DEFAULT_IDENTITY,
    similarityType: params?.similarityType ?? DEFAULT_SIMILARITY_TYPE,
    coverageThreshold: params?.coverageThreshold ?? DEFAULT_COVERAGE_THRESHOLD,
    coverageMode: params?.coverageMode ?? DEFAULT_COVERAGE_MODE,
    mem: params?.mem,
    cpu: params?.cpu,

    tableState: createPlDataTableStateV2(),
    graphStateBubble: defaultGraphStateBubble(),
    alignmentModel: {},
    graphStateHistogram: defaultGraphStateHistogram(),
    graphStateProbDist: defaultGraphStateProbDist(),
  }));

// Internals

const DEFAULT_PARATOPE_THRESHOLD = 0.5;
const DEFAULT_IDENTITY = 0.8;
const DEFAULT_SIMILARITY_TYPE = "blosum62" as const;
const DEFAULT_COVERAGE_THRESHOLD = 0.9;
const DEFAULT_COVERAGE_MODE = 0 as const;

function defaultGraphStateBubble(): BlockData["graphStateBubble"] {
  return {
    title: "Most abundant clusters",
    template: "bubble",
    currentTab: null,
    layersSettings: {
      bubble: {
        normalizationDirection: null,
      },
    },
  };
}

function defaultGraphStateHistogram(): BlockData["graphStateHistogram"] {
  return {
    title: "Histogram",
    template: "bins",
    currentTab: null,
    layersSettings: {
      bins: { fillColor: "#99e099" },
    },
    axesSettings: {
      axisY: {
        axisLabelsAngle: 90,
        scale: "log",
      },
      other: { binsCount: 30 },
    },
  };
}

function defaultGraphStateProbDist(): BlockData["graphStateProbDist"] {
  return {
    title: "Parapred score distribution",
    template: "line",
    currentTab: null,
    layersSettings: {},
  };
}
