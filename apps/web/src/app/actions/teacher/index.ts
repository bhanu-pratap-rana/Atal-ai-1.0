/**
 * Barrel export file for teacher actions
 * Re-exports all teacher action functions for backward compatibility
 */

// Class management
export { createClass, updateClass, deleteClass } from "./teacher-class";

// Student enrollment
export { enrollStudent, removeStudent } from "./teacher-enrollment";

// Assessment results
export {
  getClassAssessmentResults,
  getTeacherAssessmentOverview,
  type StudentAssessmentResult,
  type ClassAssessmentResults,
} from "./teacher-assessment";

// Analytics and exports
export {
  getClassAnalytics,
  exportStudentProgress,
  exportAIInteractions,
} from "./teacher-analytics-export";

// Teacher Communication (announcements & materials)
export {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getClassAnnouncements,
  uploadMaterial,
  uploadMaterialFile,
  deleteMaterial,
  getClassMaterials,
  incrementMaterialDownload,
  markAnnouncementRead,
  getStudentUnreadAnnouncements,
  getStudentClassAnnouncements,
  getStudentClassMaterials,
  type Announcement,
  type AnnouncementWithReadStatus,
  type Material,
} from "./teacher-communication";
