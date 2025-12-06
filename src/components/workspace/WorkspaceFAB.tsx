'use client';

import { Button } from '@/components/ui/button';
import { Plus, FileText, Link as LinkIcon, Upload, Image as ImageIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function WorkspaceFAB() {
    const handleAction = (action: string) => {
        toast.info(`Action triggered: ${action}`);
        // In real implementation, this would open the specific capture modal
    };

    return (
        <div className="absolute bottom-6 right-6 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-primary text-primary-foreground">
                        <Plus className="w-6 h-6" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 mb-2">
                    <DropdownMenuItem onClick={() => handleAction('upload')}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('note')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Quick Note
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('url')}>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Save URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('image')}>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Upload Image
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
