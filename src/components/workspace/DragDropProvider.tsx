'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface DragDropProviderProps {
    children: React.ReactNode;
    onUpload?: (files: File[]) => Promise<void>;
}

export function DragDropProvider({ children, onUpload }: DragDropProviderProps) {
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setIsUploading(true);
        const toastId = toast.loading(`Uploading ${acceptedFiles.length} file(s)...`);

        try {
            if (onUpload) {
                await onUpload(acceptedFiles);
            } else {
                // Default upload handler if none provided
                const formData = new FormData();
                acceptedFiles.forEach(file => {
                    formData.append('file', file);
                });
                // TODO: Add userId context
                formData.append('userId', DEMO_USER_ID);

                const res = await fetch('/api/ingest', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) throw new Error('Upload failed');
            }
            toast.success('Files uploaded successfully', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload files', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt', '.md'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
        }
    });

    return (
        <div {...getRootProps()} className="h-full w-full relative">
            <input {...getInputProps()} />
            {children}

            {isDragActive && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-primary m-4 rounded-xl animate-in fade-in duration-200">
                    <div className="text-center space-y-4">
                        <div className="p-4 bg-primary/10 rounded-full inline-block">
                            <Upload className="w-12 h-12 text-primary animate-bounce" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">Drop files to ingest</h3>
                            <p className="text-muted-foreground">PDFs, Images, and Text files supported</p>
                        </div>
                    </div>
                </div>
            )}

            {isUploading && (
                <div className="absolute bottom-8 right-8 z-50 bg-background border border-border shadow-lg rounded-lg p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <div className="text-sm">
                        <p className="font-medium">Ingesting content...</p>
                        <p className="text-xs text-muted-foreground">Processing your files</p>
                    </div>
                </div>
            )}
        </div>
    );
}
