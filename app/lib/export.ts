import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Export project files as a downloadable ZIP file
 */
export async function exportProjectAsZip(
    projectName: string,
    files: Record<string, string>
): Promise<boolean> {
    try {
        const zip = new JSZip();

        // Add each file to the ZIP
        for (const [path, content] of Object.entries(files)) {
            // Remove leading slash if present
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            zip.file(cleanPath, content);
        }

        // Generate the ZIP file
        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        // Create safe filename
        const safeFileName = projectName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'project';

        // Trigger download
        saveAs(blob, `${safeFileName}.zip`);

        return true;
    } catch (error) {
        console.error('Error exporting project:', error);
        return false;
    }
}

/**
 * Export a single file as download
 */
export function exportSingleFile(filename: string, content: string): boolean {
    try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, filename);
        return true;
    } catch (error) {
        console.error('Error exporting file:', error);
        return false;
    }
}
