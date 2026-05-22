export interface User {
  id: string;
  role: 'USER' | 'ADMIN';
}

export interface Ticket {
  id: string;
  authorId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}

/**
 * Un ADMIN peut éditer n'importe quel ticket.
 * Un USER ne peut éditer que ses propres tickets et seulement s'ils sont OPEN ou IN_PROGRESS.
 */
export function canEditTicket(user: User, ticket: Ticket): boolean {
  if (user.role === 'ADMIN') return true;
  if (ticket.authorId !== user.id) return false;
  return ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS';
}
