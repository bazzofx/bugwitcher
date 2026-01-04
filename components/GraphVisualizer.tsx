
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink, SecurityFinding } from '../types';
import { NODE_COLORS, NODE_ICONS } from '../constants';

interface GraphVisualizerProps {
  data: GraphData;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodeSelectionRef = useRef<any>(null);
  const linkSelectionRef = useRef<any>(null);
  const circleSelectionRef = useRef<any>(null);

  // Filter links to ensure both source and target exist in the nodes array
  const validData = useMemo(() => {
    const nodeIds = new Set(data.nodes.map(n => n.id));
    const filteredLinks = data.links.filter(l => 
      nodeIds.has(typeof l.source === 'string' ? l.source : (l.source as any).id) && 
      nodeIds.has(typeof l.target === 'string' ? l.target : (l.target as any).id)
    );
    return {
      nodes: data.nodes.map(n => ({ ...n })),
      links: filteredLinks.map(l => ({ ...l }))
    };
  }, [data]);

  // Helper to format labels
  const formatLabel = (d: GraphNode) => {
    let cleanLabel = d.label;
    if (d.type === 'function') return `${cleanLabel}()`;
    if (d.type === 'variable') {
      const stripped = cleanLabel.replace(/\s*variable\s*$/i, '');
      return `var ${stripped}`;
    }
    if (d.type === 'dom') {
      const stripped = cleanLabel.replace(/\s*(DOM\s*element|element)\s*$/i, '');
      return `<${stripped}>`;
    }
    return cleanLabel;
  };

  // Identify nodes that are "vulnerable" or "sinks"
  const vulnerableNodeIds = useMemo(() => {
    const ids = new Set<string>();
    data.security_findings.forEach(finding => {
      if (typeof finding !== 'string' && finding.nodes) {
        finding.nodes.forEach(id => ids.add(id));
      }
    });
    data.sinks.forEach(id => ids.add(id));
    return ids;
  }, [data]);

  // Map nodes to findings for easy lookup in the popup
  const nodeFindingsMap = useMemo(() => {
    const map = new Map<string, SecurityFinding[]>();
    data.security_findings.forEach(finding => {
      if (typeof finding !== 'string' && finding.nodes) {
        finding.nodes.forEach(nodeId => {
          if (!map.has(nodeId)) map.set(nodeId, []);
          map.get(nodeId)!.push(finding);
        });
      }
    });
    return map;
  }, [data.security_findings]);

