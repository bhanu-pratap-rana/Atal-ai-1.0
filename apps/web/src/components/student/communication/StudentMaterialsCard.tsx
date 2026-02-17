"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/format-date";
import { incrementMaterialDownload, type Material } from "@/app/actions/teacher";
import { clientLogger } from "@/lib/client-logger";
import { Download, FileText, Video, Image, File, Eye, X } from "lucide-react";

interface StudentMaterialsCardProps {
  readonly materials: Material[];
  readonly className?: string;
  readonly showEmpty?: boolean;
}

const fileTypeConfig: Record<string, { icon: typeof FileText; label: string; className: string }> = {
  document: { icon: FileText, label: "Document", className: "text-info" },
  video: { icon: Video, label: "Video", className: "text-secondary" },
  image: { icon: Image, label: "Image", className: "text-success" },
  link: { icon: FileText, label: "Link", className: "text-accent" },
  other: { icon: File, label: "File", className: "text-text-secondary" },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function isPreviewable(material: Material): boolean {
  const mimeType = material.mime_type || "";
  const materialType = material.material_type;
  return (
    materialType === "image" ||
    materialType === "video" ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/")
  );
}

export function StudentMaterialsCard({
  materials,
  className,
  showEmpty = true,
}: StudentMaterialsCardProps) {
  const [isPending, startTransition] = useTransition();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleDownload = (material: Material) => {
    const url = material.file_url || material.external_url;
    if (!url) {
      clientLogger.error("[StudentMaterialsCard] No URL available for material", { id: material.id });
      return;
    }

    startTransition(async () => {
      try {
        await incrementMaterialDownload(material.id);
        window.open(url, "_blank");
      } catch (error) {
        clientLogger.error(
          "[StudentMaterialsCard] Download error",
          error instanceof Error ? error : { error: String(error) }
        );
        window.open(url, "_blank");
      }
    });
  };

  const togglePreview = (materialId: string) => {
    setPreviewId((prev) => (prev === materialId ? null : materialId));
  };

  if (materials.length === 0 && !showEmpty) {
    return null;
  }

  // Sort by created_at (newest first)
  const sortedMaterials = [...materials].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>📁</span> Learning Materials
        </CardTitle>
      </CardHeader>
      <CardContent>
        {materials.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📂</span>
            </div>
            <p className="text-text-secondary text-sm">
              No learning materials shared yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMaterials.map((material) => {
              const config = fileTypeConfig[material.material_type] || fileTypeConfig.other;
              const IconComponent = config.icon;
              const canPreview = isPreviewable(material);
              const isShowingPreview = previewId === material.id;
              const previewUrl = material.file_url || material.external_url;
              const fileSizeStr = formatFileSize(material.file_size);

              return (
                <div
                  key={material.id}
                  className="rounded-lg border border-border bg-surface hover:bg-surface/80 transition overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className={`w-10 h-10 rounded-lg bg-surface flex items-center justify-center ${config.className}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary truncate">
                        {material.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-text-tertiary flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {config.label}
                        </Badge>
                        {fileSizeStr && <span>{fileSizeStr}</span>}
                        <span>{formatRelativeTime(material.created_at)}</span>
                      </div>
                      {material.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {material.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {canPreview && previewUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePreview(material.id)}
                          title={isShowingPreview ? "Close preview" : "Preview"}
                        >
                          {isShowingPreview ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(material)}
                        disabled={isPending}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Inline Preview */}
                  {isShowingPreview && previewUrl && (
                    <div className="px-3 pb-3">
                      <div className="rounded-lg overflow-hidden bg-black/5 border border-border">
                        {(material.material_type === "image" || material.mime_type?.startsWith("image/")) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt={material.title}
                            className="max-w-full max-h-[400px] mx-auto block"
                            loading="lazy"
                          />
                        ) : (material.material_type === "video" || material.mime_type?.startsWith("video/")) ? (
                          <video
                            src={previewUrl}
                            controls
                            className="max-w-full max-h-[400px] mx-auto block"
                            preload="metadata"
                          >
                            Your browser does not support video playback.
                          </video>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
