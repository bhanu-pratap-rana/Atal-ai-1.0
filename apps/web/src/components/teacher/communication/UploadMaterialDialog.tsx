"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMaterial, uploadMaterialFile } from "@/app/actions/teacher";
import { clientLogger } from "@/lib/client-logger";
import type { MaterialType } from "@/lib/validation-schemas";
import { getModules, type Module } from "@/lib/services/curriculum-service";
import { getModuleName } from "@/lib/i18n";

interface UploadMaterialDialogProps {
  readonly classId: string;
  readonly className?: string;
}

const materialTypeOptions = [
  { value: "document", label: "📄 Document" },
  { value: "video", label: "🎬 Video" },
  { value: "link", label: "🔗 Link" },
  { value: "image", label: "🖼️ Image" },
  { value: "other", label: "📎 Other" },
];

const MAX_FILE_SIZE_MB = 50;

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function UploadMaterialDialog({
  classId,
  className,
}: UploadMaterialDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState<MaterialType>("document");
  const [externalUrl, setExternalUrl] = useState("");
  const [moduleId, setModuleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [sourceMode, setSourceMode] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch modules from database
  useEffect(() => {
    async function fetchModules() {
      try {
        const modulesData = await getModules();
        setModules(modulesData);
      } catch (error) {
        clientLogger.error(
          "[UploadMaterialDialog] Failed to fetch modules",
          error instanceof Error ? error : { error: String(error) },
        );
      } finally {
        setModulesLoading(false);
      }
    }
    fetchModules();
  }, []);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setMaterialType("document");
    setExternalUrl("");
    setModuleId("");
    setSelectedFile(null);
    setSourceMode("file");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }
    setSelectedFile(file);

    // Auto-detect material type from file
    if (file) {
      if (file.type.startsWith("image/")) {
        setMaterialType("image");
      } else if (file.type.startsWith("video/")) {
        setMaterialType("video");
      } else {
        setMaterialType("document");
      }
      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  }, [title]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (sourceMode === "url" && !externalUrl) {
        toast.error("Please provide a URL for the material");
        return;
      }
      if (sourceMode === "file" && !selectedFile) {
        toast.error("Please select a file to upload");
        return;
      }

      setLoading(true);

      try {
        let result;

        if (sourceMode === "file" && selectedFile) {
          // File upload via FormData
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("classId", classId);
          formData.append("title", title);
          if (description) formData.append("description", description);
          formData.append("materialType", materialType);
          if (moduleId) formData.append("moduleId", moduleId);

          result = await uploadMaterialFile(formData);
        } else {
          // URL-based material
          result = await uploadMaterial({
            classId,
            title,
            description: description || undefined,
            materialType,
            externalUrl,
            moduleId: moduleId || undefined,
          });
        }

        if (result?.success) {
          toast.success("Material added successfully!");
          resetForm();
          setOpen(false);
          router.refresh();
        } else if (result && "error" in result) {
          toast.error(
            (result as { error: string }).error || "Failed to add material",
          );
        } else {
          toast.error("Failed to add material");
        }
      } catch (error) {
        clientLogger.error(
          "[UploadMaterialDialog] Failed to upload material",
          error instanceof Error ? error : { error: String(error) },
        );
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    [classId, title, description, materialType, externalUrl, moduleId, sourceMode, selectedFile, resetForm, router],
  );

  const isSubmitDisabled = loading || !title || (sourceMode === "url" ? !externalUrl : !selectedFile);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <span className="mr-2">📁</span>
          <span>Add Material</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Learning Material</DialogTitle>
            <DialogDescription>
              Upload a file or share a link with your students.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-title">Title</Label>
              <Input
                id="material-title"
                placeholder="e.g., How to use UPI - Video Tutorial"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-description">Description (optional)</Label>
              <textarea
                id="material-description"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Brief description of this material..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                maxLength={1000}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-type">Type</Label>
                <select
                  id="material-type"
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {materialTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="module">Module</Label>
                <select
                  id="module"
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  disabled={loading || modulesLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {modulesLoading ? "Loading modules..." : "-- Select module (optional) --"}
                  </option>
                  {modules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.icon} {getModuleName(mod, "en")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Source Mode Toggle */}
            <div className="space-y-2">
              <Label>Source</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSourceMode("file")}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                    sourceMode === "file"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input hover:bg-surface-dark"
                  }`}
                >
                  📎 Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode("url")}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                    sourceMode === "url"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input hover:bg-surface-dark"
                  }`}
                >
                  🔗 Paste URL
                </button>
              </div>
            </div>

            {sourceMode === "file" ? (
              <div className="space-y-2">
                <Label htmlFor="material-file">File</Label>
                <Input
                  id="material-file"
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  disabled={loading}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                />
                {selectedFile && (
                  <p className="text-xs text-text-secondary">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
                <p className="text-xs text-text-tertiary">
                  Max {MAX_FILE_SIZE_MB}MB. Images, videos, documents supported.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="material-url">URL</Label>
                <Input
                  id="material-url"
                  type="url"
                  placeholder="https://..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  required={sourceMode === "url"}
                  disabled={loading}
                />
                <p className="text-xs text-text-tertiary">
                  Paste a link to a video, document, or any learning resource
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {loading ? "Uploading..." : "Add Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