  // Calculate the attack path (all nodes that flow into a target node)
  const getAttackPath = (targetId: string) => {
    const pathNodes = new Set<string>([targetId]);
    const pathLinks = new Set<any>();
    const queue = [targetId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      validData.links.forEach((link: any) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (targetId === currentId && !pathNodes.has(sourceId)) {
          pathNodes.add(sourceId);
          pathLinks.add(link);
          queue.push(sourceId);
        }
      });
    }
    return { nodes: pathNodes, links: pathLinks };
  };

  const attackPath = useMemo(() => {
    const activeId = hoveredNode?.id || selectedNodeId;
    if (activeId && (vulnerableNodeIds.has(activeId) || hoveredNode?.type === 'sink')) {
      return getAttackPath(activeId);
    }
    return null;
  }, [hoveredNode, selectedNodeId, validData, vulnerableNodeIds]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !validData.nodes.length) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<GraphNode & d3.SimulationNodeDatum>(validData.nodes as any)
      .force("link", d3.forceLink<GraphNode & d3.SimulationNodeDatum, GraphLink & d3.SimulationLinkDatum<GraphNode & d3.SimulationNodeDatum>>(validData.links as any).id(d => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(80));

    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .append("path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#64748b");

    svg.append("defs").append("marker")
      .attr("id", "arrowhead-attack")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#ef4444");

    const link = g.append("g")
      .selectAll("path")
      .data(validData.links)
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1.8)
      .attr("marker-end", "url(#arrowhead)")
      .style("pointer-events", "none") // Prevent flicker on links
      .style("transition", "stroke 0.3s, opacity 0.3s");

    linkSelectionRef.current = link;

    const node = g.append("g")
      .selectAll(".node")
      .data(validData.nodes)
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("mouseenter", (_, d) => setHoveredNode(d as any))
      .on("mouseleave", () => setHoveredNode(null))
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNodeId(prev => prev === (d as any).id ? null : (d as any).id);
      })
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    nodeSelectionRef.current = node;

    svg.on("click", () => setSelectedNodeId(null));

    const circle = node.append("circle")
      .attr("r", 18)
      .attr("fill", d => NODE_COLORS[(d as any).type] || '#fff')
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 0 5px rgba(0,0,0,0.5))")
      .style("transition", "fill 0.3s ease, opacity 0.3s ease"); // Optimize transition to avoid hit-test jitter

    circleSelectionRef.current = circle;

    node.append("foreignObject")
      .attr("width", 20)
      .attr("height", 20)
      .attr("x", -10)
      .attr("y", -10)
      .style("pointer-events", "none") // Prevent flicker by letting mouse pass through to node
      .append("xhtml:div")
      .attr("class", d => `fas ${NODE_ICONS[(d as any).type]} flex items-center justify-center text-[10px] h-full w-full pointer-events-none`)
      .style("color", "#0f172a");

    node.append("text")
      .attr("dx", 24)
      .attr("dy", ".35em")
      .attr("fill", "#f1f5f9")
      .attr("font-size", "13px")
      .attr("font-weight", "500")
      .attr("font-family", "Inter, sans-serif")
      .style("pointer-events", "none") // Prevent flicker on text
      .text(d => formatLabel(d as any));

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    const handleResize = () => {
      if (!containerRef.current) return;
      simulation.force("center", d3.forceCenter(containerRef.current.clientWidth / 2, containerRef.current.clientHeight / 2)).alpha(0.3).restart();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      simulation.stop();
    };
  }, [validData]);

  useEffect(() => {
    if (!nodeSelectionRef.current || !linkSelectionRef.current || !circleSelectionRef.current) return;

    const activeId = hoveredNode?.id || selectedNodeId;
    const neighbors = new Set<string>();
    
    if (activeId) {
      neighbors.add(activeId);
      validData.links.forEach((l: any) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (s === activeId) neighbors.add(t);
        if (t === activeId) neighbors.add(s);
      });
    }

    const isAttackPathMode = !!attackPath;

    nodeSelectionRef.current.style("opacity", (d: any) => {
      if (isAttackPathMode) return attackPath!.nodes.has(d.id) ? 1 : 0.1;
      return !activeId || neighbors.has(d.id) ? 1 : 0.1;
    });
    
    circleSelectionRef.current
      .style("stroke", (d: any) => {
        if (isAttackPathMode && attackPath!.nodes.has(d.id)) return "#ef4444";
        return d.id === activeId ? "#fff" : "#0f172a";
      })
      .style("stroke-width", (d: any) => {
        if (isAttackPathMode && attackPath!.nodes.has(d.id)) return 4;
        return d.id === activeId ? 4 : 2;
      })
      .style("filter", (d: any) => {
        if (isAttackPathMode && attackPath!.nodes.has(d.id)) return "drop-shadow(0 0 10px #ef4444)";
        return d.id === activeId ? `drop-shadow(0 0 15px ${NODE_COLORS[d.type]})` : "none";
      });

    linkSelectionRef.current
      .style("opacity", (l: any) => {
        if (isAttackPathMode) return attackPath!.links.has(l) ? 1 : 0.05;
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return !activeId || (s === activeId || t === activeId) ? 1 : 0.05;
      })
      .attr("stroke", (l: any) => {
        if (isAttackPathMode && attackPath!.links.has(l)) return "#ef4444";
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return activeId && (s === activeId || t === activeId) ? "#94a3b8" : "#334155";
      })
      .attr("marker-end", (l: any) => {
        if (isAttackPathMode && attackPath!.links.has(l)) return "url(#arrowhead-attack)";
        return "url(#arrowhead)";
      });
  }, [hoveredNode, selectedNodeId, validData.links, attackPath]);

  const activeNode = hoveredNode || (selectedNodeId ? data.nodes.find(n => n.id === selectedNodeId) : null);
  const currentFindings = hoveredNode ? nodeFindingsMap.get(hoveredNode.id) || [] : [];

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 overflow-hidden cursor-move">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Tooltip & Source Reference Panel */}
      {activeNode && (
        <div 
          className="absolute top-6 left-6 w-[420px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] z-50 animate-in fade-in slide-in-from-left-6 duration-300 overflow-hidden flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-800/40 border-b border-slate-700/30">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-inner"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500/80 shadow-inner"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 shadow-inner"></div>
              </div>
              <div className="flex items-center gap-2">
                <i className={`fas ${NODE_ICONS[activeNode.type]} text-[10px] text-slate-500`}></i>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{activeNode.type}</span>
              </div>
            </div>
            {activeNode.file && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/50 border border-slate-700/50 rounded-md">
                <i className="fas fa-file-code text-[8px] text-blue-400"></i>
                <span className="text-[9px] font-mono text-slate-300 truncate max-w-[140px]">{activeNode.file}</span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar max-h-[600px] pointer-events-auto">
            <h3 className="text-2xl font-bold text-white leading-tight tracking-tight">
              {formatLabel(activeNode)}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {activeNode.description || "Logic component identified within the execution flow."}
            </p>

            {activeNode.snippet && (
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 opacity-80">
                  <i className="fas fa-terminal text-[8px]"></i> Source Snippet
                </h4>
                <div className="relative group">
                   <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-blue-400 overflow-auto max-h-[200px] custom-scrollbar shadow-inner leading-relaxed select-text pointer-events-auto">
                    <pre className="whitespace-pre">{activeNode.snippet}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(vulnerableNodeIds.has(activeNode.id) || attackPath) && (
            <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20">
              <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] flex items-center gap-2.5">
                <i className="fas fa-skull-crossbones animate-pulse"></i> 
                {attackPath ? "Displaying Full Attack Path" : "Vulnerable Sink Detected"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Floating Payload Popup (Triggered on Hover of Vulnerable Node) */}
      {hoveredNode && currentFindings.length > 0 && (
        <div className="absolute top-6 right-6 w-80 z-[60] animate-in fade-in slide-in-from-right-6 duration-300 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-red-500/40 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
            <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-3 flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-[10px] text-white">
                <i className="fas fa-flask"></i>
              </div>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Security Sandbox</span>
            </div>
            
            <div className="p-5 space-y-4">
              {currentFindings.map((finding, idx) => (
                <div key={idx} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                  {finding.payload_suggestion && (
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-2">
                        <i className="fas fa-bug text-[8px] text-red-400"></i> Potential Payload
                      </div>
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-red-400 break-all select-all shadow-inner border-l-2 border-l-red-500/50">
                        {finding.payload_suggestion}
                      </div>
                    </div>
                  )}
                  {finding.test_strategy && (
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-2">
                        <i className="fas fa-vial text-[8px] text-blue-400"></i> Test Strategy
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic border-l border-slate-700 pl-3">
                        {finding.test_strategy}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="bg-slate-800/20 px-5 py-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Awaiting Verification</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-3 p-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/50 shadow-xl pointer-events-auto">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Legend</h4>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-3 text-xs text-slate-300 capitalize group transition-all cursor-default">
            <div className="w-5 h-5 rounded-lg shadow-[0_0_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform flex items-center justify-center bg-slate-800 border border-slate-700" style={{ color: color }}>
              <i className={`fas ${NODE_ICONS[type]} text-[10px]`}></i>
            </div>
            <span className="group-hover:text-white transition-colors">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraphVisualizer;
