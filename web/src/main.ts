import "./ui/style.css";
import { calendarDateOf } from "./io/dates";
import { createIndexedDbStorage } from "./state/persistence";
import { AppStore } from "./state/store";
import { mountApp } from "./ui/app";

const app = document.getElementById("app");
if (!app) {
  throw new Error("Missing #app element");
}

mountApp(app, new AppStore(() => calendarDateOf(new Date())), createIndexedDbStorage());
