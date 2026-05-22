import { describe, it, expect } from 'vitest';
import { canEditTicket, User, Ticket } from '@/lib/permissions';

const admin: User = { id: 'admin-1', role: 'ADMIN' };
const user: User = { id: 'user-1', role: 'USER' };
const otherUser: User = { id: 'user-2', role: 'USER' };

const openTicket: Ticket = { id: 't1', authorId: 'user-1', status: 'OPEN' };
const inProgressTicket: Ticket = { id: 't2', authorId: 'user-1', status: 'IN_PROGRESS' };
const resolvedTicket: Ticket = { id: 't3', authorId: 'user-1', status: 'RESOLVED' };
const closedTicket: Ticket = { id: 't4', authorId: 'user-1', status: 'CLOSED' };

describe('canEditTicket', () => {
  it("autorise un ADMIN à éditer n'importe quel ticket", () => {
    expect(canEditTicket(admin, openTicket)).toBe(true);
    expect(canEditTicket(admin, resolvedTicket)).toBe(true);
    expect(canEditTicket(admin, closedTicket)).toBe(true);
  });

  it('autorise un USER propriétaire sur un ticket OPEN', () => {
    expect(canEditTicket(user, openTicket)).toBe(true);
  });

  it('autorise un USER propriétaire sur un ticket IN_PROGRESS', () => {
    expect(canEditTicket(user, inProgressTicket)).toBe(true);
  });

  it('refuse un USER non-propriétaire même sur un ticket OPEN', () => {
    expect(canEditTicket(otherUser, openTicket)).toBe(false);
  });

  it('refuse un USER propriétaire sur un ticket RESOLVED', () => {
    expect(canEditTicket(user, resolvedTicket)).toBe(false);
  });

  it('refuse un USER propriétaire sur un ticket CLOSED', () => {
    expect(canEditTicket(user, closedTicket)).toBe(false);
  });
});
