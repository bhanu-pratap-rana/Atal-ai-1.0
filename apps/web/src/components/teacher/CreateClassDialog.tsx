"use client";

import { useCallback, useState } from "react";
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
import { createClass } from "@/app/actions/teacher";
import { clientLogger } from "@/lib/client-logger";
import { ClassCreationSuccess } from "./ClassCreationSuccess";

export function CreateClassDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdClass, setCreatedClass] = useState<{
    classCode: string;
    joinPin: string;
  } | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const result = await createClass(name, subject);

        if (result?.success && result?.data) {
          setCreatedClass({
            classCode: result.data.class_code,
            joinPin: result.data.join_pin || "",
          });
          toast.success("Class created successfully!");
          // Don't close dialog yet - show codes first
        } else if ("error" in result) {
          toast.error(result?.error || "Failed to create class");
        } else {
          toast.error("Failed to create class");
        }
      } catch (error) {
        clientLogger.error(
          "[CreateClassDialog] Failed to create class",
          error instanceof Error ? error : { error: String(error) },
        );
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    [name, subject],
  );

  const handleClose = useCallback(() => {
    setName("");
    setSubject("");
    setCreatedClass(null);
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <span className="mr-2">+</span>
          <span>Create Class</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        {createdClass ? (
          <ClassCreationSuccess
            classCode={createdClass.classCode}
            joinPin={createdClass.joinPin}
            onDone={handleClose}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to manage students and assignments.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class-name">Class Name</Label>
                <Input
                  id="class-name"
                  placeholder="e.g., Class 10-A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics, English, Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={loading}
                />
              </div>
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
              <Button type="submit" disabled={loading || !name}>
                {loading ? "Creating..." : "Create Class"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
