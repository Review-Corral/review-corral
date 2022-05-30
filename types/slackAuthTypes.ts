export interface Team {
  name: string;
  id: string;
}

export interface Enterprise {
  name: string;
  id: string;
}

export interface AuthedUser {
  id: string;
  scope: string;
  access_token: string;
  token_type: string;
}

export interface RootObject {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: Team;
  enterprise: Enterprise;
  authed_user: AuthedUser;
}
