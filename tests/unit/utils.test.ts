// Tests for helpers, jwt_session and validations
jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    genSalt: jest.fn(async () => 'salt'),
    hash: jest.fn(async (_p: string, _s: string) => 'hashed-pass'),
    compare: jest.fn(async (p: string, h: string) => p === 'plain' && h === 'hashed-pass'),
  },
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(() => 'signed-token'),
  },
}));

import { hashPassword, comparePasswords } from '../../src/utils/helpers';
import { generateJWTandSetCookie } from '../../src/utils/jwt_session';
import { SignupSchema, LoginSchema, CreateTaskSchema, TaskParamsSchema } from '../../src/utils/validations';

describe('helpers', () => {
  it('hashPassword returns hashed string', async () => {
    const h = await hashPassword('plain');
    expect(typeof h).toBe('string');
    // hashed value may come from real bcrypt or a mock; verify it works with comparePasswords
    const ok = await comparePasswords('plain', h);
    expect(ok).toBe(true);
  });

  it('comparePasswords verifies correctly', async () => {
    const h = await hashPassword('plain');
    const ok = await comparePasswords('plain', h);
    expect(ok).toBe(true);
    const nok = await comparePasswords('nope', h);
    expect(nok).toBe(false);
  });
});

describe('jwt_session', () => {
  it('generateJWTandSetCookie signs and sets cookie', () => {
    const res: any = { cookie: jest.fn() };
    const token = generateJWTandSetCookie(res, 'user123');
    expect(typeof token).toBe('string');
    expect(res.cookie).toHaveBeenCalled();
    const [name, value, options] = res.cookie.mock.calls[0];
    expect(name).toBe('token');
    expect(value).toBe(token);
    expect(options).toBeDefined();
  });
});

describe('validations', () => {
  it('SignupSchema accepts valid data and rejects invalid', () => {
    expect(() => SignupSchema.parse({ username: 'abc', email: 'a@b.com', password: 'Password1' })).not.toThrow();
    expect(() => SignupSchema.parse({ username: 'ab', email: 'x', password: 'short' })).toThrow();
  });

  it('LoginSchema accepts valid and rejects invalid', () => {
    expect(() => LoginSchema.parse({ email: 'a@b.com', password: 'Password1' })).not.toThrow();
    expect(() => LoginSchema.parse({ email: 'x', password: 'short' })).toThrow();
  });

  it('CreateTaskSchema validates start/end times correctly', () => {
    // valid when start < end
    expect(() => CreateTaskSchema.parse({ title: 'T', startTime: '2024-01-01T00:00:00Z', endTime: '2024-01-01T01:00:00Z' })).not.toThrow();
    // invalid when start >= end
    expect(() => CreateTaskSchema.parse({ title: 'T', startTime: '2024-01-01T02:00:00Z', endTime: '2024-01-01T01:00:00Z' })).toThrow();
  });

  it('TaskParamsSchema rejects non-uuid', () => {
    expect(() => TaskParamsSchema.parse({ id: 'not-a-uuid' } as any)).toThrow();
    // valid uuid should not throw
    expect(() => TaskParamsSchema.parse({ id: '550e8400-e29b-41d4-a716-446655440000' })).not.toThrow();
  });
});
