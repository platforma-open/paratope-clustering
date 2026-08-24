import type { GraphMakerState } from '@milaboratories/graph-maker';
import type {
  PColumnIdAndSpec,
  PColumnSpec,
  ResultPool,
  PFrameHandle,
  PlDataTableStateV2,
  PlMultiSequenceAlignmentModel,
  PlRef,
} from '@platforma-sdk/model';
import {
  BlockModel,
  createPFrameForGraphs,
  isPColumnSpec,
  createPlDataTableStateV2,
  createPlDataTableV2,
} from '@platforma-sdk/model';
import { getDefaultBlockLabel } from './label';

export type BlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  datasetRef?: PlRef;
  paratopeThreshold: number;
  identity: number;
  similarityType: 'sequence-identity' | 'blosum40' | 'blosum50' | 'blosum62' | 'blosum80' | 'blosum90';
  coverageThreshold: number;
  coverageMode: 0 | 1 | 2 | 3 | 4 | 5;
  mem?: number;
  cpu?: number;
};

export type UiState = {
  tableState: PlDataTableStateV2;
  graphStateBubble: GraphMakerState;
  alignmentModel: PlMultiSequenceAlignmentModel;
  graphStateHistogram: GraphMakerState;
  graphStateProbDist: GraphMakerState;
};

/**
 * Whether a dataset's row axis identifies receptor records this block can read paratopes from.
 *
 * `pl7.app/variantKey` is shared by three producers and the axis NAME does not say which:
 * peptide-extraction stamps `pl7.app/peptide/extractionRunId`, synthetic-repertoire-profiler
 * stamps `pl7.app/repertoire/extractionRunId`, and import-vdj-data's imported sets stamp
 * `pl7.app/vdj/clonotypingRunId`. Only the last has CDRs, so the run-id key is what admits it
 * without also offering peptides and amplicon variants to a paratope predictor.
 *
 * The value of that key is the producing block's id, so it cannot be written into a declarative
 * axis selector — hence the predicate form of `getOptions` below.
 */
function isReceptorRecordAxis(axis: PColumnSpec['axesSpec'][number] | undefined): boolean {
  if (axis === undefined) return false;
  if (axis.name === 'pl7.app/vdj/clonotypeKey' || axis.name === 'pl7.app/vdj/scClonotypeKey') {
    return true;
  }
  return (
    axis.name === 'pl7.app/variantKey'
    && axis.domain?.['pl7.app/vdj/clonotypingRunId'] !== undefined
  );
}

/**
 * Whether records carry two chains in one frame, in the `pl7.app/vdj/scClonotypeChain` COLUMN
 * domain.
 *
 * Legacy MiXCR single-cell declares pairing on the axis NAME; an imported paired set declares it
 * only on the columns, so the axis alone cannot answer. Probing for such a column covers both.
 *
 * This is load-bearing rather than cosmetic. The workflow's `normalizePrimaryChainOrder` keeps
 * each feature's primary chain and orders them A-before-B, and parapred consumes chains
 * POSITIONALLY as `CDR1_0` / `CDR1_1`. Skipping that normalisation on a paired set lets the chain
 * at index 0 differ from one feature to the next, so parapred would score a chimera of heavy and
 * light regions rather than either chain.
 */
