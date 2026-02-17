"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createClient,
  createAdminClient,
  verifyClassOwnership,
} from "@/lib/supabase-server";
import { checkTeacherMutationRateLimit } from "@/lib/rate-limiter-distributed";
import {
  CreateAnnouncementSchema,
  UpdateAnnouncementSchema,
  AnnouncementIdSchema,
  UploadMaterialSchema,
  MaterialIdSchema,
  ClassIdSchema,
} from "@/lib/validation-schemas";
import { authLogger } from "@/lib/auth-logger";
import { handleZodError } from "@/lib/action-error-handler";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";

/**
 * Teacher Communication Server Actions
 *
 * Handles class announcements and materials sharing.
 * All actions require teacher authentication and class ownership verification.
 */

// ============================================================================
// Announcement Types
// ============================================================================

export interface Announcement {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  body: string;
  priority: "low" | "normal" | "high" | "urgent";
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithReadStatus extends Announcement {
  read_count?: number;
  total_students?: number;
}

// ============================================================================
// Material Types
// ============================================================================

export interface Material {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  material_type: "document" | "video" | "link" | "image" | "other";
  file_url: string | null;
  external_url: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  topic_id: string | null;
  module_id: string | null;
  download_count: number;
  view_count: number;
  created_at: string;
}

// ============================================================================
// Announcement Actions
// ============================================================================

/**
 * Create a new class announcement
 */
export async function createAnnouncement(input: {
  classId: string;
  title: string;
  body: string;
  priority?: "low" | "normal" | "high" | "urgent";
  isPinned?: boolean;
}) {
  try {
    // Validate input
    let validatedInput;
    try {
      validatedInput = CreateAnnouncementSchema.parse(input);
    } catch (error) {
      return handleZodError(error);
    }

    // SECURITY: Verify caller owns this class
    const auth = await verifyClassOwnership(
      "createAnnouncement",
      validatedInput.classId,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    // Rate limit
    const rateLimitAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!rateLimitAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("class_announcements")
      .insert({
        class_id: validatedInput.classId,
        teacher_id: auth.user.id,
        title: validatedInput.title,
        body: validatedInput.body,
        priority: validatedInput.priority,
        is_pinned: validatedInput.isPinned,
      })
      .select()
      .single();

    if (error) {
      authLogger.error("[createAnnouncement] Database error", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/teacher/classes/${validatedInput.classId}`);
    revalidatePath("/app/student/announcements");
    return { success: true, data };
  } catch (error) {
    authLogger.error("[createAnnouncement] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncement(input: {
  announcementId: string;
  title?: string;
  body?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  isPinned?: boolean;
}) {
  try {
    // Validate input
    let validatedInput;
    try {
      validatedInput = UpdateAnnouncementSchema.parse(input);
    } catch (error) {
      return handleZodError(error);
    }

    // First, get the announcement to verify ownership
    const supabase = await createClient();

    const { data: announcement, error: fetchError } = await supabase
      .from("class_announcements")
      .select("class_id, teacher_id")
      .eq("id", validatedInput.announcementId)
      .maybeSingle();

    if (fetchError || !announcement) {
      return { success: false, error: "Announcement not found" };
    }

    // SECURITY: Verify caller owns the class
    const auth = await verifyClassOwnership(
      "updateAnnouncement",
      announcement.class_id,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    // Rate limit
    const rateLimitAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!rateLimitAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    // Build update object
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (validatedInput.title !== undefined) updateData.title = validatedInput.title;
    if (validatedInput.body !== undefined) updateData.body = validatedInput.body;
    if (validatedInput.priority !== undefined) updateData.priority = validatedInput.priority;
    if (validatedInput.isPinned !== undefined) updateData.is_pinned = validatedInput.isPinned;

    const { data, error } = await supabase
      .from("class_announcements")
      .update(updateData)
      .eq("id", validatedInput.announcementId)
      .select()
      .single();

    if (error) {
      authLogger.error("[updateAnnouncement] Database error", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/teacher/classes/${announcement.class_id}`);
    revalidatePath("/app/student/announcements");
    return { success: true, data };
  } catch (error) {
    authLogger.error("[updateAnnouncement] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(announcementId: string) {
  try {
    // Validate input
    let validatedId;
    try {
      validatedId = AnnouncementIdSchema.parse(announcementId);
    } catch (error) {
      return handleZodError(error);
    }

    const supabase = await createClient();

    // Get announcement to verify ownership
    const { data: announcement, error: fetchError } = await supabase
      .from("class_announcements")
      .select("class_id")
      .eq("id", validatedId)
      .maybeSingle();

    if (fetchError || !announcement) {
      return { success: false, error: "Announcement not found" };
    }

    // SECURITY: Verify caller owns the class
    const auth = await verifyClassOwnership(
      "deleteAnnouncement",
      announcement.class_id,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    // Rate limit
    const rateLimitAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!rateLimitAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const { error } = await supabase
      .from("class_announcements")
      .delete()
      .eq("id", validatedId);

    if (error) {
      authLogger.error("[deleteAnnouncement] Database error", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/teacher/classes/${announcement.class_id}`);
    revalidatePath("/app/student/announcements");
    return { success: true };
  } catch (error) {
    authLogger.error("[deleteAnnouncement] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get announcements for a class (teacher view with read counts)
 */
export async function getClassAnnouncements(classId: string) {
  try {
    // Validate input
    let validatedClassId;
    try {
      validatedClassId = ClassIdSchema.parse(classId);
    } catch (error) {
      return handleZodError(error);
    }

    // SECURITY: Verify caller owns this class
    const auth = await verifyClassOwnership(
      "getClassAnnouncements",
      validatedClassId,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    const supabase = await createClient();

    // Get announcements with read counts using RPC function
    const { data, error } = await supabase.rpc("get_announcements_with_reads", {
      p_class_id: validatedClassId,
    });

    if (error) {
      // Fallback to direct query if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("class_announcements")
        .select("*")
        .eq("class_id", validatedClassId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (fallbackError) {
        authLogger.error("[getClassAnnouncements] Database error", fallbackError);
        return { success: false, error: fallbackError.message };
      }

      return { success: true, data: fallbackData };
    }

    return { success: true, data };
  } catch (error) {
    authLogger.error("[getClassAnnouncements] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// ============================================================================
// Material Actions
// ============================================================================

/**
 * Upload/create a class material
 */
export async function uploadMaterial(input: {
  classId: string;
  title: string;
  description?: string;
  materialType: "document" | "video" | "link" | "image" | "other";
  fileUrl?: string;
  externalUrl?: string;
  topicId?: string;
  moduleId?: string;
}) {
  try {
    // Validate input
    let validatedInput;
    try {
      validatedInput = UploadMaterialSchema.parse(input);
    } catch (error) {
      return handleZodError(error);
    }

    // Ensure at least one URL is provided
    if (!validatedInput.fileUrl && !validatedInput.externalUrl) {
      return {
        success: false,
        error: "Either file URL or external URL is required",
      };
    }

    // SECURITY: Verify caller owns this class
    const auth = await verifyClassOwnership(
      "uploadMaterial",
      validatedInput.classId,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    // Rate limit
    const rateLimitAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!rateLimitAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("class_materials")
      .insert({
        class_id: validatedInput.classId,
        teacher_id: auth.user.id,
        title: validatedInput.title,
        description: validatedInput.description || null,
        material_type: validatedInput.materialType,
        file_url: validatedInput.fileUrl || null,
        external_url: validatedInput.externalUrl || null,
        topic_id: validatedInput.topicId || null,
        module_id: validatedInput.moduleId || null,
      })
      .select()
      .single();

    if (error) {
      authLogger.error("[uploadMaterial] Database error", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/teacher/classes/${validatedInput.classId}`);
    revalidatePath("/app/student/materials");
    return { success: true, data };
  } catch (error) {
    authLogger.error("[uploadMaterial] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Upload a file to Supabase Storage and create a class material record.
 * Accepts FormData with: file, classId, title, description, materialType, moduleId
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/", "application/pdf", "application/msword", "application/vnd.", "text/"];

export async function uploadMaterialFile(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    const classId = formData.get("classId") as string;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || undefined;
    const materialType = formData.get("materialType") as string;
    const moduleId = (formData.get("moduleId") as string) || undefined;

    // Validate required fields
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "No file provided" };
    }
    if (!classId || !title || !materialType) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "File size exceeds 50MB limit" };
    }

    // Validate MIME type
    const isAllowedType = ALLOWED_MIME_PREFIXES.some((prefix) =>
      file.type.startsWith(prefix),
    );
    if (!isAllowedType) {
      return { success: false, error: `File type "${file.type}" is not allowed` };
    }

    // Validate classId is a UUID
    try {
      z.string().uuid().parse(classId);
    } catch {
      return { success: false, error: "Invalid class ID" };
    }

    // SECURITY: Verify caller owns this class
    const auth = await verifyClassOwnership("uploadMaterialFile", classId);
    if (!auth.authorized) {
      return auth.error;
    }

    // Rate limit
    const rateLimitAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!rateLimitAllowed) {
      return { success: false, error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS };
    }

    // Generate a safe storage path: classId/timestamp-filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${classId}/${Date.now()}-${sanitizedName}`;

    // Upload to Supabase Storage using admin client (auth verified above)
    const adminClient = await createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from("Study Material")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      authLogger.error("[uploadMaterialFile] Storage upload error", uploadError);
      return { success: false, error: "Failed to upload file" };
    }

    // Get the public URL
    const { data: urlData } = adminClient.storage
      .from("Study Material")
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // Insert material record in DB
    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from("class_materials")
      .insert({
        class_id: classId,
        teacher_id: auth.user.id,
        title,
        description: description || null,
        material_type: materialType,
        file_url: fileUrl,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        module_id: moduleId || null,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await adminClient.storage.from("Study Material").remove([storagePath]);
      authLogger.error("[uploadMaterialFile] Database error", dbError);
      return { success: false, error: "Failed to save material record" };
    }

    revalidatePath(`/app/teacher/classes/${classId}`);
    revalidatePath("/app/student/materials");
    return { success: true, data };
  } catch (error) {
    authLogger.error("[uploadMaterialFile] Unexpected error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Delete a class material
 */
export async function deleteMaterial(materialId: string) {
  try {
    // Validate input
    let validatedId;
    try {
      validatedId = MaterialIdSchema.parse(materialId);
    } catch (error) {
      return handleZodError(error);
    }

    const supabase = await createClient();

    // Get material to verify ownership and check for storage file
    const { data: material, error: fetchError } = await supabase
      .from("class_materials")
      .select("class_id, storage_path")
      .eq("id", validatedId)
      .maybeSingle();

    if (fetchError || !material) {
      return { success: false, error: "Material not found" };
    }

    // SECURITY: Verify caller owns the class
    const auth = await verifyClassOwnership("deleteMaterial", material.class_id);
    if (!auth.authorized) {
      return auth.error;
    }

    // Rate limit
    const rateLimitAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!rateLimitAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    // Clean up storage file if it exists
    if (material.storage_path) {
      const adminClient = await createAdminClient();
      await adminClient.storage
        .from("Study Material")
        .remove([material.storage_path]);
    }

    const { error } = await supabase
      .from("class_materials")
      .delete()
      .eq("id", validatedId);

    if (error) {
      authLogger.error("[deleteMaterial] Database error", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/teacher/classes/${material.class_id}`);
    revalidatePath("/app/student/materials");
    return { success: true };
  } catch (error) {
    authLogger.error("[deleteMaterial] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get materials for a class (teacher view)
 */
export async function getClassMaterials(classId: string) {
  try {
    // Validate input
    let validatedClassId;
    try {
      validatedClassId = ClassIdSchema.parse(classId);
    } catch (error) {
      return handleZodError(error);
    }

    // SECURITY: Verify caller owns this class
    const auth = await verifyClassOwnership("getClassMaterials", validatedClassId);
    if (!auth.authorized) {
      return auth.error;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("class_materials")
      .select("*")
      .eq("class_id", validatedClassId)
      .order("created_at", { ascending: false });

    if (error) {
      authLogger.error("[getClassMaterials] Database error", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    authLogger.error("[getClassMaterials] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Increment material download count
 * This can be called by students when they download a material
 */
export async function incrementMaterialDownload(materialId: string) {
  try {
    // Validate input
    let validatedId;
    try {
      validatedId = MaterialIdSchema.parse(materialId);
    } catch (error) {
      return handleZodError(error);
    }

    // This action doesn't require teacher auth - students can trigger it
    const supabase = await createClient();

    const { error } = await supabase.rpc("increment_material_download", {
      p_material_id: validatedId,
    });

    if (error) {
      // RPC should always work - if it fails, log and continue
      // The download still happened, just tracking failed
      authLogger.warn("[incrementMaterialDownload] RPC failed", {
        error: error.message,
        materialId: validatedId,
      });
    }

    return { success: true };
  } catch (error) {
    // Log error but don't fail - analytics shouldn't break UX
    authLogger.error("[incrementMaterialDownload] Error", error);
    return { success: true };
  }
}

// ============================================================================
// Student-facing Actions
// ============================================================================

/**
 * Mark an announcement as read by the current student
 */
export async function markAnnouncementRead(announcementId: string) {
  try {
    // Validate input
    let validatedId;
    try {
      validatedId = AnnouncementIdSchema.parse(announcementId);
    } catch (error) {
      return handleZodError(error);
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Insert read record (ignore if already exists due to unique constraint)
    const { error } = await supabase.from("announcement_reads").upsert(
      {
        announcement_id: validatedId,
        student_id: user.id,
      },
      {
        onConflict: "announcement_id,student_id",
        ignoreDuplicates: true,
      },
    );

    if (error && error.code !== "23505") {
      // Ignore duplicate key errors
      authLogger.error("[markAnnouncementRead] Database error", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    authLogger.error("[markAnnouncementRead] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get unread announcements for the current student
 */
export async function getStudentUnreadAnnouncements() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Use the RPC function to get unread announcements
    const { data, error } = await supabase.rpc("get_unread_announcements", {
      p_student_id: user.id,
    });

    if (error) {
      authLogger.error("[getStudentUnreadAnnouncements] RPC error", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    authLogger.error("[getStudentUnreadAnnouncements] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get all announcements for a specific class (student-facing)
 * Includes read status for the current student
 */
export async function getStudentClassAnnouncements(classId: string) {
  try {
    // Validate input
    let validatedClassId;
    try {
      validatedClassId = ClassIdSchema.parse(classId);
    } catch (error) {
      return handleZodError(error);
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify student is enrolled in this class
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("class_id", validatedClassId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (enrollmentError) {
      authLogger.error("[getStudentClassAnnouncements] Enrollment check error", enrollmentError);
      return { success: false, error: "Failed to verify enrollment" };
    }

    if (!enrollment) {
      return { success: false, error: "Not enrolled in this class" };
    }

    // Get announcements with read status
    const { data: announcements, error: announcementsError } = await supabase
      .from("class_announcements")
      .select(`
        *,
        announcement_reads!left(student_id)
      `)
      .eq("class_id", validatedClassId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (announcementsError) {
      authLogger.error("[getStudentClassAnnouncements] Database error", announcementsError);
      return { success: false, error: announcementsError.message };
    }

    // Transform to include is_read status
    const announcementsWithReadStatus = (announcements || []).map((announcement) => {
      const readRecords = announcement.announcement_reads || [];
      const isRead = readRecords.some((r: { student_id: string }) => r.student_id === user.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { announcement_reads, ...announcementData } = announcement;
      return {
        ...announcementData,
        is_read: isRead,
      };
    });

    return { success: true, data: announcementsWithReadStatus };
  } catch (error) {
    authLogger.error("[getStudentClassAnnouncements] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get all materials for a specific class (student-facing)
 */
export async function getStudentClassMaterials(classId: string) {
  try {
    // Validate input
    let validatedClassId;
    try {
      validatedClassId = ClassIdSchema.parse(classId);
    } catch (error) {
      return handleZodError(error);
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify student is enrolled in this class
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("class_id", validatedClassId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (enrollmentError) {
      authLogger.error("[getStudentClassMaterials] Enrollment check error", enrollmentError);
      return { success: false, error: "Failed to verify enrollment" };
    }

    if (!enrollment) {
      return { success: false, error: "Not enrolled in this class" };
    }

    // Get materials - transform to use file_type as expected by component
    const { data: materials, error: materialsError } = await supabase
      .from("class_materials")
      .select("*")
      .eq("class_id", validatedClassId)
      .order("created_at", { ascending: false });

    if (materialsError) {
      authLogger.error("[getStudentClassMaterials] Database error", materialsError);
      return { success: false, error: materialsError.message };
    }

    const transformedMaterials = materials || [];

    return { success: true, data: transformedMaterials };
  } catch (error) {
    authLogger.error("[getStudentClassMaterials] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
