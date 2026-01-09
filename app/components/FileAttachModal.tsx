import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, File as FileIcon } from "lucide-react";

export interface AttachedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    dataUrl: string;
}

interface FileAttachModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAttach: (files: AttachedFile[]) => void;
}

export function FileAttachModal({ isOpen, onClose, onAttach }: FileAttachModalProps) {
    const [files, setFiles] = useState<AttachedFile[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        Array.from(selectedFiles).forEach((file) => {
            // Only accept images for now
            if (!file.type.startsWith("image/")) {
                alert("Only image files are supported");
                return;
            }

            // Max 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const newFile: AttachedFile = {
                    id: crypto.randomUUID(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    dataUrl: e.target?.result as string,
                };
                setFiles((prev) => [...prev, newFile]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleRemoveFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleSubmit = () => {
        onAttach(files);
        setFiles([]);
        onClose();
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#1e1e2e]">
                    <h2 className="text-lg font-semibold">Attach Files</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Dropzone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver
                                ? "border-indigo-500 bg-indigo-500/10"
                                : "border-[#1e1e2e] hover:border-gray-600"
                            }`}
                    >
                        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                        <p className="text-gray-400">Drop images here or click to browse</p>
                        <p className="text-xs text-gray-600 mt-1">Max 5MB per file</p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                    />

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            {files.map((file) => (
                                <div key={file.id} className="flex items-center gap-3 p-2 bg-[#0a0a0f] rounded-lg">
                                    {/* Preview */}
                                    {file.type.startsWith("image/") ? (
                                        <img
                                            src={file.dataUrl}
                                            alt={file.name}
                                            className="w-10 h-10 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                                            <FileIcon className="w-5 h-5 text-gray-500" />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                                    </div>

                                    {/* Remove */}
                                    <button
                                        onClick={() => handleRemoveFile(file.id)}
                                        className="p-1 hover:bg-white/5 rounded"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-[#1e1e2e]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={files.length === 0}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        Attach {files.length > 0 && `(${files.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
}
