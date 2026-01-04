
import React from 'react';

export const NODE_COLORS: Record<string, string> = {
  function: '#60a5fa',   // Blue
  variable: '#4ade80',   // Light Green (per request)
  dom: '#fb923c',        // Orange
  event: '#f472b6',      // Pink
  api: '#a855f7',        // Purple
  input: '#eab308',      // Yellow
  sink: '#ef4444',       // Red (Dangerous)
  sanitizer: '#10b981',  // Emerald (Safety)
};

export const NODE_ICONS: Record<string, string> = {
  function: 'fa-code',
  variable: 'fa-cube',
  dom: 'fa-desktop',
  event: 'fa-bolt',
  api: 'fa-server',
  input: 'fa-keyboard',
  sink: 'fa-skull-crossbones',
  sanitizer: 'fa-broom',
};

export const PLACEHOLDER_CODE = `
// Welcome to FlowCode AI!
// Example of a potentially risky flow:
function submitForm() {
  const userInput = document.getElementById('search-box').value;
  // Dangerous Sink: innerHTML
  document.getElementById('results').innerHTML = "Results for: " + userInput;
}
`;
