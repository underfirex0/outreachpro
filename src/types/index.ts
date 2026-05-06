export type LeadStatus = "unsent" | "sent" | "replied" | "interested" | "not-interested" | "not-sure";
export type Group = "A" | "B";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  site: string;
  group: Group;
  status: LeadStatus;
  sent_at: string | null;
  replied_at: string | null;
  notes: string | null;
  created_at: string;
}
