import { useEffect, useState, useRef } from 'react';

interface Node {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    [key: string]: any; // Allow extra properties
}

interface Link {
    source: string;
    target: string;
}

export function useGraphSimulation(initialNodes: any[], initialLinks: any[], width: number, height: number) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        // Initialize nodes with random positions
        const initializedNodes = initialNodes.map(n => ({
            ...n,
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0
        }));
        setNodes(initializedNodes);
    }, [initialNodes, width, height]);

    const simulate = () => {
        setNodes(prevNodes => {
            const newNodes = prevNodes.map(n => ({ ...n }));
            const k = 0.1; // Spring constant
            const repulsion = 5000; // Repulsion force
            const damping = 0.9; // Velocity damping

            // 1. Repulsion (Coulomb's Law)
            for (let i = 0; i < newNodes.length; i++) {
                for (let j = i + 1; j < newNodes.length; j++) {
                    const dx = newNodes[i].x - newNodes[j].x;
                    const dy = newNodes[i].y - newNodes[j].y;
                    const distSq = dx * dx + dy * dy || 1;
                    const force = repulsion / distSq;
                    const fx = (dx / Math.sqrt(distSq)) * force;
                    const fy = (dy / Math.sqrt(distSq)) * force;

                    newNodes[i].vx += fx;
                    newNodes[i].vy += fy;
                    newNodes[j].vx -= fx;
                    newNodes[j].vy -= fy;
                }
            }

            // 2. Attraction (Springs)
            initialLinks.forEach(link => {
                const source = newNodes.find(n => n.id === link.source);
                const target = newNodes.find(n => n.id === link.target);
                if (source && target) {
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const force = (dist - 100) * k; // 100 is ideal length
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;

                    source.vx += fx;
                    source.vy += fy;
                    target.vx -= fx;
                    target.vy -= fy;
                }
            });

            // 3. Center Gravity
            newNodes.forEach(node => {
                const dx = width / 2 - node.x;
                const dy = height / 2 - node.y;
                node.vx += dx * 0.005;
                node.vy += dy * 0.005;
            });

            // 4. Update Positions
            newNodes.forEach(node => {
                node.vx *= damping;
                node.vy *= damping;
                node.x += node.vx;
                node.y += node.vy;

                // Bounds
                node.x = Math.max(10, Math.min(width - 10, node.x));
                node.y = Math.max(10, Math.min(height - 10, node.y));
            });

            return newNodes;
        });

        requestRef.current = requestAnimationFrame(simulate);
    };

    useEffect(() => {
        if (nodes.length > 0) {
            requestRef.current = requestAnimationFrame(simulate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [nodes.length]); // Restart if node count changes (initial load)

    return nodes;
}
