import '@/../../resources/css/markdown-preview.css';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { marked } from 'marked';
import { useMemo, useState } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

interface TripNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialNotes: string | null;
    onSave: (notes: string) => Promise<void>;
    tripName: string;
}

export default function TripNotesModal({
    isOpen,
    onClose,
    initialNotes,
    onSave,
    tripName,
}: TripNotesModalProps) {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isSaving, setIsSaving] = useState(false);

    // Configure marked once globally
    if (
        typeof window !== 'undefined' &&
        !(window as unknown as Record<string, unknown>).__markedConfigured
    ) {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
        (window as unknown as Record<string, unknown>).__markedConfigured =
            true;
    }

    // Define mdeOptions for SimpleMDE editor
    const mdeOptions = useMemo(() => {
        type ToolbarButton =
            | 'bold'
            | 'italic'
            | 'heading'
            | '|'
            | 'quote'
            | 'unordered-list'
            | 'ordered-list'
            | 'link'
            | 'image'
            | 'preview'
            | 'guide';

        return {
            spellChecker: false,
            placeholder: 'Add notes about this trip (Markdown supported)...',
            status: false,
            previewRender: (text: string) => {
                return marked.parse(text) as string;
            },
            toolbar: [
                'bold',
                'italic',
                'heading',
                '|',
                'quote',
                'unordered-list',
                'ordered-list',
                '|',
                'link',
                'image',
                '|',
                'preview',
                '|',
                'guide',
            ] as ToolbarButton[],
        };
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(notes);
            onClose();
        } catch (error) {
            console.error('Failed to save trip notes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setNotes(initialNotes || '');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Trip notes - {tripName}</DialogTitle>
                    <DialogDescription>
                        Add notes about your trip. Markdown is supported for
                        formatting.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4">
                    <SimpleMDE
                        value={notes}
                        onChange={setNotes}
                        options={mdeOptions}
                    />
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                        data-testid="trip-notes-cancel-button"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        data-testid="trip-notes-save-button"
                    >
                        {isSaving ? 'Saving...' : 'Save notes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
