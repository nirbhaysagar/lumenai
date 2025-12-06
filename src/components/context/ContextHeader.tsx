'use client';

import { ArrowLeft, Share2, Settings, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface ContextHeaderProps {
    title: string;
    description?: string;
    onRename?: (newTitle: string) => void;
}

export function ContextHeader({ title, description, onRename }: ContextHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);

    const handleBlur = () => {
        setIsEditing(false);
        if (tempTitle !== title && onRename) {
            onRename(tempTitle);
        }
    };

    return (
        <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-50">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                        <span className="text-xs font-bold text-primary">Ctx</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <Input
                                    value={tempTitle}
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                                    autoFocus
                                    className="h-6 py-0 px-1 text-sm font-semibold w-[200px]"
                                />
                            ) : (
                                <h1
                                    className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => setIsEditing(true)}
                                >
                                    {title}
                                </h1>
                            )}
                            <Badge variant="outline" className="font-mono text-[10px] h-4 px-1 text-muted-foreground">
                                Active
                            </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[300px]">
                            {description || 'Add a description...'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground">
                    <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground">
                    <Settings className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-border/50 mx-1" />
                <Button variant="ghost" size="sm" className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </div>
        </header>
    );
}
