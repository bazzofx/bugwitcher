
import { GraphData, FileData } from "../types";


const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
const SECURITY_PROMPT = `
You are an expert web security analyst, static analysis engine, and data-flow modeling system.

Your task is to analyze JavaScript and HTML source code and produce a **security-focused data-flow graph** that highlights how data moves through the application, where user input comes from, where it flows to, and where security risks may occur.

Your output must help security researchers, penetration testers, and bug bounty hunters understand potential vulnerabilities, trust boundaries, and critical functions within the codebase.

------------------------------------

### FIELD DEFINITIONS

#### nodes
List all important entities in the code:
- functions
- variables
- DOM elements
- event handlers
- network requests
- sinks
- sanitizers
- input sources
Each node must include:
- "id": unique string
- "label": human readable name
- "type": "function" | "variable" | "dom" | "event" | "api" | "input" | "sink" | "sanitizer"
- "category": domain-specific category such as: "dom_write", "dom_read", "network", "validation", "user_input", etc.
- "description": brief summary of what this entity does.
- "file": Name of the source file this node was extracted from.
- "snippet": The specific line of code or function definition body associated with this node.

#### links
Connections describing how data flows:
- "source": id
- "target": id
- "type": "call" | "data_flow" | "input_to_function" | "function_to_dom" | "sanitization" | "trust_boundary" | "untrusted_flow" | "network_request" | "dom_write" | "event_trigger"

#### security_findings
List possible vulnerabilities or weaknesses. Each item should be an object: 
{
  "title": string, 
  "description": string, 
  "nodes": string[],
  "payload_suggestion": string,
  "test_strategy": string
}
- "payload_suggestion": A potential malicious payload (e.g., <img src=x onerror=alert(1)>) to test the vulnerability.
- "test_strategy": Clear instructions on how to manually verify the vulnerability.

#### summary
A concise 2–3 sentence overview.

------------------------------------
### ANALYSIS REQUIREMENTS
Perform deep static analysis to track arguments and variables. Identify untrusted -> sink flows. Detect dangerous patterns (XSS, Injection, CSRF). Identify broken sanitization chains.
IMPORTANT: Every node MUST have a "file" and "snippet" field so we can trace back to the source code.
Output ONLY valid JSON.

------------------------------------
### STRICT OUTPUT REQUIREMENT
It's very important to only Return **ONLY valid JSON** matching the structure below:

{
  "nodes": [],
  "links": [],
  "security_findings": [],
  "critical_functions": [],
  "input_sources": [],
  "sinks": [],
  "trust_boundaries": [],
  "summary": ""
}

No explanations outside JSON. No Markdown. No comments. No text before or after the JSON.
`;

export async function analyzeCodeFlow(files: FileData[]): Promise<GraphData> {
  const combinedCode = files.map(f => `FILE: ${f.name}\n---\n${f.content}\n---`).join('\n\n');
  
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SECURITY_PROMPT },
          { role: "user", content: `Analyze these source files for vulnerabilities and provide payloads:\n\n${combinedCode}` }
        ],
        stream: false,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    const content = responseData.choices[0].message.content;

    if (!content) throw new Error("No response content from DeepSeek engine.");

    // Robust parsing in case the model returns markdown wrapped JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    const data = JSON.parse(jsonString) as GraphData;

    return {
      nodes: data.nodes || [],
      links: data.links || [],
      security_findings: data.security_findings || [],
      critical_functions: data.critical_functions || [],
      input_sources: data.input_sources || [],
      sinks: data.sinks || [],
      trust_boundaries: data.trust_boundaries || [],
      summary: data.summary || "No summary available."
    };
  } catch (error: any) {
    console.error("DeepSeek Analysis Error:", error);
    throw new Error(error.message || "Security analysis failed. Please check your connectivity or API key.");
  }
}
