import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function MapOptionsMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute top-[60px] right-4 z-[1000]">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="rounded-lg border bg-white shadow-lg">
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex w-full items-center justify-between gap-2 px-4 py-3"
                        >
                            <span className="font-medium">Optionen</span>
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="border-t px-4 py-3">
                        <p className="text-sm text-muted-foreground">TBD</p>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        </div>
    );
}
