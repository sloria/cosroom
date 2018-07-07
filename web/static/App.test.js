import ReactDOM from "react-dom";
import React from "react";
import { App, dummyData } from "./App";

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App {...dummyData} />, div);
});
