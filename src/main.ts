import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/pages.css";
import { createApp } from "./app";

const root = document.querySelector("#app");
if (!root) throw new Error("앱 루트 요소를 찾을 수 없습니다.");

const app = createApp(root);
app.router.render();
