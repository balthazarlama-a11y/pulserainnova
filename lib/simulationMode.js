export const SIMULATION_ONLY = false;

export const SIMULATION_USER = {
  id: "sim-user",
  email: "demo@calmband.local",
  user_metadata: {
    display_name: "Carolina"
  },
  created_at: new Date().toISOString()
};

export const SIMULATION_SESSION = {
  access_token: "sim-token",
  refresh_token: "sim-refresh",
  user: SIMULATION_USER
};

export const SIMULATION_PROFILE = {
  id: SIMULATION_USER.id,
  email: SIMULATION_USER.email,
  display_name: SIMULATION_USER.user_metadata.display_name,
  updated_at: SIMULATION_USER.created_at
};