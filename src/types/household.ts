export type Household = {
  id: string;
  name: string;
  invite_code: string;
};

export type HouseholdMember = {
  user_id: string;
  display_name: string;
  joined_at: string;
};
