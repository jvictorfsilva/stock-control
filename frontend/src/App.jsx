import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Theme } from "@carbon/react";
import AppHeader from "./components/Header";
import ItemTable from "./components/ItemTable";
import CategoriesTable from "./components/CategoriesTable";

import "./styles/styles.scss";

function App() {
  return (
    <Router>
      <Theme theme="g100">
        <AppHeader />
      </Theme>

      <Theme theme="white">
        <Routes>
          <Route path="/" element={<ItemTable />} />
          <Route path="/categories" element={<CategoriesTable />} />
        </Routes>
      </Theme>
    </Router>
  );
}

export default App;
