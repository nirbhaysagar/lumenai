'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2, RefreshCw } from 'lucide-react';
import { useGraphSimulation } from '@/hooks/useGraphSimulation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function KnowledgeGraphWidget({ contextId }: { contextId?: string }) {
    const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Hardcoded userId for MVP
            const userId = DEMO_USER_ID;
            const url = contextId
                ? `/api/contexts/${contextId}/graph?userId=${userId}`
                : `/api/contexts/all/graph?userId=${userId}`;

            const res = await fetch(url);
            const json = await res.json();
            if (json.nodes) {
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch graph', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [contextId]);

    const nodes = useGraphSimulation(data.nodes, data.links, dimensions.width, dimensions.height);

    const [selectedNode, setSelectedNode] = useState<any>(null);

    return (
        <Card className="h-full flex flex-col overflow-hidden bg-black/40 backdrop-blur-xl border-white/10 relative">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    Neural Knowledge Graph
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchData}>
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative min-h-[300px]" ref={containerRef}>
                {loading && data.nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}

                {!loading && data.nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                        No concepts extracted yet.
                    </div>
                )}

                <svg className="w-full h-full pointer-events-none">
                    {data.links.map((link, i) => {
                        const source = nodes.find(n => n.id === link.source);
                        const target = nodes.find(n => n.id === link.target);
                        if (!source || !target) return null;
                        return (
                            <line
                                key={i}
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="1"
                            />
                        );
                    })}
                </svg>

                {nodes.map((node) => (
                    <motion.div
                        key={node.id}
                        className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-pointer group ${selectedNode?.id === node.id ? 'bg-white scale-150 z-20' : 'bg-white/80'}`}
                        style={{ left: node.x, top: node.y }}
                        whileHover={{ scale: 1.5, zIndex: 10 }}
                        onClick={() => setSelectedNode(node)}
                    >
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none border border-white/10">
                            <div className="font-bold">{node.label}</div>
                            <div className="text-muted-foreground">{node.description}</div>
                        </div>
                    </motion.div>
                ))}

                {/* Node Details Overlay */}
                {selectedNode && (
                    <div className="absolute right-4 top-4 w-64 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl z-30 animate-in slide-in-from-right-10">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-sm">{selectedNode.label}</h3>
                            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setSelectedNode(null)}>
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </Button>
                        </div>
                        <Badge variant="secondary" className="mb-2 text-[10px]">{selectedNode.group}</Badge>
                        <p className="text-xs text-muted-foreground mb-4">{selectedNode.description}</p>

                        <div className="space-y-2">
                            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Related Concepts</h4>
                            <div className="flex flex-wrap gap-1">
                                {data.links
                                    .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                                    .map((l, i) => {
                                        const otherId = l.source === selectedNode.id ? l.target : l.source;
                                        const otherNode = nodes.find(n => n.id === otherId);
                                        return otherNode ? (
                                            <Badge key={i} variant="outline" className="text-[10px] cursor-pointer hover:bg-white/10" onClick={() => setSelectedNode(otherNode)}>
                                                {otherNode.label}
                                            </Badge>
                                        ) : null;
                                    })
                                }
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
