// Explicit re-exports to ensure proper module resolution
export { sendSMS, makeCall, getMessageHistory } from "./communication.actions"
export { createLead, getLead, getLeads, updateLeadStatus, addNote } from "./lead.actions"
export { uploadDocument, getDocuments, deleteDocument } from "./document.actions"
export { generateAIResponse } from "./ai.actions"

export { getOrCreateUser, getCurrentUser, updateUserProfile } from "./user.actions"

export { getUserSettings, updateUserSettings } from "./settings.actions"

export {
  getUserTeams,
  getTeam,
  createTeam,
  updateTeam,
  inviteTeamMember,
  removeTeamMember,
  deleteTeam,
} from "./team.actions"

export {
  getUserApiKeys,
  getTeamApiKeys,
  createApiKey,
  revokeApiKey,
  validateApiKey,
} from "./api-key.actions"

export { getUserActivity, logActivity, getDashboardStats } from "./activity.actions"
