import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Link as LinkIcon, Trash2, Clock, CheckCircle, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CaptureCardProps {
    capture: any;
    onDelete: (id: string) => void;
    selectable?: boolean;
    selected?: boolean;
    onSelect?: (checked: boolean) => void;
}

export function CaptureCard({ capture, onDelete, selectable, selected, onSelect }: CaptureCardProps) {
    const typeIcon: Record<string, React.ReactNode> = {
        pdf: <FileText className="w-4 h-4" />,
        url: <LinkIcon className="w-4 h-4" />,
        text: <FileText className="w-4 h-4" />,
    };

    const statusIcon: Record<string, React.ReactNode> = {
        pending: <Loader2 className="w-3 h-3 text-muted-foreground" />,
        processing: <Loader2 className="w-3 h-3 animate-spin text-blue-500" />,
        completed: <CheckCircle2 className="w-3 h-3 text-green-500" />,
        failed: <AlertCircle className="w-3 h-3 text-red-500" />,
    };

    const currentTypeIcon = typeIcon[capture.type as string] || <FileText className="w-4 h-4" />;
    const currentStatusIcon = statusIcon[capture.status as string || 'completed'] || <CheckCircle className="w-3 h-3 text-green-500" />;

    return (
        <Card className={`relative group transition-all ${selected ? 'ring-2 ring-primary bg-muted/20' : 'hover:bg-muted/50'}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-start gap-3 overflow-hidden">
                    {selectable && (
                        <Checkbox
                            checked={selected}
                            onCheckedChange={onSelect}
                            className="mt-1"
                        />
                    )}
                    <div className="p-2 bg-muted rounded-md shrink-0">
                        {currentTypeIcon}
                    </div>
                    <div className="space-y-1 min-w-0">
                        <CardTitle className="text-sm font-medium leading-none truncate pr-4" title={capture.title}>
                            {capture.title || 'Untitled Capture'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground truncate">
                            {capture.url || 'No source URL'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                    onClick={() => onDelete(capture.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] h-5 capitalize">
                            {capture.type}
                        </Badge>
                        <div className="flex items-center gap-1" title={`Status: ${capture.status || 'completed'}`}>
                            {currentStatusIcon}
                            <span className="capitalize">{capture.status || 'Done'}</span>
                        </div>
                    </div>
                    <span>
                        {formatDistanceToNow(new Date(capture.created_at), { addSuffix: true })}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
