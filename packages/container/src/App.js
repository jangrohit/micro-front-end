import React from "react";
import { MarketingApp } from "./components/MarketingApp";
import Header from "./components/Header";
import { BrowserRouter } from "react-router-dom";
import {
  StylesProvider,
  createGenerateClassName,
} from "@material-ui/core/styles";

const generateClassName = createGenerateClassName({
  productionPrefix: "co-prod",
});

export const App = () => {
  return (
    <StylesProvider generateClassName={generateClassName}>
      <BrowserRouter>
        <Header signedIn={true} onSignOut={() => console.log("sign out")} />
        <MarketingApp />
      </BrowserRouter>
    </StylesProvider>
  );
};
