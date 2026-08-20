import { createApp } from "vue";
import App from "./App.vue";
import { reveal } from "./directives/reveal";
import { tilt } from "./directives/tilt";
import "./assets/css/font.css";
import "./assets/css/base.css";
import "./assets/css/commonLayout.css";
import "./assets/css/layout.css";

createApp(App).directive("reveal", reveal).directive("tilt", tilt).mount("#app");
