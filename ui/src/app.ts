import { platforma } from "@platforma-open/milaboratories.paratope-clustering.model";
import { defineAppV3 } from "@platforma-sdk/ui-vue";
import BubblePlotPage from "./pages/BubblePlotPage.vue";
import MainPage from "./pages/MainPage.vue";
import HistogramPage from "./pages/HistogramPage.vue";
import ProbDistPage from "./pages/ProbDistPage.vue";

export const sdkPlugin = defineAppV3(platforma, (app) => {
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
