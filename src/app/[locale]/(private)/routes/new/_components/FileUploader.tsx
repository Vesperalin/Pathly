"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export interface FileUploaderTexts {
  description: string;
  hint: string;
  buttonIdle: string;
  buttonParsing: string;
  error: {
    multiple: string;
  };
}

export interface FileUploaderProps {
  isParsing: boolean;
  onFilesSelected: (files: File[]) => void;
  texts: FileUploaderTexts;
}

export function FileUploader({ isParsing, onFilesSelected, texts }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelection = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return;
      }

      if (fileList.length > 1) {
        toast.error(texts.error.multiple);
        return;
      }

      const [file] = Array.from(fileList);
      onFilesSelected([file]);
    },
    [onFilesSelected, texts.error.multiple]
  );

  const openFileDialog = useCallback(() => {
    if (isParsing) {
      return;
    }

    inputRef.current?.click();
  }, [isParsing]);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (isParsing) {
        event.dataTransfer.dropEffect = "none";
        return;
      }

      event.dataTransfer.dropEffect = "copy";
      setIsDragging(true);
    },
    [isParsing]
  );

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (isParsing) {
        return;
      }

      handleFileSelection(event.dataTransfer.files);
    },
    [handleFileSelection, isParsing]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelection(event.target.files);
      event.target.value = "";
    },
    [handleFileSelection]
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-muted-foreground/50 p-8 text-center",
        isParsing && "pointer-events-none opacity-70",
        isDragging && "border-primary bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="group"
      aria-disabled={isParsing}
      data-testid="gpx-uploader"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
        data-testid="gpx-upload-input"
      />
      <div className="space-y-2">
        <p className="text-sm font-medium">{texts.description}</p>
        <p className="text-xs text-muted-foreground">{texts.hint}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={openFileDialog}
        disabled={isParsing}
        aria-busy={isParsing}
        className="gap-2"
        data-testid="gpx-upload-button"
      >
        {isParsing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{texts.buttonParsing}</span>
          </>
        ) : (
          <span>{texts.buttonIdle}</span>
        )}
      </Button>
    </div>
  );
}
