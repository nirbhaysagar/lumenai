
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Link as LinkIcon, Image as ImageIcon, MessageSquare, MoreHorizontal, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChunkCardProps {
    chunk: any;
    onUseInChat: (text: string) => void;
    onViewDetail: (chunk: any) => void;
}

export function ChunkCard({ chunk, onUseInChat, onViewDetail }: ChunkCardProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
            case 'url': return <LinkIcon className="w-4 h-4 text-blue-500" />;
            case 'image': return <ImageIcon className="w-4 h-4 text-purple-500" />;
            default: return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <Card className="hover:border-primary/50 transition-colors group">
            <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-2 overflow-hidden">
                    {getIcon(chunk.type)}
                    <span className="text-xs font-medium truncate text-muted-foreground max-w-[120px]" title={chunk.title}>
                        {chunk.title || 'Untitled'}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(chunk.created_at), { addSuffix: true })}
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-3">
                <p className="text-sm text-foreground/90 line-clamp-3 leading-relaxed">
                    {chunk.preview}
                </p>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1">
                        {chunk.topics?.slice(0, 2).map((topic: string) => (
                            <Badge key={topic} variant="secondary" className="text-[10px] px-1.5 h-5">
                                {topic}
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onUseInChat(chunk.content)}
                            title="Use in Chat"
                        >
                            <MessageSquare className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onViewDetail(chunk)}
                            title="View Detail"
                        >
                            <ArrowRight className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