function isPairedDataset(resultPool: ResultPool, ref: PlRef): boolean {
  if (resultPool.getPColumnSpecByRef(ref)?.axesSpec[1]?.name === 'pl7.app/vdj/scClonotypeKey') {
    return true;
  }
  const perChain = resultPool.getAnchoredPColumns({ main: ref }, [{
    name: 'pl7.app/vdj/sequence',
    domain: { 'pl7.app/vdj/scClonotypeChain/index': 'primary' },
  }]);
  return (perChain?.length ?? 0) > 0;
}

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    defaultBlockLabel: getDefaultBlockLabel({}),
    customBlockLabel: '',
    paratopeThreshold: 0.5,
    identity: 0.8,
    similarityType: 'blosum62',
    coverageThreshold: 0.9,
    coverageMode: 0,
  })

  .withUiState<UiState>({
    tableState: createPlDataTableStateV2(),
    graphStateBubble: {
      title: 'Most abundant clusters',
      template: 'bubble',
      currentTab: null,
      layersSettings: {
        bubble: {
          normalizationDirection: null,
        },
      },
    },
    alignmentModel: {},
    graphStateHistogram: {
      title: 'Histogram',
      template: 'bins',
      currentTab: null,
      layersSettings: {
        bins: { fillColor: '#99e099' },
      },
      axesSettings: {
        axisY: {
          axisLabelsAngle: 90,
          scale: 'log',
        },
        other: { binsCount: 30 },
      },
    },
    graphStateProbDist: {
      title: 'Parapred score distribution',
      template: 'line',
      currentTab: null,
      layersSettings: {},
    },
  })

  .argsValid((ctx) => ctx.args.datasetRef !== undefined)

  .output('datasetOptions', (ctx) =>
    ctx.resultPool.getOptions(
      (spec) => isPColumnSpec(spec)
        && spec.annotations?.['pl7.app/isAnchor'] === 'true'
        && spec.axesSpec.length >= 2
        && spec.axesSpec[0]?.name === 'pl7.app/sampleId'
        && isReceptorRecordAxis(spec.axesSpec[1]),
      {
        label: { includeNativeLabel: false },
      }),
  )

  .output('hasRequiredColumns', (ctx) => {
    const ref = ctx.args.datasetRef;
    if (ref === undefined) return undefined;

    const isSingleCell = isPairedDataset(ctx.resultPool, ref);

    // At least one CDR column must be present
    const cdrFeatures = ['CDR1', 'CDR2', 'CDR3'];
    const hasAnyCdr = cdrFeatures.some((feature) => {
      const matchers = isSingleCell
        ? [{
            axes: [{ anchor: 'main', idx: 1 }],
            name: 'pl7.app/vdj/sequence',
            domain: {
              'pl7.app/vdj/feature': feature,
              'pl7.app/vdj/scClonotypeChain/index': 'primary',
              'pl7.app/alphabet': 'aminoacid',
            },
          }]
        : [{
            axes: [{ anchor: 'main', idx: 1 }],
            name: 'pl7.app/vdj/sequence',
            domain: {
              'pl7.app/vdj/feature': feature,
              'pl7.app/alphabet': 'aminoacid',
            },
          }];

      const cols = ctx.resultPool.getAnchoredPColumns(
        { main: ref },
        matchers,
      );
      return cols && cols.length > 0;
    });

    if (hasAnyCdr) return true;

    // No CDR columns yet: wait until the pool's data is fully loaded so we don't
    // warn while an upstream block is still computing them.
    if (!ctx.resultPool.getData().isComplete) return undefined;

    return false;
  })

  .output('isSingleCell', (ctx) => {
    if (ctx.args.datasetRef === undefined) return undefined;

    const spec = ctx.resultPool.getPColumnSpecByRef(ctx.args.datasetRef);
    if (spec === undefined) {
      return undefined;
    }

    return isPairedDataset(ctx.resultPool, ctx.args.datasetRef);
  })

  .output('inputState', (ctx): boolean | undefined => {
    const inputState = ctx.outputs?.resolve('isEmpty')?.getDataAsJson() as object;
    if (typeof inputState === 'boolean') {
      return inputState;
    }
    return undefined;
  })

  .outputWithStatus('clustersTable', (ctx) => {
    const pCols = ctx.outputs?.resolve('clustersPf')?.getPColumns();
    if (pCols === undefined) return undefined;
    return createPlDataTableV2(ctx, pCols, ctx.uiState.tableState);
  })

  .output('mmseqsOutput', (ctx) => ctx.outputs?.resolve('mmseqsOutput')?.getLogHandle())

  .output('msaPf', (ctx) => {
    const msaCols = ctx.outputs?.resolve('msaPf')?.getPColumns();
    if (!msaCols) return undefined;

    const datasetRef = ctx.args.datasetRef;
    if (datasetRef === undefined)
      return undefined;

    const labelCols = ctx.resultPool.getAnchoredPColumns(
      { main: datasetRef },
      [{
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/label',
      }],
    ) ?? [];

    return ctx.createPFrame([...msaCols, ...labelCols]);
  })

  .output('linkerColumnId', (ctx) => {
    const pCols = ctx.outputs?.resolve('msaPf')?.getPColumns();
    if (!pCols) return undefined;
    return pCols.find((p) => p.spec.annotations?.['pl7.app/isLinkerColumn'] === 'true')?.id;
  })

  .output('clusterAbundanceSpec', (ctx) => {
    const spec = ctx.outputs?.resolve('clusterAbundanceSpec')?.getDataAsJson();
    if (spec === undefined) return undefined;
    return spec as PColumnSpec;
  })

  .output('inputSpec', (ctx) => {
    const anchor = ctx.args.datasetRef;
    if (anchor === undefined)
      return undefined;
    const anchorSpec = ctx.resultPool.getPColumnSpecByRef(anchor);
    if (anchorSpec === undefined)
      return undefined;
    return anchorSpec;
  })

  .outputWithStatus('clustersPf', (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve('pf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    return createPFrameForGraphs(ctx, pCols);
  })

  .outputWithStatus('bubblePlotPf', (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve('bubblePlotPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    return createPFrameForGraphs(ctx, pCols);
  })

  .output('bubblePlotPfPcols', (ctx) => {
    const pCols = ctx.outputs?.resolve('bubblePlotPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    return pCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        } satisfies PColumnIdAndSpec),
    );
  })

  .output('clustersPfPcols', (ctx) => {
    const pCols = ctx.outputs?.resolve('pf')?.getPColumns();
    if (pCols === undefined || pCols.length === 0) {
      return undefined;
    }

    return pCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        } satisfies PColumnIdAndSpec),
    );
  })

  .outputWithStatus('probDistPf', (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve('probDistPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }
    return createPFrameForGraphs(ctx, pCols);
  })

  .output('probDistPfPcols', (ctx) => {
    const pCols = ctx.outputs?.resolve('probDistPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }
    return pCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        } satisfies PColumnIdAndSpec),
    );
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title(() => 'Paratope Clustering')

  .subtitle((ctx) => ctx.args.customBlockLabel || ctx.args.defaultBlockLabel)

  .sections((_ctx) => [
    { type: 'link', href: '/', label: 'Main' },
    { type: 'link', href: '/bubble', label: 'Most Abundant Clusters' },
    { type: 'link', href: '/histogram', label: 'Cluster Size Histogram' },
    { type: 'link', href: '/prob-dist', label: 'Parapred Score Distribution' },
  ])

  .done(2);

export { getDefaultBlockLabel, similarityTypeOptions } from './label';
