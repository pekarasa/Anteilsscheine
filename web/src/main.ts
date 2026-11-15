import { texts } from "./ui/texts";

const app = document.getElementById("app");
if (!app) {
  throw new Error("Missing #app element");
}

const heading = document.createElement("h1");
heading.textContent = texts.appTitle;
const placeholder = document.createElement("p");
placeholder.textContent = texts.placeholder;
app.append(heading, placeholder);
