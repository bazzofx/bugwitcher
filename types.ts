
export type NodeType = 'function' | 'variable' | 'dom' | 'event' | 'api' | 'input' | 'sink' | 'sanitizer';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  category?: string;
  description?: string;
  file?: string;      // The filename where the node was extracted from
  snippet?: string;   // The specific code snippet or function body
}

export interface GraphLink {
  source: string;
  target: string;
  type?: string;
  relationship?: string;
}

export interface TrustBoundary {
  source: string;
  target: string;
  reason: string;
}

export interface SecurityFinding {
  title?: string;
  description: string;
  nodes?: string[];
  payload_suggestion?: string; // Suggested payload for testing the vulnerability
  test_strategy?: string;      // Step-by-step instructions to verify the risk
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  security_findings: SecurityFinding[];
  critical_functions: string[];
  input_sources: string[];
  sinks: string[];
  trust_boundaries: TrustBoundary[];
  summary: string;
}

export interface FileData {
  name: string;
  content: string;
  type: string;
}
