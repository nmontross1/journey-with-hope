export type Event = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string | null;
  image?: string | null;
  location?: string | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
};
