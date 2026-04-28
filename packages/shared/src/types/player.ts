import type { Team, Role } from './game.js';

export interface Player {
  id: string;
  displayName: string;
  team: Team | null;
  role: Role;
  connected: boolean;
}
