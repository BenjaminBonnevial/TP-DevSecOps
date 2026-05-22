import { describe, it, expect } from 'vitest';
import { loginSchema, ticketUpdateSchema } from '@/lib/validators';

describe('validators.ts — loginSchema', () => {
  it('accepte un login valide', () => {
    const result = loginSchema.safeParse({ email: 'admin@helpdesk.io', password: 'Password123!' });
    expect(result.success).toBe(true);
  });

  it('rejette un email invalide', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'Password123!' });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe vide', () => {
    const result = loginSchema.safeParse({ email: 'admin@helpdesk.io', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('validators.ts — ticketUpdateSchema', () => {
  it('accepte une mise à jour partielle (status uniquement)', () => {
    const result = ticketUpdateSchema.safeParse({ status: 'RESOLVED' });
    expect(result.success).toBe(true);
  });

  it('rejette un status invalide', () => {
    const result = ticketUpdateSchema.safeParse({ status: 'DELETED' });
    expect(result.success).toBe(false);
  });

  it('rejette une description trop courte', () => {
    const result = ticketUpdateSchema.safeParse({ description: 'court' });
    expect(result.success).toBe(false);
  });

  it('accepte assigneeId null (désassignation)', () => {
    const result = ticketUpdateSchema.safeParse({ assigneeId: null });
    expect(result.success).toBe(true);
  });
});
