export type HoneyDoCadence = "none" | "daily" | "weekly" | "monthly";

export type HoneyDo = {
  id: string;
  household_id: string;
  group_name: string;
  text: string;
  checked: boolean;
  cadence: HoneyDoCadence;
  checked_at: string | null;
  created_at: string;
};
