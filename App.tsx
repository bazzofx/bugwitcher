
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FileData, GraphData, GraphNode } from './types';
import { analyzeCodeFlow } from './services/geminiService';
import GraphVisualizer from './components/GraphVisualizer';

/**
 * Advanced Loading Component
 * Features a Canvas-based lightning-bug animation and a central searching indicator.
 */
const LoadingScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    interface Segment {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
    }

    interface Bug {
      x: number;
      y: number;
      tx: number;
      ty: number;
      segments: Segment[];
      color: string;
    }

    const bugs: Bug[] = [];
    const maxBugs = 12;

    const createBug = (): Bug => ({
      x: Math.random() * width,
      y: Math.random() * height,
      tx: Math.random() * width,
      ty: Math.random() * height,
      segments: [],
       color: Math.random() > 0.5 ? '#3b82f6' : '#a855f7' // Blue or Purple
    });

    for (let i = 0; i < maxBugs; i++) bugs.push(createBug());

    let animationFrame: number;
    let frame = 0;

    const animate = () => {
      frame++;
    // Clear with deep black/navy background
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, width, height);

      // Gradient background overlay
      const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
      grad.addColorStop(0, 'rgba(5, 7, 10, 0)');
      grad.addColorStop(1, 'rgba(59, 130, 246, 0.03)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      bugs.forEach(bug => {
        // Lightning-bolt style movement logic
        if (frame % 8 === 0) {
          const angle = Math.random() * Math.PI * 2;
          const length = 20 + Math.random() * 40;
          const nextX = bug.x + Math.cos(angle) * length;
          const nextY = bug.y + Math.sin(angle) * length;

          // Add segment to trail
          bug.segments.push({
            x1: bug.x,
            y1: bug.y,
            x2: nextX,
            y2: nextY,
            opacity: 1.0
          });

          bug.x = nextX;
          bug.y = nextY;

          // Wrap around screen
          if (bug.x < 0) bug.x = width;
          if (bug.x > width) bug.x = 0;
          if (bug.y < 0) bug.y = height;
          if (bug.y > height) bug.y = 0;
        }

        // Render segments
        bug.segments.forEach((seg, idx) => {
          seg.opacity -= 0.015; // Fade over a few seconds
          if (seg.opacity <= 0) return;

          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.strokeStyle = bug.color === '#3b82f6' ? `rgba(59, 130, 246, ${seg.opacity})` : `rgba(168, 85, 247, ${seg.opacity})`;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 12 * seg.opacity;
          ctx.shadowColor = bug.color;
          ctx.stroke();
        });

        // Cleanup dead segments
        bug.segments = bug.segments.filter(s => s.opacity > 0);

        // Draw bug head (spark)
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = bug.color;
        ctx.fillRect(bug.x - 1, bug.y - 1, 3, 3);
        ctx.shadowBlur = 0;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070a]/95 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center">
         {/* Advanced Animation Group */}
         <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
            {/* Pulsing Back Glow */}
            <div className="absolute w-32 h-32 bg-blue-600/10 blur-3xl rounded-full animate-pulse"></div>
            
            {/* Mechanical Outer Rings */}
            <div className="absolute inset-0 border-t-2 border-l-2 border-blue-500/30 rounded-[3.5rem] animate-[spin_4s_linear_infinite]"></div>
            <div className="absolute inset-4 border-b-2 border-r-2 border-slate-700 rounded-[2.5rem] animate-[spin_6s_linear_reverse_infinite]"></div>
            <div className="absolute inset-8 border-2 border-slate-800 border-dashed rounded-full animate-[spin_10s_linear_infinite]"></div>

            {/* Central Analysis Hub */}
            <div className="relative flex items-center justify-center">
                <i className="fas fa-file-code text-5xl text-slate-700/80"></i>
                
                {/* Searching Magnifier with orbit (Clockwise) */}
                <div className="absolute w-28 h-28 animate-[spin_3s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2">
                        <i className="fas fa-search text-[77px]  text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse"></i>
                    </div>
                </div>

                {/* Bug Icon with orbit (Counter-Clockwise) */}
                <div className="absolute w-36 h-36 animate-[spin_5s_linear_infinite_reverse]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2">
                        <i className="fas fa-bug text-xl text-red-400 opacity-80 rotate-[180deg]"></i> 
                    </div>
                </div>
                
            </div>
         </div>

         <div className="text-center space-y-4 max-w-sm">
            <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Auditing Flow</h3>
            <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Bug Bleach mapping in progress</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Tracing untrusted entry points...</span>
            </div>
            <p className="text-slate-500 text-[11px] font-medium leading-relaxed px-8">
                The powers of AI are performing a virtual machine sacrifice ritual to help you identify function call stacks and potentially juicy bugs and data sinks.
            </p>
         </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'security' | 'code'>('graph');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const totalChars = useMemo(() => {
    return files.reduce((acc, file) => acc + file.content.length, 0);
  }, [files]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const filePromises = Array.from(uploadedFiles).map((file: File) => {
      return new Promise<FileData>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            content: e.target?.result as string,
            type: file.name.split('.').pop() || 'txt',
          });
        };
        reader.readAsText(file);
      });
    });

    Promise.all(filePromises).then((results) => {
      setFiles(prev => [...prev, ...results]);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearCanvas = () => {
    setGraphData(null);
    setFiles([]);
    setError(null);
    setActiveTab('graph');
    setSelectedFileIndex(0);
  };
  const maxChars = 50000;
  
  const startAnalysis = async () => {
    if (files.length === 0) {
      setError("Please upload source files to begin.");
      return;
    }

    if (totalChars > maxChars) {
      setError("Total character limit exceeded. Please reduce the amount of code.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeCodeFlow(files);
      setGraphData(result);
      setActiveTab('graph');
    } catch (err: any) {
      setError(err.message || "Security analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isAuditDisabled = isAnalyzing || files.length === 0 || totalChars > maxChars;

  // Helper to render code with security highlights
  const renderHighlightedCode = (file: FileData) => {
    if (!graphData) return <pre className="whitespace-pre-wrap font-mono text-sm">{file.content}</pre>;

    const riskyNodes = graphData.nodes.filter(n => 
      n.file === file.name && 
      (graphData.sinks.includes(n.id) || 
       graphData.security_findings.some(f => f.nodes?.includes(n.id)))
    );

    if (riskyNodes.length === 0) return <pre className="whitespace-pre-wrap font-mono text-sm">{file.content}</pre>;

    const snippets = Array.from(new Set(riskyNodes.map(n => n.snippet).filter(Boolean))) as string[];
    snippets.sort((a, b) => b.length - a.length);

    let parts: (string | React.ReactElement)[] = [file.content];

    snippets.forEach(snippet => {
      const newParts: (string | React.ReactElement)[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        const subParts = part.split(snippet);
        subParts.forEach((subPart, i) => {
          newParts.push(subPart);
          if (i < subParts.length - 1) {
            const node = riskyNodes.find(n => n.snippet === snippet);
            newParts.push(
              <span 
                key={`${snippet}-${i}`} 
                className="bg-red-500/20 border-b-2 border-red-500/50 text-red-200 px-0.5 rounded-sm cursor-help group relative inline-block"
                title={node?.description || 'Potential security risk'}
              >
                {snippet}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 font-sans hidden group-hover:block z-50 shadow-2xl pointer-events-none">
                  <i className="fas fa-skull-crossbones text-red-500 mr-2"></i>
                  {node?.description || 'Identified as a critical security node.'}
                </span>
              </span>
            );
          }
        });
      });
      parts = newParts;
    });

    return <pre className="whitespace-pre-wrap leading-relaxed font-mono text-sm">{parts}</pre>;
  };

  return (
    <div className="flex h-screen bg-[#05070a] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-blue-900/20 flex flex-col bg-[#0a0c14]/80 backdrop-blur-xl z-30 flex-shrink-0">
        <div className="p-10 border-b border-blue-900/20 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center  mb-6 overflow-hidden -mt-2">
            {/* <i className="fas fa-user-secret text-blue-500 text-2xl"></i> */}
            <i className=""> <img src="/src/images/icon.ico" alt="" style={{ width: "60px", height: "60px" }} /></i>
          </div>
          <div className="text-center -mt-6">
<h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">  Bug Witcher</h1>
<h1 className="text-[16px] font-black text-white tracking-tighter uppercase italic text-blue-400 -mt-2">  Static Code Analysis</h1>
            {/* <h1 className="text-[10px] text-blue-400 uppercase tracking-[0.4em] font-black mt-1">Static Code Analysis</h1> */}

          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar min-h-0">
          {/* Files Section */}
          <section>
            <h2 className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Source Assets</h2>
            <div className="relative group mb-4">
              <input type="file" multiple accept=".js,.html,.tsx,.ts,.php" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="p-6 border-2 border-dashed border-blue-900/30 rounded-2xl group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center text-center">
                <i className="text-[25px] fas fa-cloud-upload-alt text-slate-600 mb-2 group-hover:text-red-600"></i>
                <span className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">Feed me...</span>
              </div>
            </div>
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl group hover:border-slate-600/50 transition-all">
                  <span className="text-sm truncate font-semibold text-slate-300">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 font-mono">{f.content.length} ch</span>
                    <button onClick={() => removeFile(i)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Summary Sidebar */}
          {graphData && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Analysis Summary</h2>
              <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-2xl">
                <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                  "{graphData.summary}"
                </p>
              </div>
            </section>
          )}

          {error && (
            <div className="p-4 bg-red-900/10 border border-red-800/30 text-red-400 text-xs rounded-2xl flex gap-3">
              <i className="fas fa-exclamation-triangle mt-0.5"></i>
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-900/80 border-t border-slate-800/50 flex-shrink-0 space-y-4">
          {/* File Count Warning */}
          {files.length > 5 && (
            <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <i className="fas fa-info-circle text-amber-500 mt-0.5 shrink-0"></i>
              <p className="text-[10px] text-amber-200/70 font-medium leading-relaxed">
                You uploaded more than 5 files. In the event some of the functions do not show up in the analysis, try analysing a smaller section of the code.
              </p>
            </div>
          )}

          {/* Character Count Warning */}
          {totalChars > maxChars && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <i className="fas fa-exclamation-circle text-red-500 mt-0.5 shrink-0"></i>
              <p className="text-[10px] text-red-200/80 font-bold leading-relaxed">
                Character density exceeded. Max allowed: {maxChars.toLocaleString()}
              </p>
            </div>
          )}
          
          <button
            onClick={startAnalysis}
            disabled={isAuditDisabled}
            className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
              isAuditDisabled ? 'bg-slate-800 text-slate-600' : 'bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20'
            }`}
          >
            {isAnalyzing ? <i className="fas fa-cog fa-spin"></i> : <i className="fas fa-skull-crossbones"></i>}
            {isAnalyzing ? 'Mapping Sinks...' : 'Perform Audit'}
          </button>
          
          <div className="flex justify-between items-center px-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Density Buffer</span>
            <span className={`text-[10px] font-mono font-bold ${totalChars > maxChars ? 'text-red-500' : 'text-slate-400'}`}>
              {totalChars.toLocaleString()} / {maxChars.toLocaleString()}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0 bg-[#05070a]">
        {graphData && (
          <>
            {/* Tab Switcher */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-blue-900/30 z-40 shadow-2xl">
              {[
                { id: 'graph', icon: 'fa-project-diagram', label: 'Flow Map' },
                { id: 'security', icon: 'fa-user-secret', label: 'Security Report' },
                { id: 'code', icon: 'fa-code', label: 'Source View' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                    activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  <i className={`fas ${tab.icon}`}></i> {tab.label}
                </button>
              ))}
            </div>

            {/* Clear Canvas Button - Top Left */}
            <button
              onClick={clearCanvas}
              title="Clear Analysis"
              className="absolute top-6 left-6 z-40 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 text-slate-500 hover:text-red-500 hover:border-red-500/50 transition-all shadow-2xl group flex items-center justify-center"
            >
              <i className="fas fa-eraser group-hover:scale-110 transition-transform"></i>
            </button>
          </>
        )}

        {graphData ? (
          <div className="flex-1 relative min-h-0">
            {activeTab === 'graph' && <GraphVisualizer data={graphData} />}
            
            {activeTab === 'security' && (
              <div className="absolute inset-0 pt-20 overflow-y-auto custom-scrollbar bg-slate-950">
                <div className="max-w-6xl mx-auto p-8 space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Security Findings', value: graphData.security_findings.length, color: 'text-red-500' },
                      { label: 'Input Sources', value: graphData.input_sources.length, color: 'text-yellow-500' },
                      { label: 'Impact Sinks', value: graphData.sinks.length, color: 'text-orange-500' },
                      { label: 'Trust Transitions', value: graphData.trust_boundaries.length, color: 'text-blue-500' }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] text-center">
                        <div className={`text-4xl font-black mb-2 ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Analysis Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                    {/* Security Findings List */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Vulnerabilities & Weaknesses</h3>
                      {graphData.security_findings.map((finding: any, idx) => (
                        <div key={idx} className="bg-slate-900/50 border-l-4 border-l-red-500 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/40 transition-all">
                          <h4 className="text-lg text-white font-bold mb-2 flex items-center gap-3">
                            <i className="fas fa-exclamation-circle text-red-500"></i>
                            {typeof finding === 'string' ? 'Observation' : (finding.title || 'Finding')}
                          </h4>
                          <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            {typeof finding === 'string' ? finding : finding.description}
                          </p>
                          {finding.nodes && finding.nodes.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {finding.nodes.map((n: string) => (
                                <span key={n} className="text-[10px] font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-md uppercase tracking-wider">{n}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Quick Access Panels */}
                    <div className="space-y-6">
                      <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-6">Dangerous Sinks</h4>
                        <div className="flex flex-wrap gap-2">
                          {graphData.sinks.map(sink => (
                            <span key={sink} className="text-[11px] font-mono font-bold bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20">{sink}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
                        <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-6">Entry Points</h4>
                        <ul className="space-y-3">
                          {graphData.input_sources.map(src => (
                            <li key={src} className="text-xs text-slate-300 font-semibold flex items-center gap-3">
                              <i className="fas fa-chevron-right text-[8px] text-yellow-500"></i> {src}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="absolute inset-0 pt-20 p-8 flex gap-6 overflow-hidden bg-slate-950">
                <div className="w-64 flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-shrink-0">
                  {files.map((f, i) => (
                    <button key={i} onClick={() => setSelectedFileIndex(i)} className={`p-4 text-left rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${selectedFileIndex === i ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                      {f.name}
                    </button>
                  ))}
                </div>
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 overflow-auto font-mono text-sm text-slate-400 leading-relaxed shadow-inner custom-scrollbar select-text">
                   {renderHighlightedCode(files[selectedFileIndex])}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full"></div>
            <div className="relative mb-12">
              <div className="w-32 h-32 rounded-[3rem] flex items-center justify-center shadow-2xl">
                {/* <i className="fas fa-user-secret text-6xl text-blue-500"></i> */}
                <i> <img src="/src/images/icon.ico" alt="" /></i>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-slate-950">
                <i className="fas fa-solid fa-bug text-white"></i>
              </div>
            </div>
            <h2 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase italic">Bug Witcher <br/><span className="text-blue-500">Static Code Analysis.</span></h2>
            <p className="text-slate-400 max-w-xl mb-12 text-lg font-medium leading-relaxed">Analyze JavaScript and HTML logic flows to uncover XSS entry points, dangerous sinks, and unauthorized data flow.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl w-full">
              {[
                { icon: 'fa-skull-crossbones', title: 'Sink Analysis', desc: 'Identify DOM injection points like innerHTML and script eval.' },
                { icon: 'fa-shield-halved', title: 'Untrusted Flow', desc: 'Track how user-controlled data traverses through application logic.' },
                { icon: 'fa-solid fa-bug', title: 'Audit Trail', desc: 'Detailed categorization of privileged functions and API usage.' }
              ].map((item, idx) => (
                <div key={idx} className="p-2 rounded-[2.5rem] bg-slate-900/20 border border-slate-800">
                  <div className="w-15 h-5 rounded-2xl flex items-center justify-center mb-2">
                    <i className={`fas ${item.icon} text-blue-500`}></i>
                  </div>
                  <h3 className="text-white font-black mb-3 uppercase text-[12px] tracking-[0.2em]">{item.title}</h3>
                  <p className="text-xm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
            {/* Footer */}
                        <div>
    <footer className="fixed bottom-0 left-0 w-full bg-black-300 p-2">
      <h3 className="text-xs text-slate-500 text-right pr-4">
        Created by ~ <span className=" fas fa-solid fa-user-ninja"> ~ </span> <a href="https://cybersamurai.co.uk">CyberSamurai - 2026 ~ version 1.0</a>
      </h3>
</footer>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {isAnalyzing && <LoadingScreen />}
    </div>
  );
};

export default App;
