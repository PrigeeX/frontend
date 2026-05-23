import React from "react";

export const RulerTick = ({ label, className }: { label: string; className?: string }) => (
  <div className={`ruler ${className || ""}`}>
    <span className="ruler__tick">{label}</span>
  </div>
);
