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
          updated_at: string | null;
          team_id: string;
          repository_id: string;
          repository_name: string;
          id: string;
          created_at: string | null;
          installation_id: number;
        };
        Insert: {
          updated_at?: string | null;
          team_id: string;
          repository_id: string;
          repository_name: string;
          id?: string;
          created_at?: string | null;
          installation_id: number;
        };
        Update: {
          updated_at?: string | null;
          team_id?: string;
          repository_id?: string;
          repository_name?: string;
          id?: string;
          created_at?: string | null;
          installation_id?: number;
        };
      };
      organizations: {
        Row: {
          id: string;
          account_name: string;
          account_id: string;
          installation_id: string;
          avatar_url: string;
          updated_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          account_name: string;
          account_id: string;
          installation_id: string;
          avatar_url: string;
          updated_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          account_name?: string;
          account_id?: string;
          installation_id?: string;
          avatar_url?: string;
          updated_at?: string | null;
          created_at?: string | null;
        };
      };
      pull_requests: {
        Row: {
          thread_ts: string;
          created_at: string | null;
          pr_id: string;
          id: string;
          organization_id: string | null;
        };
        Insert: {
          thread_ts: string;
          created_at?: string | null;
          pr_id: string;
          id?: string;
          organization_id?: string | null;
        };
        Update: {
          thread_ts?: string;
          created_at?: string | null;
          pr_id?: string;
          id?: string;
          organization_id?: string | null;
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
          slack_team_name: string | null;
          slack_team_id: string | null;
          organization_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          access_token?: string | null;
          channel_id?: string | null;
          id?: string;
          created_at?: string | null;
          channel_name: string;
          team_id?: string | null;
          slack_team_name?: string | null;
          slack_team_id?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          access_token?: string | null;
          channel_id?: string | null;
          id?: string;
          created_at?: string | null;
          channel_name?: string;
          team_id?: string | null;
          slack_team_name?: string | null;
          slack_team_id?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
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
          organization_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          github_username: string;
          id?: string;
          created_at?: string | null;
          slack_user_id: string;
          team_id?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          github_username?: string;
          id?: string;
          created_at?: string | null;
          slack_user_id?: string;
          team_id?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          created_at: string | null;
          email: string | null;
          gh_access_token: string | null;
          gh_refresh_token: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          email?: string | null;
          gh_access_token?: string | null;
          gh_refresh_token?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          email?: string | null;
          gh_access_token?: string | null;
          gh_refresh_token?: string | null;
          updated_at?: string | null;
        };
      };
      users_and_organizations: {
        Row: {
          id: string;
          user_id: string;
          org_id: string;
          updated_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          org_id: string;
          updated_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          org_id?: string;
          updated_at?: string | null;
          created_at?: string | null;
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
