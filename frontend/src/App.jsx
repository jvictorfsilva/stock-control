import React from "react";
import { Theme } from "@carbon/react";
import AppHeader from "./components/Header";
import ItemTable from "./components/ItemTable";

import "./styles/styles.scss";

function App() {
  return (
    <>
      <Theme theme="g100">
        <AppHeader />
      </Theme>
      <Theme theme="white">
        <ItemTable />
      </Theme>
    </>
  );
}

export default App;
