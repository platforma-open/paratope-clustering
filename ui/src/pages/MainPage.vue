<script setup lang="ts">
import { PlMultiSequenceAlignment } from '@milaboratories/multi-sequence-alignment';
import strings from '@milaboratories/strings';
import type { AxisId, PColumnIdAndSpec, PlRef, PlSelectionModel, PTableKey } from '@platforma-sdk/model';
import {
  PlAccordionSection,
  PlAgDataTableV2,
  PlAlert,
  PlBlockPage,
  PlBtnGhost,
  PlDropdown,
  PlDropdownRef,
  PlLogView,
  PlMaskIcon24,
  PlNumberField,
  PlSectionSeparator,
  PlSlideModal,
  usePlDataTableSettingsV2,
} from '@platforma-sdk/ui-vue';
import { similarityTypeOptions } from '@platforma-open/milaboratories.paratope-clustering.model';
import { computed, reactive, ref, watch } from 'vue';
import { useApp } from '../app';

const app = useApp();

// Migrate legacy 'alignment-score' → 'blosum62'
if ((app.model.args.similarityType as string) === 'alignment-score') {
  app.model.args.similarityType = 'blosum62';
}

const multipleSequenceAlignmentOpen = ref(false);
const mmseqsLogOpen = ref(false);
const settingsOpen = ref(app.model.args.datasetRef === undefined);

watch(() => app.model.outputs.isRunning, (isRunning) => {
  if (isRunning) {
    settingsOpen.value = false;
  }
});

const selection = ref<PlSelectionModel>({
  axesSpec: [],
  selectedKeys: [],
});

const onRowDoubleClicked = reactive((key?: PTableKey) => {
  if (key) {
    const clusterSpecs = app.model.outputs.clusterAbundanceSpec;
    if (clusterSpecs === undefined) return;
    selection.value = {
      axesSpec: [clusterSpecs.axesSpec[1]],
      selectedKeys: [key],
    };
  }
  multipleSequenceAlignmentOpen.value = true;
});

function setInput(inputRef?: PlRef) {
  app.model.args.datasetRef = inputRef;
}

const tableSettings = usePlDataTableSettingsV2({
  model: () => app.model.outputs.clustersTable,
});

const isSequenceColumn = (column: PColumnIdAndSpec) => {
  return column.spec?.annotations?.['pl7.app/sequence/paratope'] === 'true';
};

const clusterAxis = computed<AxisId>(() => {
  if (app.model.outputs.clusterAbundanceSpec?.axesSpec[1] === undefined) {
    return {
      type: 'String',
      name: 'pl7.app/vdj/clusterId',
      domain: {},
    };
  } else {
    return {
      type: 'String',
      name: 'pl7.app/vdj/clusterId',
      domain: app.model.outputs.clusterAbundanceSpec?.axesSpec[1].domain,
    };
  }
});

</script>

