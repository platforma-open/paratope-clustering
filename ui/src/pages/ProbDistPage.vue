<script setup lang="ts">
import strings from '@milaboratories/strings';
import type { PredefinedGraphOption } from '@milaboratories/graph-maker';
import { GraphMaker } from '@milaboratories/graph-maker';
import { PlBlockPage } from '@platforma-sdk/ui-vue';
import { useApp } from '../app';
import { computed } from 'vue';

const app = useApp();

const defaultOptions = computed((): PredefinedGraphOption<'discrete'>[] => {
  return [
    {
      inputName: 'y',
      selectedSource: {
        kind: 'PColumn',
        valueType: 'Int',
        name: 'pl7.app/parapred/residueCount',
        axesSpec: [],
      },
    },
    {
      inputName: 'primaryGrouping',
      selectedSource: {
        type: 'String',
        name: 'pl7.app/parapred/probabilityBin',
      },
    },
  ];
});
</script>

<template>
  <PlBlockPage>
    <GraphMaker
      v-model="app.model.ui.graphStateProbDist"
      chartType="discrete"
      :p-frame="app.model.outputs.probDistPf"
      :default-options="defaultOptions"
      :status-text="{ noPframe: { title: strings.callToActions.configureSettingsAndRun } }"
    />
  </PlBlockPage>
</template>
