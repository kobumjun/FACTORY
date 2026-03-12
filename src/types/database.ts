export type ProfileRole = 'user' | 'admin';
export type ProjectTemplate = 'motivation' | 'informative' | 'quotes' | 'horror' | 'health';
export type StepStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type StepName = 'script' | 'scenes' | 'images' | 'tts' | 'video' | 'metadata';
export type CreditTransactionType = 'purchase' | 'usage' | 'admin_adjust' | 'refund';
export type OrderStatus = 'pending' | 'completed' | 'refunded' | 'failed';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  topic: string;
  template: ProjectTemplate;
  created_at: string;
  updated_at: string;
}

export interface ProjectStep {
  id: string;
  project_id: string;
  step: StepName;
  status: StepStatus;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  credits_used: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: CreditTransactionType;
  reference_id: string | null;
  reference_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  lemon_squeezy_order_id: string | null;
  lemon_squeezy_variant_id: string | null;
  status: OrderStatus;
  credits_granted: number | null;
  amount_cents: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationLog {
  id: string;
  user_id: string | null;
  project_id: string | null;
  step: string;
  status: 'success' | 'failure';
  provider: string | null;
  input_summary: string | null;
  error_message: string | null;
  credits_used: number | null;
  duration_ms: number | null;
  created_at: string;
}
