import React from "react";

export const RulerTick = ({ label }: { label: string }) => (
  <div className="ruler">
    <span className="ruler__tick">{label}</span>
  </div>
);
