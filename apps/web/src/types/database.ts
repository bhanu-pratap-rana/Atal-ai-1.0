export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_tutor_interactions: {
        Row: {
          created_at: string | null
          id: string
          input_mode: string | null
          language: string | null
          message_content: string
          message_role: string
          response_time_ms: number | null
          session_id: string
          student_id: string | null
          tokens_used: number | null
          topic_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_mode?: string | null
          language?: string | null
          message_content: string
          message_role: string
          response_time_ms?: number | null
          session_id: string
          student_id?: string | null
          tokens_used?: number | null
          topic_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          input_mode?: string | null
          language?: string | null
          message_content?: string
          message_role?: string
          response_time_ms?: number | null
          session_id?: string
          student_id?: string | null
          tokens_used?: number | null
          topic_id?: string | null
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string | null
          student_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string | null
          student_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "class_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          chosen_option: string | null
          created_at: string
          focus_blur_count: number | null
          id: string
          is_correct: boolean | null
          item_id: string
          module: string
          rt_ms: number | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          chosen_option?: string | null
          created_at?: string
          focus_blur_count?: number | null
          id?: string
          is_correct?: boolean | null
          item_id: string
          module: string
          rt_ms?: number | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          chosen_option?: string | null
          created_at?: string
          focus_blur_count?: number | null
          id?: string
          is_correct?: boolean | null
          item_id?: string
          module?: string
          rt_ms?: number | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          session_type: string
          started_at: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          session_type?: string
          started_at?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          session_type?: string
          started_at?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          cultural_note: string | null
          description: string
          icon: string
          id: string
          name_as: string
          name_en: string
          name_hi: string
          points_value: number | null
          rarity: string | null
          unlock_criteria: Json
        }
        Insert: {
          cultural_note?: string | null
          description: string
          icon: string
          id: string
          name_as: string
          name_en: string
          name_hi: string
          points_value?: number | null
          rarity?: string | null
          unlock_criteria: Json
        }
        Update: {
          cultural_note?: string | null
          description?: string
          icon?: string
          id?: string
          name_as?: string
          name_en?: string
          name_hi?: string
          points_value?: number | null
          rarity?: string | null
          unlock_criteria?: Json
        }
        Relationships: []
      }
      class_announcements: {
        Row: {
          body: string
          class_id: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          priority: string | null
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          class_id: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          class_id?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_materials: {
        Row: {
          class_id: string
          created_at: string | null
          description: string | null
          download_count: number | null
          external_url: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_visible: boolean | null
          material_type: string
          mime_type: string | null
          module_id: string | null
          storage_path: string | null
          teacher_id: string
          title: string
          topic_id: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_visible?: boolean | null
          material_type: string
          mime_type?: string | null
          module_id?: string | null
          storage_path?: string | null
          teacher_id: string
          title: string
          topic_id?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_visible?: boolean | null
          material_type?: string
          mime_type?: string | null
          module_id?: string | null
          storage_path?: string | null
          teacher_id?: string
          title?: string
          topic_id?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string | null
          created_at: string | null
          id: string
          join_pin: string | null
          name: string
          subject: string | null
          teacher_id: string | null
        }
        Insert: {
          class_code?: string | null
          created_at?: string | null
          id?: string
          join_pin?: string | null
          name: string
          subject?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_code?: string | null
          created_at?: string | null
          id?: string
          join_pin?: string | null
          name?: string
          subject?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_content: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          embedding: string | null
          id: string
          language: string
          metadata: Json | null
          module_id: string
          title: string | null
          topic_id: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          language: string
          metadata?: Json | null
          module_id: string
          title?: string | null
          topic_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          language?: string
          metadata?: Json | null
          module_id?: string
          title?: string | null
          topic_id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_id: string | null
          created_at: string | null
          enrolled_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          rollout_percentage: number | null
          updated_at: string | null
          whitelist_user_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id: string
          name: string
          rollout_percentage?: number | null
          updated_at?: string | null
          whitelist_user_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          rollout_percentage?: number | null
          updated_at?: string | null
          whitelist_user_ids?: string[] | null
        }
        Relationships: []
      }
      formative_responses: {
        Row: {
          ai_hint_requested: boolean | null
          created_at: string | null
          id: string
          is_correct: boolean | null
          question_id: string
          response_time_ms: number | null
          student_id: string | null
          topic_id: string
        }
        Insert: {
          ai_hint_requested?: boolean | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          response_time_ms?: number | null
          student_id?: string | null
          topic_id: string
        }
        Update: {
          ai_hint_requested?: boolean | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          response_time_ms?: number | null
          student_id?: string | null
          topic_id?: string
        }
        Relationships: []
      }
      generated_lessons: {
        Row: {
          cache_version: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          language: string
          lesson_json: Json
          module_id: string
          student_id: string | null
          topic_id: string
        }
        Insert: {
          cache_version?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          language: string
          lesson_json: Json
          module_id: string
          student_id?: string | null
          topic_id: string
        }
        Update: {
          cache_version?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          language?: string
          lesson_json?: Json
          module_id?: string
          student_id?: string | null
          topic_id?: string
        }
        Relationships: []
      }
      irt_item_bank: {
        Row: {
          category: string
          correct_answer: number
          created_at: string | null
          created_by: string | null
          cultural_context: string | null
          difficulty: number
          discrimination: number
          estimated_time_seconds: number | null
          guessing: number
          id: string
          is_active: boolean | null
          item_code: string
          language: string
          level: string
          min_time_ms: number | null
          options: Json
          point_biserial: number | null
          question_text: string
          review_state: string | null
          source_language: string | null
          times_administered: number | null
          times_correct: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          correct_answer: number
          created_at?: string | null
          created_by?: string | null
          cultural_context?: string | null
          difficulty?: number
          discrimination?: number
          estimated_time_seconds?: number | null
          guessing?: number
          id?: string
          is_active?: boolean | null
          item_code: string
          language?: string
          level?: string
          min_time_ms?: number | null
          options: Json
          point_biserial?: number | null
          question_text: string
          review_state?: string | null
          source_language?: string | null
          times_administered?: number | null
          times_correct?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          correct_answer?: number
          created_at?: string | null
          created_by?: string | null
          cultural_context?: string | null
          difficulty?: number
          discrimination?: number
          estimated_time_seconds?: number | null
          guessing?: number
          id?: string
          is_active?: boolean | null
          item_code?: string
          language?: string
          level?: string
          min_time_ms?: number | null
          options?: Json
          point_biserial?: number | null
          question_text?: string
          review_state?: string | null
          source_language?: string | null
          times_administered?: number | null
          times_correct?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      learning_style_profile: {
        Row: {
          auditory_score: number | null
          id: string
          images_viewed: number | null
          preferred_style: string | null
          student_id: string | null
          text_read_time_seconds: number | null
          text_score: number | null
          updated_at: string | null
          visual_score: number | null
          voice_replays: number | null
        }
        Insert: {
          auditory_score?: number | null
          id?: string
          images_viewed?: number | null
          preferred_style?: string | null
          student_id?: string | null
          text_read_time_seconds?: number | null
          text_score?: number | null
          updated_at?: string | null
          visual_score?: number | null
          voice_replays?: number | null
        }
        Update: {
          auditory_score?: number | null
          id?: string
          images_viewed?: number | null
          preferred_style?: string | null
          student_id?: string | null
          text_read_time_seconds?: number | null
          text_score?: number | null
          updated_at?: string | null
          visual_score?: number | null
          voice_replays?: number | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          color_gradient: string | null
          created_at: string | null
          cultural_note_as: string | null
          cultural_note_en: string | null
          cultural_note_hi: string | null
          description_as: string | null
          description_en: string | null
          description_hi: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean | null
          name_as: string
          name_en: string
          name_hi: string
          updated_at: string | null
        }
        Insert: {
          color_gradient?: string | null
          created_at?: string | null
          cultural_note_as?: string | null
          cultural_note_en?: string | null
          cultural_note_hi?: string | null
          description_as?: string | null
          description_en?: string | null
          description_hi?: string | null
          display_order?: number
          icon?: string | null
          id: string
          is_active?: boolean | null
          name_as: string
          name_en: string
          name_hi: string
          updated_at?: string | null
        }
        Update: {
          color_gradient?: string | null
          created_at?: string | null
          cultural_note_as?: string | null
          cultural_note_en?: string | null
          cultural_note_hi?: string | null
          description_as?: string | null
          description_en?: string | null
          description_hi?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_as?: string
          name_en?: string
          name_hi?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      points_history: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          points: number
          source: string
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          source: string
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          source?: string
          student_id?: string | null
        }
        Relationships: []
      }
      practice_questions: {
        Row: {
          correct_index: number
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          language: string | null
          module_id: string
          options: Json
          order_index: number | null
          question: string
          topic_id: string
        }
        Insert: {
          correct_index: number
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          language?: string | null
          module_id: string
          options?: Json
          order_index?: number | null
          question: string
          topic_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          language?: string | null
          module_id?: string
          options?: Json
          order_index?: number | null
          question?: string
          topic_id?: string
        }
        Relationships: []
      }
      school_staff_credentials: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          pin_hash: string
          rotated_at: string | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          pin_hash: string
          rotated_at?: string | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          pin_hash?: string
          rotated_at?: string | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_staff_credentials_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          block: string | null
          created_at: string | null
          district: string
          id: string
          school_code: string
          school_name: string
        }
        Insert: {
          address?: string | null
          block?: string | null
          created_at?: string | null
          district: string
          id?: string
          school_code: string
          school_name: string
        }
        Update: {
          address?: string | null
          block?: string | null
          created_at?: string | null
          district?: string
          id?: string
          school_code?: string
          school_name?: string
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          badge_id: string | null
          earned_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      student_knowledge_state: {
        Row: {
          attempts: number | null
          confidence_level: string | null
          created_at: string | null
          id: string
          last_attempt_at: string | null
          mastery_score: number | null
          module_id: string
          status: string | null
          student_id: string | null
          time_spent_seconds: number | null
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          mastery_score?: number | null
          module_id: string
          status?: string | null
          student_id?: string | null
          time_spent_seconds?: number | null
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          mastery_score?: number | null
          module_id?: string
          status?: string | null
          student_id?: string | null
          time_spent_seconds?: number | null
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          class_name: string | null
          created_at: string | null
          curriculum_completed: boolean
          curriculum_completed_at: string | null
          gender: string
          name: string
          phone: string | null
          roll_number: string | null
          school_id: string | null
          school_name: string | null
          updated_at: string | null
          user_id: string
          village: string | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string | null
          curriculum_completed?: boolean
          curriculum_completed_at?: string | null
          gender: string
          name: string
          phone?: string | null
          roll_number?: string | null
          school_id?: string | null
          school_name?: string | null
          updated_at?: string | null
          user_id: string
          village?: string | null
        }
        Update: {
          class_name?: string | null
          created_at?: string | null
          curriculum_completed?: boolean
          curriculum_completed_at?: string | null
          gender?: string
          name?: string
          phone?: string | null
          roll_number?: string | null
          school_id?: string | null
          school_name?: string | null
          updated_at?: string | null
          user_id?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      summative_results: {
        Row: {
          badge_level: string | null
          completed_at: string | null
          id: string
          mcq_score: number | null
          module_id: string
          passed: boolean | null
          practical_score: number | null
          reflection_score: number | null
          student_id: string | null
          total_score: number | null
        }
        Insert: {
          badge_level?: string | null
          completed_at?: string | null
          id?: string
          mcq_score?: number | null
          module_id: string
          passed?: boolean | null
          practical_score?: number | null
          reflection_score?: number | null
          student_id?: string | null
          total_score?: number | null
        }
        Update: {
          badge_level?: string | null
          completed_at?: string | null
          id?: string
          mcq_score?: number | null
          module_id?: string
          passed?: boolean | null
          practical_score?: number | null
          reflection_score?: number | null
          student_id?: string | null
          total_score?: number | null
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          id: string
          idempotency_key: string
          student_id: string
          sync_type: string
          synced_at: string
        }
        Insert: {
          id?: string
          idempotency_key: string
          student_id: string
          sync_type: string
          synced_at?: string
        }
        Update: {
          id?: string
          idempotency_key?: string
          student_id?: string
          sync_type?: string
          synced_at?: string
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          created_at: string | null
          gender: string | null
          name: string
          phone: string | null
          school_code: string
          school_id: string
          subject: string | null
          updated_at: string | null
          user_id: string
          village: string | null
        }
        Insert: {
          created_at?: string | null
          gender?: string | null
          name: string
          phone?: string | null
          school_code: string
          school_id: string
          subject?: string | null
          updated_at?: string | null
          user_id: string
          village?: string | null
        }
        Update: {
          created_at?: string | null
          gender?: string | null
          name?: string
          phone?: string | null
          school_code?: string
          school_id?: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string | null
          description_as: string | null
          description_en: string | null
          description_hi: string | null
          display_order: number
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          module_id: string
          name_as: string
          name_en: string
          name_hi: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_as?: string | null
          description_en?: string | null
          description_hi?: string | null
          display_order?: number
          duration_minutes?: number | null
          id: string
          is_active?: boolean | null
          module_id: string
          name_as: string
          name_en: string
          name_hi: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_as?: string | null
          description_en?: string | null
          description_hi?: string | null
          display_order?: number
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          module_id?: string
          name_as?: string
          name_en?: string
          name_hi?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string | null
          description_as: string | null
          description_en: string | null
          description_hi: string | null
          display_order: number
          id: string
          is_active: boolean
          module_id: string
          name_as: string
          name_en: string
          name_hi: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_as?: string | null
          description_en?: string | null
          description_hi?: string | null
          display_order?: number
          id: string
          is_active?: boolean
          module_id: string
          name_as: string
          name_en: string
          name_hi: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_as?: string | null
          description_en?: string | null
          description_hi?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          module_id?: string
          name_as?: string
          name_en?: string
          name_hi?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      usernames: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      batch_check_and_award_badges: {
        Args: { p_student_id: string }
        Returns: {
          badge_id: string
          badge_name_as: string
          badge_name_en: string
          badge_name_hi: string
          points_awarded: number
        }[]
      }
      check_email_exists: {
        Args: { p_email: string }
        Returns: {
          email_exists: boolean
          user_id: string
        }[]
      }
      check_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      cleanup_expired_lessons: { Args: never; Returns: undefined }
      cleanup_old_sync_logs: { Args: never; Returns: number }
      generate_class_code: { Args: never; Returns: string }
      generate_join_pin: { Args: never; Returns: string }
      get_connection_stats: {
        Args: Record<string, never>
        Returns: {
          active_connections: number
          max_connections: number
          utilization_percent: number
        }[]
      }
      get_announcement_read_count: {
        Args: { p_announcement_id: string }
        Returns: number
      }
      get_announcements_with_reads: {
        Args: { p_class_id: string }
        Returns: {
          body: string
          class_id: string
          created_at: string
          id: string
          is_pinned: boolean
          priority: string
          read_count: number
          title: string
          total_students: number
          updated_at: string
        }[]
      }
      get_class_leaderboard: {
        Args: { p_class_id: string; p_limit?: number }
        Returns: {
          rank: number
          student_id: string
          student_name: string
          total_points: number
        }[]
      }
      get_class_materials: {
        Args: { p_class_id: string }
        Returns: {
          created_at: string
          description: string
          download_count: number
          external_url: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          material_type: string
          mime_type: string
          storage_path: string
          title: string
          view_count: number
        }[]
      }
      get_class_roster: {
        Args: { p_class_id: string }
        Returns: {
          class_name: string
          enrolled_at: string
          enrollment_id: string
          roll_number: string
          student_id: string
          student_name: string
          student_phone: string
        }[]
      }
      get_class_student_progress: {
        Args: { p_student_ids: string[] }
        Returns: {
          avg_mastery_score: number
          last_activity: string
          student_id: string
          topics_in_progress: number
          topics_mastered: number
          topics_total: number
        }[]
      }
      get_module_topics: {
        Args: { p_module_id: string }
        Returns: {
          description_as: string
          description_en: string
          description_hi: string
          display_order: number
          duration_minutes: number
          id: string
          name_as: string
          name_en: string
          name_hi: string
        }[]
      }
      get_module_unit_count: { Args: { p_module_id: string }; Returns: number }
      get_student_total_points: { Args: { p_student_id: string }; Returns: number }
      upsert_generated_lesson: {
        Args: {
          p_module_id: string
          p_topic_id: string
          p_language: string
          p_lesson_json: Json
          p_cache_version?: string
          p_expires_at?: string
        }
        Returns: undefined
      }
      update_progress_atomic: {
        Args: {
          p_student_id: string
          p_module_id: string
          p_topic_id: string
          p_score: number
        }
        Returns: {
          success: boolean
          mastery_score: number
          status: string
          confidence_level: string
          attempts: number
        }
      }
      get_module_units_with_topics: {
        Args: { p_module_id: string }
        Returns: {
          topic_description_as: string
          topic_description_en: string
          topic_description_hi: string
          topic_display_order: number
          topic_duration_minutes: number
          topic_id: string
          topic_name_as: string
          topic_name_en: string
          topic_name_hi: string
          unit_description_as: string
          unit_description_en: string
          unit_description_hi: string
          unit_display_order: number
          unit_id: string
          unit_name_as: string
          unit_name_en: string
          unit_name_hi: string
        }[]
      }
      get_modules_with_counts: {
        Args: never
        Returns: {
          color_gradient: string
          cultural_note_as: string
          cultural_note_en: string
          cultural_note_hi: string
          description_as: string
          description_en: string
          description_hi: string
          display_order: number
          icon: string
          id: string
          name_as: string
          name_en: string
          name_hi: string
          topic_count: number
          unit_count: number
        }[]
      }
      get_school_metrics: {
        Args: never
        Returns: {
          active_pin_count: number
          school_id: string
          school_name: string
          student_count: number
          teacher_count: number
          total_classes: number
        }[]
      }
      get_teacher_class_ids: { Args: { p_user_id: string }; Returns: string[] }
      get_teacher_student_ids: { Args: never; Returns: string[] }
      get_topic: {
        Args: { p_topic_id: string }
        Returns: {
          description_as: string
          description_en: string
          description_hi: string
          duration_minutes: number
          id: string
          module_id: string
          name_as: string
          name_en: string
          name_hi: string
        }[]
      }
      get_topic_context: {
        Args: { p_language?: string; p_limit?: number; p_topic_id: string }
        Returns: {
          content: string
          content_type: string
          title: string
        }[]
      }
      get_unread_announcements: {
        Args: { p_student_id: string }
        Returns: {
          announcement_id: string
          body: string
          class_id: string
          class_name: string
          created_at: string
          priority: string
          title: string
        }[]
      }
      get_user_enrolled_class_ids: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_user_id_by_username: { Args: { p_username: string }; Returns: string }
      increment_auditory_score: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      increment_material_download: {
        Args: { p_material_id: string }
        Returns: undefined
      }
      increment_material_view: {
        Args: { p_material_id: string }
        Returns: undefined
      }
      increment_text_score: {
        Args: { p_student_id: string; p_time_seconds?: number }
        Returns: undefined
      }
      increment_visual_score: {
        Args: { p_student_id: string; p_time_seconds?: number }
        Returns: undefined
      }
      is_class_teacher: { Args: { p_class_id: string }; Returns: boolean }
      is_enrolled_in_class: { Args: { p_class_id: string }; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      match_curriculum: {
        Args: {
          filter_language?: string
          filter_topic?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          content_type: string
          id: string
          language: string
          module_id: string
          similarity: number
          title: string
          topic_id: string
        }[]
      }
      match_curriculum_cosine: {
        Args: {
          filter_language?: string
          filter_module?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          content_type: string
          id: string
          language: string
          module_id: string
          similarity: number
          title: string
          topic_id: string
        }[]
      }
      match_curriculum_content_simple: {
        Args: {
          filter_language?: string | null
          match_count?: number
          query_text: string
        }
        Returns: { content: string }[]
      }
      match_curriculum_hybrid: {
        Args: {
          filter_language?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
          query_text: string
          vector_weight?: number
        }
        Returns: {
          combined_score: number
          content: string
          id: string
          language: string
          module_id: string
          text_similarity: number
          topic_id: string
          vector_similarity: number
        }[]
      }
      rotate_staff_pin: {
        Args: { p_new_pin: string; p_school_id: string }
        Returns: {
          error_message: string
          new_pin: string
          success: boolean
        }[]
      }
      search_students_for_teacher: {
        Args: { p_limit?: number; p_search_query: string }
        Returns: {
          class_name: string
          name: string
          phone: string
          roll_number: string
          user_id: string
        }[]
      }
      submit_assessment: {
        Args: { p_responses: Json; p_session_id: string; p_user_id: string }
        Returns: Json
      }
      teacher_has_student_access: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: boolean
      }
      update_knowledge_state: {
        Args: {
          p_ai_hint_requested: boolean
          p_is_correct: boolean
          p_module_id: string
          p_response_time_ms: number
          p_student_id: string
          p_topic_id: string
        }
        Returns: Json
      }
      upsert_student_profile: {
        Args: {
          p_board: string
          p_class: string
          p_date_of_birth: string
          p_gender: string
          p_location: string
          p_medium: string
          p_name: string
          p_phone: string
          p_user_id: string
        }
        Returns: Json
      }
      verify_staff_pin: {
        Args: { p_pin: string; p_school_id: string }
        Returns: {
          is_valid: boolean
          pin_id: string
          school_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
