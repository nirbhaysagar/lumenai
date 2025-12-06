import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, MoreVertical, Trash2, Edit2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ContextCardProps {
    context: {
        id: string;
        name: string;
        description?: string;
        chunk_count?: number;
        updated_at?: string;
    };
    onDelete?: (id: string) => void;
    onEdit?: (context: any) => void;
}

export function ContextCard({ context, onDelete, onEdit }: ContextCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-medium line-clamp-1">
                        {context.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                        {context.description || 'No description'}
                    </p>
                </div>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[100]">
                        {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(context)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Rename
                            </DropdownMenuItem>
                        )}
                        {onDelete && (
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(context.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mt-4">
                    <Badge variant="secondary">
                        {context.chunk_count || 0} chunks
                    </Badge>
                    <div className="flex gap-2">
                        <Link href={`/chat/${context.id}`}>
                            <Button variant="outline" size="sm" className="h-8">
                                <MessageSquare className="w-3 h-3 mr-2" />
                                Chat
                            </Button>
                        </Link>
                        <Link href={`/contexts/${context.id}`}>
                            <Button size="sm" className="h-8">
                                Manage
                                <ArrowRight className="w-3 h-3 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
