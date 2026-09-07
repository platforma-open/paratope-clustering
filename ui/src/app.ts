import {
  getDefaultBlockLabel,
  platforma,
} from "@platforma-open/milaboratories.paratope-clustering.model";
import { defineAppV3 } from "@platforma-sdk/ui-vue";
import { watchEffect } from "vue";
import BubblePlotPage from "./pages/BubblePlotPage.vue";
import MainPage from "./pages/MainPage.vue";
import HistogramPage from "./pages/HistogramPage.vue";
import ProbDistPage from "./pages/ProbDistPage.vue";

export const sdkPlugin = defineAppV3(platforma, (app) => {
  syncDefaultBlockLabel(app.model);

  return {
    progress: () => {
      return app.model.outputs.isRunning;
    },
    routes: {
      "/": () => MainPage,
      "/bubble": () => BubblePlotPage,
      "/histogram": () => HistogramPage,
      "/prob-dist": () => ProbDistPage,
    },
  };
});

export const useApp = sdkPlugin.useApp;

type AppModel = ReturnType<typeof useApp>["model"];

function syncDefaultBlockLabel(model: AppModel) {
  watchEffect(() => {
    model.data.defaultBlockLabel = getDefaultBlockLabel({
      paratopeThreshold: model.data.paratopeThreshold,
      similarityType: model.data.similarityType,
      identity: model.data.identity,
      coverageThreshold: model.data.coverageThreshold,
    });
  });
}
