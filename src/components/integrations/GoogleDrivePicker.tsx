'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, File, HardDrive, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    iconLink: string;
    webViewLink: string;
}

export function GoogleDrivePicker({ children }: { children?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [ingesting, setIngesting] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/connectors/google/list');
            const data = await res.json();

            if (res.status === 401 || data.error === 'Google Drive not connected') {
                setConnected(false);
            } else if (data.files) {
                setFiles(data.files);
                setConnected(true);
            } else {
                toast.error('Failed to load files');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchFiles();
        }
    }, [isOpen]);

    const handleConnect = () => {
        window.location.href = '/api/connectors/google/auth';
    };

    const handleIngest = async (file: DriveFile) => {
        setIngesting(file.id);
        try {
            const res = await fetch('/api/connectors/google/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId: file.id })
            });

            if (res.ok) {
                toast.success(`Ingesting ${file.name}...`);
                setIsOpen(false);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Ingest failed');
            }
        } catch (error) {
            toast.error('Ingest failed');
        } finally {
            setIngesting(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="gap-2">
                        <HardDrive className="w-4 h-4" />
                        Google Drive
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Google Drive Import</DialogTitle>
                </DialogHeader>

                {!connected && !loading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <HardDrive className="w-16 h-16 text-muted-foreground" />
                        <p className="text-muted-foreground">Connect your Google Drive to import files.</p>
                        <Button onClick={handleConnect}>
                            Connect Google Drive
                        </Button>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {files.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-primary/10 rounded-md">
                                                <File className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="truncate">
                                                <p className="font-medium truncate">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {file.mimeType.includes('folder') ? 'Folder' : 'File'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            disabled={!!ingesting}
                                            onClick={() => handleIngest(file)}
                                        >
                                            {ingesting === file.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Import'
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
