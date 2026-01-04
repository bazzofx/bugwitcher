
import React from 'react';

export const NODE_COLORS: Record<string, string> = {
  function: '#f59236ff',   // Purple
  variable: '#edf1c4ff',   // Vibrant Blue
  dom: '#a478f5ff',        // Violet
  event: '#22d3ee',      // Cyan
  api: '#fa6fb0ff',        // Indigo
  input: '#35c935ff',      // Pink
  sink: '#e02746ff',       // Rose (Dangerous but neon)
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

export const PLACEHOLDER_CODE = ``;
