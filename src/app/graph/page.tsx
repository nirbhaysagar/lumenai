'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState, useEffect, useRef } from 'react';
import { DashboardHeader } from '@/components/dashboard/v3/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ZoomIn, ZoomOut, RefreshCw, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GraphPage() {
    const [data, setData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const fetchGraph = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/graph?userId=${DEMO_USER_ID}`);
            const json = await res.json();
            if (json.nodes && json.nodes.length > 0) {
                // Simple layout algorithm (random for now, or circular)
                const width = 800;
                const height = 600;
                const nodes = json.nodes.map((n: any) => ({
                    ...n,
                    x: Math.random() * (width - 100) + 50,
                    y: Math.random() * (height - 100) + 50
                }));
                setData({ nodes, edges: json.edges });
            } else {
                // Mock Data
                const mockNodes = [
                    { id: 'c1', label: 'Project Alpha', type: 'context', val: 15 },
                    { id: 'c2', label: 'Q3 Financials', type: 'context', val: 12 },
                    { id: 'm1', label: 'Meeting Notes', type: 'memory', val: 8 },
                    { id: 'm2', label: 'Budget Draft', type: 'memory', val: 8 },
                    { id: 'm3', label: 'Team Sync', type: 'memory', val: 8 },
                    { id: 'k1', label: 'Revenue', type: 'concept', val: 6 },
                    { id: 'k2', label: 'Growth', type: 'concept', val: 6 },
                    { id: 'k3', label: 'Marketing', type: 'concept', val: 6 },
                ];

                const width = 800;
                const height = 600;
                const nodes = mockNodes.map((n: any) => ({
                    ...n,
                    x: Math.random() * (width - 100) + 50,
                    y: Math.random() * (height - 100) + 50
                }));

                const mockEdges = [
                    { source: 'c1', target: 'm1' },
                    { source: 'c1', target: 'm3' },
                    { source: 'c2', target: 'm2' },
                    { source: 'm2', target: 'k1' },
                    { source: 'm2', target: 'k2' },
                    { source: 'c1', target: 'k3' },
                    { source: 'm3', target: 'k3' },
                ];

                setData({ nodes, edges: mockEdges });
                toast.info('Showing mock data (no real graph found)');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load graph');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGraph();
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <DashboardHeader />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl flex flex-col gap-6 h-[calc(100vh-80px)]">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
                        <p className="text-muted-foreground text-sm">Visualize connections between your memories and contexts.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={fetchGraph}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 border border-border/40 rounded-xl bg-muted/10 relative overflow-hidden shadow-inner">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            <svg ref={svgRef} className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                                {/* Edges */}
                                {data.edges.map((edge, i) => {
                                    const source = data.nodes.find(n => n.id === edge.source);
                                    const target = data.nodes.find(n => n.id === edge.target);
                                    if (!source || !target) return null;
                                    return (
                                        <line
                                            key={i}
                                            x1={source.x} y1={source.y}
                                            x2={target.x} y2={target.y}
                                            stroke="currentColor"
                                            strokeOpacity="0.2"
                                            strokeWidth="1"
                                            className="text-foreground"
                                        />
                                    );
                                })}

                                {/* Nodes */}
                                {data.nodes.map((node) => (
                                    <g
                                        key={node.id}
                                        transform={`translate(${node.x},${node.y})`}
                                        className="cursor-pointer transition-opacity hover:opacity-80"
                                        onClick={() => setSelectedNode(node)}
                                    >
                                        <circle
                                            r={node.val || 5}
                                            fill={node.type === 'context' ? '#3b82f6' : '#a855f7'}
                                            className="shadow-sm"
                                        />
                                        <text
                                            y={node.val + 15}
                                            textAnchor="middle"
                                            className="text-[10px] fill-muted-foreground select-none"
                                        >
                                            {node.label}
                                        </text>
                                    </g>
                                ))}
                            </svg>

                            {/* Controls Overlay */}
                            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm">
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm">
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Node Detail Overlay */}
                    {selectedNode && (
                        <div className="absolute top-4 right-4 w-64 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg animate-in slide-in-from-right-10">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="capitalize text-[10px] px-1.5 h-5">
                                    {selectedNode.type}
                                </Badge>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedNode(null)}>
                                    &times;
                                </Button>
                            </div>
                            <h3 className="font-semibold text-sm mb-1">{selectedNode.label}</h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                ID: {selectedNode.id.substring(0, 8)}...
                            </p>
                            <Button size="sm" className="w-full text-xs h-7">
                                View Details
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
