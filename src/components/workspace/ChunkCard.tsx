import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Link as LinkIcon, MessageSquare, Plus, Star, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChunkCardProps {
    chunk: any;
    onUseInChat: (text: string) => void;
    onAddToRecall?: () => void;
}

export function ChunkCard({ chunk, onUseInChat, onAddToRecall }: ChunkCardProps) {
    const layerColor: Record<string, string> = {
        raw: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        canonical: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        abstract: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    const colorClass = layerColor[chunk.layer || 'raw'] || 'bg-slate-100';

    const typeIcons: Record<string, React.ReactNode> = {
        pdf: <FileText className="w-3 h-3" />,
        url: <LinkIcon className="w-3 h-3" />,
        text: <MessageSquare className="w-3 h-3" />,
    };
    const icon = typeIcons[chunk.metadata?.type || 'text'] || <FileText className="w-3 h-3" />;

    return (
        <Card className="hover:bg-muted/50 transition-colors group">
            <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="secondary" className={`text-[10px] px-1 py-0 h-5 gap-1 ${colorClass}`}>
                            {icon}
                            <span className="capitalize">{chunk.layer || 'Raw'}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(chunk.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    {chunk.similarity && (
                        <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600 dark:text-green-400">
                            {Math.round(chunk.similarity * 100)}% Match
                        </Badge>
                    )}
                </div>

                <p className="text-sm line-clamp-3 text-muted-foreground">
                    {chunk.content}
                </p>

                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Preview">
                        <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Add to Recall"
                        onClick={onAddToRecall}
                    >
                        <Star className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                        title="Use in Chat"
                        onClick={() => onUseInChat(chunk.content)}
                    >
                        <Plus className="w-3 h-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
