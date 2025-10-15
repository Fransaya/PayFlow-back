export interface SessionApp {
  session_id: string;
  user_owner_id: string | null;
  user_id: string | null;
  tenant_id: string;
  provider: string;
  refresh_token_enc: string;
  refresh_expires_at: Date;
  created_at: Date;
  last_used_at: Date;
  ip_address: string;
  user_agent: string;
}

export interface SessionAppCreate {
  user_owner_id?: string;
  user_id?: string;
  tenant_id: string;
  provider?: string;
  refresh_token_enc: string;
  refresh_expires_at: Date;
  ip_address?: string;
  user_agent?: string;
}
