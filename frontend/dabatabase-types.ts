export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      github_integration: {
        Row: {
          team_id: string;
          access_token: string;
          id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          team_id: string;
          access_token: string;
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          team_id?: string;
          access_token?: string;
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      github_repositories: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          team_id: string;
          repository_id: string;
          repository_name: string;
          installation_id: number;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          team_id: string;
          repository_id: string;
          repository_name: string;
          installation_id: number;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          team_id?: string;
          repository_id?: string;
          repository_name?: string;
          installation_id?: number;
        };
      };
      pull_requests: {
        Row: {
          thread_ts: string;
          created_at: string | null;
          pr_id: string;
          id: string;
        };
        Insert: {
          thread_ts: string;
          created_at?: string | null;
          pr_id: string;
          id?: string;
        };
        Update: {
          thread_ts?: string;
          created_at?: string | null;
          pr_id?: string;
          id?: string;
        };
      };
      slack_integration: {
        Row: {
          access_token: string | null;
          channel_id: string | null;
          id: string;
          created_at: string | null;
          channel_name: string;
          team_id: string | null;
          updated_at: string | null;
          slack_team_name: string | null;
          slack_team_id: string | null;
        };
        Insert: {
          access_token?: string | null;
          channel_id?: string | null;
          id?: string;
          created_at?: string | null;
          channel_name: string;
          team_id?: string | null;
          updated_at?: string | null;
          slack_team_name?: string | null;
          slack_team_id?: string | null;
        };
        Update: {
          access_token?: string | null;
          channel_id?: string | null;
          id?: string;
          created_at?: string | null;
          channel_name?: string;
          team_id?: string | null;
          updated_at?: string | null;
          slack_team_name?: string | null;
          slack_team_id?: string | null;
        };
      };
      team: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
          installation_id: string | null;
          installation_image_url: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
          installation_id?: string | null;
          installation_image_url?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
          installation_id?: string | null;
          installation_image_url?: string | null;
        };
      };
      username_mappings: {
        Row: {
          github_username: string;
          id: string;
          created_at: string | null;
          slack_user_id: string;
          team_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          github_username: string;
          id?: string;
          created_at?: string | null;
          slack_user_id: string;
          team_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          github_username?: string;
          id?: string;
          created_at?: string | null;
          slack_user_id?: string;
          team_id?: string | null;
          updated_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          created_at: string | null;
          email: string | null;
          updated_at: string | null;
          gh_access_token: string | null;
          gh_refresh_token: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          email?: string | null;
          updated_at?: string | null;
          gh_access_token?: string | null;
          gh_refresh_token?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          email?: string | null;
          updated_at?: string | null;
          gh_access_token?: string | null;
          gh_refresh_token?: string | null;
        };
      };
      users_and_teams: {
        Row: {
          user: string;
          team: string;
        };
        Insert: {
          user: string;
          team: string;
        };
        Update: {
          user?: string;
          team?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
