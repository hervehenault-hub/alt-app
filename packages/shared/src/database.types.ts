export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      actions: {
        Row: {
          body: string;
          created_at: string;
          domain: string;
          effort: Database['public']['Enums']['action_effort'];
          id: string;
          impact_factor_id: string | null;
          kind: Database['public']['Enums']['action_kind'];
          linked_category: string | null;
          saving_basis: string;
          saving_eur_per_occurrence: number;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          domain: string;
          effort: Database['public']['Enums']['action_effort'];
          id: string;
          impact_factor_id?: string | null;
          kind: Database['public']['Enums']['action_kind'];
          linked_category?: string | null;
          saving_basis: string;
          saving_eur_per_occurrence: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          domain?: string;
          effort?: Database['public']['Enums']['action_effort'];
          id?: string;
          impact_factor_id?: string | null;
          kind?: Database['public']['Enums']['action_kind'];
          linked_category?: string | null;
          saving_basis?: string;
          saving_eur_per_occurrence?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'actions_domain_fkey';
            columns: ['domain'];
            isOneToOne: false;
            referencedRelation: 'domains';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'actions_impact_factor_id_fkey';
            columns: ['impact_factor_id'];
            isOneToOne: false;
            referencedRelation: 'impact_factors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'actions_linked_category_fkey';
            columns: ['linked_category'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      analytics_events: {
        Row: {
          anon_id: string;
          created_at: string;
          id: number;
          name: string;
          props: NonNullable<Json>;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          anon_id: string;
          created_at?: string;
          id?: never;
          name: string;
          props?: NonNullable<Json>;
          user_id?: string | null;
        };
        Update: {
          anon_id?: string;
          created_at?: string;
          id?: never;
          name?: string;
          props?: NonNullable<Json>;
          user_id?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          description: string | null;
          domain_id: string;
          id: string;
          label: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          description?: string | null;
          domain_id: string;
          id: string;
          label: string;
          sort_order?: number;
        };
        Update: {
          description?: string | null;
          domain_id?: string;
          id?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_domain_id_fkey';
            columns: ['domain_id'];
            isOneToOne: false;
            referencedRelation: 'domains';
            referencedColumns: ['id'];
          },
        ];
      };
      cities: {
        Row: {
          bbox: unknown;
          center: unknown;
          created_at: string;
          id: string;
          name: string;
          slug: string;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          bbox: unknown;
          center: unknown;
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          bbox?: unknown;
          center?: unknown;
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_rules_acceptances: {
        Row: {
          accepted_at: string;
          user_id: string;
          version: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string;
          user_id?: string;
          version: string;
        };
        Update: {
          accepted_at?: string;
          user_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_rules_acceptances_version_fkey';
            columns: ['version'];
            isOneToOne: false;
            referencedRelation: 'community_rules_versions';
            referencedColumns: ['version'];
          },
        ];
      };
      community_rules_versions: {
        Row: {
          effective_at: string;
          summary: string | null;
          version: string;
        };
        ComputedFields: never;
        Insert: {
          effective_at?: string;
          summary?: string | null;
          version: string;
        };
        Update: {
          effective_at?: string;
          summary?: string | null;
          version?: string;
        };
        Relationships: [];
      };
      content_reports: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          reason: Database['public']['Enums']['content_report_reason'];
          reporter_id: string;
          resolved_by: string | null;
          status: Database['public']['Enums']['report_status'];
          target_id: string;
          target_type: Database['public']['Enums']['content_report_target'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          reason: Database['public']['Enums']['content_report_reason'];
          reporter_id?: string;
          resolved_by?: string | null;
          status?: Database['public']['Enums']['report_status'];
          target_id: string;
          target_type: Database['public']['Enums']['content_report_target'];
          updated_at?: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          reason?: Database['public']['Enums']['content_report_reason'];
          reporter_id?: string;
          resolved_by?: string | null;
          status?: Database['public']['Enums']['report_status'];
          target_id?: string;
          target_type?: Database['public']['Enums']['content_report_target'];
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          initiator_id: string;
          post_id: string;
          recipient_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          initiator_id?: string;
          post_id: string;
          recipient_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          initiator_id?: string;
          post_id?: string;
          recipient_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'help_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      domains: {
        Row: {
          id: string;
          label: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          id: string;
          label: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      equivalences: {
        Row: {
          created_at: string;
          id: string;
          label: string;
          method: string;
          retrieved_at: string | null;
          source_name: string;
          source_url: string;
          status: Database['public']['Enums']['impact_factor_status'];
          uncertainty: string;
          unit: string;
          updated_at: string;
          upstream_source_url: string | null;
          value: number | null;
          version: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id: string;
          label: string;
          method: string;
          retrieved_at?: string | null;
          source_name: string;
          source_url: string;
          status?: Database['public']['Enums']['impact_factor_status'];
          uncertainty: string;
          unit: string;
          updated_at?: string;
          upstream_source_url?: string | null;
          value?: number | null;
          version?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          label?: string;
          method?: string;
          retrieved_at?: string | null;
          source_name?: string;
          source_url?: string;
          status?: Database['public']['Enums']['impact_factor_status'];
          uncertainty?: string;
          unit?: string;
          updated_at?: string;
          upstream_source_url?: string | null;
          value?: number | null;
          version?: string | null;
        };
        Relationships: [];
      };
      help_posts: {
        Row: {
          author_id: string;
          created_at: string;
          description: string;
          expires_at: string;
          id: string;
          neighborhood_id: string;
          service: Database['public']['Enums']['help_service'];
          status: Database['public']['Enums']['help_post_status'];
          title: string;
          type: Database['public']['Enums']['help_post_type'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string;
          created_at?: string;
          description: string;
          expires_at?: string;
          id?: string;
          neighborhood_id: string;
          service: Database['public']['Enums']['help_service'];
          status?: Database['public']['Enums']['help_post_status'];
          title: string;
          type: Database['public']['Enums']['help_post_type'];
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          created_at?: string;
          description?: string;
          expires_at?: string;
          id?: string;
          neighborhood_id?: string;
          service?: Database['public']['Enums']['help_service'];
          status?: Database['public']['Enums']['help_post_status'];
          title?: string;
          type?: Database['public']['Enums']['help_post_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'help_posts_neighborhood_id_fkey';
            columns: ['neighborhood_id'];
            isOneToOne: false;
            referencedRelation: 'neighborhoods';
            referencedColumns: ['id'];
          },
        ];
      };
      impact_factors: {
        Row: {
          created_at: string;
          id: string;
          label: string;
          method: string;
          retrieved_at: string | null;
          source_name: string;
          source_url: string;
          status: Database['public']['Enums']['impact_factor_status'];
          uncertainty: string;
          unit: string;
          updated_at: string;
          upstream_source_url: string | null;
          value: number | null;
          version: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id: string;
          label: string;
          method: string;
          retrieved_at?: string | null;
          source_name: string;
          source_url: string;
          status?: Database['public']['Enums']['impact_factor_status'];
          uncertainty: string;
          unit: string;
          updated_at?: string;
          upstream_source_url?: string | null;
          value?: number | null;
          version?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          label?: string;
          method?: string;
          retrieved_at?: string | null;
          source_name?: string;
          source_url?: string;
          status?: Database['public']['Enums']['impact_factor_status'];
          uncertainty?: string;
          unit?: string;
          updated_at?: string;
          upstream_source_url?: string | null;
          value?: number | null;
          version?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          sender_id: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          sender_id?: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      need_categories: {
        Row: {
          category_id: string;
          need_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          need_id: string;
        };
        Update: {
          category_id?: string;
          need_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'need_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'need_categories_need_id_fkey';
            columns: ['need_id'];
            isOneToOne: false;
            referencedRelation: 'needs';
            referencedColumns: ['id'];
          },
        ];
      };
      needs: {
        Row: {
          id: string;
          label: string;
          search_text: string | null;
          search_tsv: unknown;
          sort_order: number;
          synonyms: string[];
        };
        ComputedFields: never;
        Insert: {
          id: string;
          label: string;
          search_text?: never;
          search_tsv?: never;
          sort_order?: number;
          synonyms?: string[];
        };
        Update: {
          id?: string;
          label?: string;
          search_text?: never;
          search_tsv?: never;
          sort_order?: number;
          synonyms?: string[];
        };
        Relationships: [];
      };
      neighborhoods: {
        Row: {
          city_id: string;
          created_at: string;
          geom: unknown;
          id: string;
          name: string;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          city_id: string;
          created_at?: string;
          geom?: unknown;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          city_id?: string;
          created_at?: string;
          geom?: unknown;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'neighborhoods_city_id_fkey';
            columns: ['city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
        ];
      };
      opening_hours: {
        Row: {
          closes: string;
          id: number;
          opens: string;
          place_id: string;
          weekday: number;
        };
        ComputedFields: never;
        Insert: {
          closes: string;
          id?: never;
          opens: string;
          place_id: string;
          weekday: number;
        };
        Update: {
          closes?: string;
          id?: never;
          opens?: string;
          place_id?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'opening_hours_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      place_confirmations: {
        Row: {
          created_at: string;
          place_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          place_id: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          place_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'place_confirmations_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      place_owners: {
        Row: {
          created_at: string;
          created_by: string | null;
          place_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          place_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          place_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'place_owners_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      place_reports: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          place_id: string;
          reason: Database['public']['Enums']['place_report_reason'];
          reporter_id: string;
          resolved_by: string | null;
          status: Database['public']['Enums']['report_status'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          place_id: string;
          reason: Database['public']['Enums']['place_report_reason'];
          reporter_id?: string;
          resolved_by?: string | null;
          status?: Database['public']['Enums']['report_status'];
          updated_at?: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          place_id?: string;
          reason?: Database['public']['Enums']['place_report_reason'];
          reporter_id?: string;
          resolved_by?: string | null;
          status?: Database['public']['Enums']['report_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'place_reports_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      place_submissions: {
        Row: {
          created_at: string;
          id: string;
          kind: Database['public']['Enums']['submission_kind'];
          moderator_id: string | null;
          payload: NonNullable<Json>;
          photo_path: string | null;
          place_id: string | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          status: Database['public']['Enums']['submission_status'];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          kind: Database['public']['Enums']['submission_kind'];
          moderator_id?: string | null;
          payload: NonNullable<Json>;
          photo_path?: string | null;
          place_id?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          status?: Database['public']['Enums']['submission_status'];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: Database['public']['Enums']['submission_kind'];
          moderator_id?: string | null;
          payload?: NonNullable<Json>;
          photo_path?: string | null;
          place_id?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          status?: Database['public']['Enums']['submission_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'place_submissions_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      places: {
        Row: {
          address: string | null;
          category_id: string;
          city_id: string;
          created_at: string;
          created_by: string | null;
          estimated_saving_eur: number | null;
          id: string;
          is_free: boolean;
          last_verified_at: string;
          license: string | null;
          location: unknown;
          name: string;
          needs_recheck: boolean;
          price_hint: string | null;
          published: boolean;
          saving_basis: string | null;
          source: Database['public']['Enums']['place_source'];
          source_ref: string | null;
          status: Database['public']['Enums']['place_status'];
          transit_accessible: boolean;
          updated_at: string;
          walk_accessible: boolean;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          category_id: string;
          city_id: string;
          created_at?: string;
          created_by?: string | null;
          estimated_saving_eur?: number | null;
          id?: string;
          is_free?: boolean;
          last_verified_at: string;
          license?: string | null;
          location: unknown;
          name: string;
          needs_recheck?: boolean;
          price_hint?: string | null;
          published?: boolean;
          saving_basis?: string | null;
          source: Database['public']['Enums']['place_source'];
          source_ref?: string | null;
          status?: Database['public']['Enums']['place_status'];
          transit_accessible?: boolean;
          updated_at?: string;
          walk_accessible?: boolean;
        };
        Update: {
          address?: string | null;
          category_id?: string;
          city_id?: string;
          created_at?: string;
          created_by?: string | null;
          estimated_saving_eur?: number | null;
          id?: string;
          is_free?: boolean;
          last_verified_at?: string;
          license?: string | null;
          location?: unknown;
          name?: string;
          needs_recheck?: boolean;
          price_hint?: string | null;
          published?: boolean;
          saving_basis?: string | null;
          source?: Database['public']['Enums']['place_source'];
          source_ref?: string | null;
          status?: Database['public']['Enums']['place_status'];
          transit_accessible?: boolean;
          updated_at?: string;
          walk_accessible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'places_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'places_city_id_fkey';
            columns: ['city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          analytics_opt_out: boolean;
          city_id: string | null;
          created_at: string;
          display_name: string | null;
          gamification_enabled: boolean;
          id: string;
          interests: string[];
          main_constraint: Database['public']['Enums']['main_constraint'] | null;
          neighborhood_id: string | null;
          notification_frequency: Database['public']['Enums']['notification_frequency'];
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          analytics_opt_out?: boolean;
          city_id?: string | null;
          created_at?: string;
          display_name?: string | null;
          gamification_enabled?: boolean;
          id: string;
          interests?: string[];
          main_constraint?: Database['public']['Enums']['main_constraint'] | null;
          neighborhood_id?: string | null;
          notification_frequency?: Database['public']['Enums']['notification_frequency'];
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          analytics_opt_out?: boolean;
          city_id?: string | null;
          created_at?: string;
          display_name?: string | null;
          gamification_enabled?: boolean;
          id?: string;
          interests?: string[];
          main_constraint?: Database['public']['Enums']['main_constraint'] | null;
          neighborhood_id?: string | null;
          notification_frequency?: Database['public']['Enums']['notification_frequency'];
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_city_id_fkey';
            columns: ['city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_neighborhood_id_fkey';
            columns: ['neighborhood_id'];
            isOneToOne: false;
            referencedRelation: 'neighborhoods';
            referencedColumns: ['id'];
          },
        ];
      };
      thanks: {
        Row: {
          created_at: string;
          from_user: string;
          id: string;
          post_id: string | null;
          to_user: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          from_user?: string;
          id?: string;
          post_id?: string | null;
          to_user: string;
        };
        Update: {
          created_at?: string;
          from_user?: string;
          id?: string;
          post_id?: string | null;
          to_user?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'thanks_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'help_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      user_actions: {
        Row: {
          action_id: string;
          created_at: string;
          id: string;
          occurred_at: string;
          status: Database['public']['Enums']['user_action_status'];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          action_id: string;
          created_at?: string;
          id?: string;
          occurred_at?: string;
          status: Database['public']['Enums']['user_action_status'];
          user_id?: string;
        };
        Update: {
          action_id?: string;
          created_at?: string;
          id?: string;
          occurred_at?: string;
          status?: Database['public']['Enums']['user_action_status'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_actions_action_id_fkey';
            columns: ['action_id'];
            isOneToOne: false;
            referencedRelation: 'actions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        ComputedFields: never;
        Insert: {
          blocked_id: string;
          blocker_id?: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_journeys: {
        Row: {
          created_at: string;
          current_action_id: string | null;
          next_at: string | null;
          rhythm: Database['public']['Enums']['journey_rhythm'];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          current_action_id?: string | null;
          next_at?: string | null;
          rhythm?: Database['public']['Enums']['journey_rhythm'];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          current_action_id?: string | null;
          next_at?: string | null;
          rhythm?: Database['public']['Enums']['journey_rhythm'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_journeys_current_action_id_fkey';
            columns: ['current_action_id'];
            isOneToOne: false;
            referencedRelation: 'actions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_community_rules_version: { Args: Record<PropertyKey, never>; Returns: string };
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database['public']['Enums']['user_role'];
      };
      has_accepted_community_rules: { Args: Record<PropertyKey, never>; Returns: boolean };
      immutable_unaccent: { Args: { value: string }; Returns: string };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_blocked_with: { Args: { other: string }; Returns: boolean };
      is_open_now: { Args: { at?: string; place_id: string }; Returns: boolean };
      is_place_owner: { Args: { p_place_id: string }; Returns: boolean };
      need_search_document: { Args: { label: string; synonyms: string[] }; Returns: string };
      normalize_search_text: { Args: { value: string }; Returns: string };
      place_confirmations_threshold: { Args: Record<PropertyKey, never>; Returns: number };
      search_needs: {
        Args: { max_results?: number; q: string };
        Returns: {
          category_ids: string[];
          label: string;
          need_id: string;
          score: number;
        }[];
      };
    };
    Enums: {
      action_effort: 'faible' | 'moyen';
      action_kind: 'ponctuelle' | 'habitude';
      content_report_reason: 'spam' | 'harassment' | 'inappropriate' | 'dangerous' | 'other';
      content_report_target: 'post' | 'message' | 'user';
      help_post_status: 'open' | 'closed' | 'hidden';
      help_post_type: 'offer' | 'request';
      help_service: 'repair_help' | 'carpool' | 'childcare' | 'tool_sharing';
      impact_factor_status: 'verifie_code_source' | 'verifie' | 'a_verifier';
      journey_rhythm: 'weekly' | 'twice_weekly' | 'self_paced';
      main_constraint: 'budget' | 'temps' | 'mobilite';
      notification_frequency: 'never' | 'weekly' | 'daily';
      place_report_reason: 'closed' | 'wrong_hours' | 'wrong_address' | 'other';
      place_source: 'osm' | 'open_data' | 'manual' | 'user';
      place_status: 'community' | 'multi_confirmed' | 'merchant_confirmed';
      report_status: 'open' | 'resolved' | 'dismissed';
      submission_kind: 'new' | 'edit';
      submission_status: 'pending' | 'approved' | 'rejected';
      user_action_status: 'done' | 'later' | 'not_for_me';
      user_role: 'user' | 'merchant' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      action_effort: ['faible', 'moyen'],
      action_kind: ['ponctuelle', 'habitude'],
      content_report_reason: ['spam', 'harassment', 'inappropriate', 'dangerous', 'other'],
      content_report_target: ['post', 'message', 'user'],
      help_post_status: ['open', 'closed', 'hidden'],
      help_post_type: ['offer', 'request'],
      help_service: ['repair_help', 'carpool', 'childcare', 'tool_sharing'],
      impact_factor_status: ['verifie_code_source', 'verifie', 'a_verifier'],
      journey_rhythm: ['weekly', 'twice_weekly', 'self_paced'],
      main_constraint: ['budget', 'temps', 'mobilite'],
      notification_frequency: ['never', 'weekly', 'daily'],
      place_report_reason: ['closed', 'wrong_hours', 'wrong_address', 'other'],
      place_source: ['osm', 'open_data', 'manual', 'user'],
      place_status: ['community', 'multi_confirmed', 'merchant_confirmed'],
      report_status: ['open', 'resolved', 'dismissed'],
      submission_kind: ['new', 'edit'],
      submission_status: ['pending', 'approved', 'rejected'],
      user_action_status: ['done', 'later', 'not_for_me'],
      user_role: ['user', 'merchant', 'admin'],
    },
  },
} as const;
