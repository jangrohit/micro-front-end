import React from "react";
import { useEffect } from "react";
import { mount } from "marketing/MarketingApp";

export const MarketingApp = () => {
  const ref = React.useRef(null);

  useEffect(() => {
    if (ref.current) mount(ref.current);
  }, []);
  return <div ref={ref}></div>;
};