<template>
  <PlBlockPage
    v-model:subtitle="app.model.args.customBlockLabel"
    :subtitle-placeholder="app.model.args.defaultBlockLabel"
    title="Paratope Clustering"
  >
    <template #append>
      <PlBtnGhost @click.stop="() => (mmseqsLogOpen = true)">
        Logs
        <template #append>
          <PlMaskIcon24 name="file-logs" />
        </template>
      </PlBtnGhost>
      <PlBtnGhost @click.stop="() => (settingsOpen = true)">
        Settings
        <template #append>
          <PlMaskIcon24 name="settings" />
        </template>
      </PlBtnGhost>
    </template>
    <PlAgDataTableV2
      v-model="app.model.ui.tableState"
      :settings="tableSettings"
      :not-ready-text="strings.callToActions.configureSettingsAndRun"
      :no-rows-text="strings.states.noDataAvailable"
      :show-cell-button-for-axis-id="clusterAxis"
      @cell-button-clicked="onRowDoubleClicked"
    />
    <PlSlideModal v-model="settingsOpen" :close-on-outside-click="true" shadow>
      <template #title>Settings</template>
      <PlDropdownRef
        v-model="app.model.args.datasetRef"
        :options="app.model.outputs.datasetOptions"
        label="Dataset"
        clearable
        required
        @update:model-value="setInput"
      />

      <PlAlert v-if="app.model.outputs.hasRequiredColumns === false" type="warn" style="margin-top: 1rem">
        The selected dataset has no CDR amino acid columns (CDR1, CDR2, or CDR3).
        Please select a dataset with at least one CDR sequence feature.
      </PlAlert>

      <PlNumberField
        v-model="app.model.args.paratopeThreshold"
        label="Paratope Probability Threshold"
        :minValue="0.0"
        :step="0.05"
        :maxValue="1.0"
      >
        <template #tooltip>
          Minimum Parapred probability for a residue to be classified as part of the paratope (antigen-binding site).
          Lower values include more residues; higher values are more stringent.
        </template>
      </PlNumberField>

      <PlDropdown
        v-model="app.model.args.similarityType"
        :options="similarityTypeOptions"
        label="Alignment Score"
      >
        <template #tooltip>
          Select the similarity metric used for paratope clustering. BLOSUM matrices score biochemical similarity between amino acids — lower numbers (e.g. BLOSUM40) are suited for more divergent sequences, higher numbers (e.g. BLOSUM80) for closely related sequences. BLOSUM62 is a good general-purpose default. Exact Match counts only identical residues.
        </template>
      </PlDropdown>

      <PlNumberField
        v-model="app.model.args.identity"
        label="Minimal Identity"
        :minValue="0.1"
        :step="0.1"
        :maxValue="1.0"
      >
        <template #tooltip>
          Sets the lowest percentage of identical residues required for paratope sequences to be considered for the same cluster.
        </template>
      </PlNumberField>

      <PlNumberField
        v-model="app.model.args.coverageThreshold"
        label="Coverage Threshold"
        :minValue="0.1"
        :step="0.1"
        :maxValue="1.0"
      >
        <template #tooltip>
          Sets the lowest percentage of sequence length that must be covered for paratope sequences to be considered for the same cluster.
        </template>
      </PlNumberField>

      <PlAlert v-if="app.model.outputs.inputState" type="warn" style="margin-top: 1rem">
        Error: The input dataset you have selected is empty.
        Please choose a different dataset.
      </PlAlert>

      <PlAccordionSection label="Advanced Settings">
        <PlSectionSeparator>Resource Allocation</PlSectionSeparator>
        <PlNumberField
          v-model="app.model.args.mem"
          label="Memory (GiB)"
          :minValue="1"
          :step="1"
          :maxValue="1012"
        >
          <template #tooltip>
            Sets the amount of memory to use for the clustering.
          </template>
        </PlNumberField>

        <PlNumberField
          v-model="app.model.args.cpu"
          label="CPU (cores)"
          :minValue="1"
          :step="1"
          :maxValue="128"
        >
          <template #tooltip>
            Sets the number of CPU cores to use for the clustering.
          </template>
        </PlNumberField>
      </PlAccordionSection>
    </PlSlideModal>
  </PlBlockPage>
  <PlSlideModal
    v-model="multipleSequenceAlignmentOpen"
    width="100%"
    :close-on-outside-click="false"
  >
    <template #title>Multiple Sequence Alignment</template>
    <PlMultiSequenceAlignment
      v-if="app.model.outputs.inputState === false"
      v-model="app.model.ui.alignmentModel"
      :sequence-column-predicate="isSequenceColumn"
      :p-frame="app.model.outputs.msaPf"
      :selection="selection"
    />
  </PlSlideModal>
  <PlSlideModal v-model="mmseqsLogOpen" width="80%">
    <template #title>MMseqs2 Log</template>
    <PlLogView :log-handle="app.model.outputs.mmseqsOutput" />
  </PlSlideModal>
</template>
