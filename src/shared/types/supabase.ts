export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email: string;
          image?: string | null;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          image?: string | null;
          timezone?: string;
          created_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          cron_expression: string;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          cron_expression: string;
          timezone?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          cron_expression?: string;
          timezone?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      channel_connections: {
        Row: {
          id: string;
          user_id: string;
          channel_type: "slack" | "kakao";
          access_token: string;
          refresh_token: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel_type: "slack" | "kakao";
          access_token: string;
          refresh_token?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel_type?: "slack" | "kakao";
          access_token?: string;
          refresh_token?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          body: string;
          variables: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          body: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          body?: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      reminder_logs: {
        Row: {
          id: string;
          reminder_id: string;
          channel_type: "slack" | "kakao";
          status: "success" | "failure";
          sent_at: string;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          reminder_id: string;
          channel_type: "slack" | "kakao";
          status: "success" | "failure";
          sent_at?: string;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          reminder_id?: string;
          channel_type?: "slack" | "kakao";
          status?: "success" | "failure";
          sent_at?: string;
          error_message?: string | null;
        };
      };
    };
  };
}
