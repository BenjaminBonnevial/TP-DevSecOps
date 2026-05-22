import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken, getAuthFromRequest } from '@/lib/auth';
import { NextRequest } from 'next/server';

describe('auth.ts — token expiré', () => {
  it('rejette un token dont exp est dans le passé', () => {
    const secret = process.env.JWT_SECRET ?? 'fallback-secret-change-me';
    const expired = jwt.sign(
      { userId: 'abc', email: 'test@example.io', role: 'USER' },
      secret,
      { expiresIn: -1 },
    );
    expect(verifyToken(expired)).toBeNull();
  });
});

describe('auth.ts — getAuthFromRequest', () => {
  it('retourne null si le header Authorization est absent', () => {
    const req = new NextRequest('http://localhost/api/test');
    expect(getAuthFromRequest(req)).toBeNull();
  });

  it('retourne null si le header ne commence pas par Bearer', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(getAuthFromRequest(req)).toBeNull();
  });
});
