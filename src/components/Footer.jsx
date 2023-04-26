import React from "react";

export const Footer = () => {
  return (
    <div style={{ zIndex: -1, padding: 64, opacity: 0.5, fontSize: 12 }}>
      created by <a href="https://eco.org">eco</a> with{" "}
      <a href="https://github.com/austintgriffith/scaffold-eth#-scaffold-eth" target="_blank" rel="noreferrer">
        scaffold-eth
      </a>
    </div>
  );
};