import React from "react";
import { MarketingApp } from "./components/MarketingApp";
import Header from "./components/Header";
import { BrowserRouter } from "react-router-dom";
export const App = () => {
  return (
    <BrowserRouter>
      <Header signedIn={true} onSignOut={() => console.log("sign out")} />
      <MarketingApp />
    </BrowserRouter>
  );
};
