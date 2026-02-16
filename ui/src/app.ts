import { getDefaultBlockLabel, model } from '@platforma-open/milaboratories.paratope-clustering.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import { watchEffect } from 'vue';
import BubblePlotPage from './pages/BubblePlotPage.vue';
import MainPage from './pages/MainPage.vue';
import HistogramPage from './pages/HistogramPage.vue';
import ProbDistPage from './pages/ProbDistPage.vue';

export const sdkPlugin = defineApp(model, (app) => {
  app.model.args.customBlockLabel ??= '';

  syncDefaultBlockLabel(app.model);

  return {
    progress: () => {
      return app.model.outputs.isRunning;
    },
    routes: {
      '/': () => MainPage,
      '/bubble': () => BubblePlotPage,
      '/histogram': () => HistogramPage,
      '/prob-dist': () => ProbDistPage,
    },
  };
});

export const useApp = sdkPlugin.useApp;

type AppModel = ReturnType<typeof useApp>['model'];

function syncDefaultBlockLabel(model: AppModel) {
  watchEffect(() => {
    model.args.defaultBlockLabel = getDefaultBlockLabel({
      paratopeThreshold: model.args.paratopeThreshold,
      similarityType: model.args.similarityType,
      identity: model.args.identity,
      coverageThreshold: model.args.coverageThreshold,
    });
  });
}
