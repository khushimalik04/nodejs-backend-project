// Unit tests for user controller handlers. We inject mocks into the real `db` object.
jest.mock('@/core/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

interface MockDb {
  select: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

const mockDb: MockDb = {
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Inject mocks into real db
import { db as realDb } from '../../src/db';
realDb.select = mockDb.select;
realDb.update = mockDb.update;
realDb.delete = mockDb.delete;

import {
  listUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
  getCurrentUserHandler,
} from '../../src/controllers/user.controller';
import ErrorHandler from '../../src/utils/errorHandler';
import type { Request, Response, NextFunction } from 'express';

describe('User Controller - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listUsersHandler returns users array', async () => {
    // Make select(...).from(...) return an array
    mockDb.select.mockImplementationOnce(() => ({ from: () => [{ id: 'u1', email: 'a@b' }] }));

    const req = {} as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await listUsersHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const sent = (res.json as jest.Mock).mock.calls[0][0];
    expect(sent).toHaveProperty('data');
    expect(Array.isArray(sent.data)).toBe(true);
    expect(sent.data.length).toBe(1);
  });

  it('getUserByIdHandler calls next with NotFound when missing', async () => {
    mockDb.select.mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }));
    const req = { params: { id: 'missing' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await getUserByIdHandler(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ErrorHandler);
    expect(err.statusCode).toBe(404);
  });

  it('updateUserHandler updates successfully', async () => {
    // existing user found
    mockDb.select.mockImplementationOnce(() => ({
      from: () => ({ where: () => ({ limit: async () => [{ id: 'u1' }] }) }),
    }));
    // update returns updated row
    mockDb.update.mockImplementationOnce(() => ({
      set: () => ({
        where: () => ({ returning: async () => [{ id: 'u1', username: 'priya_updated', email: 'p@e' }] }),
      }),
    }));

    const req = { params: { id: 'u1' }, body: { username: 'priya_updated' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await updateUserHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const sent = (res.json as jest.Mock).mock.calls[0][0];
    expect(sent.data).toHaveProperty('username', 'priya_updated');
  });

  it('updateUserHandler rejects invalid data', async () => {
    mockDb.select.mockImplementationOnce(() => ({
      from: () => ({ where: () => ({ limit: async () => [{ id: 'u1' }] }) }),
    }));
    const req = { params: { id: 'u1' }, body: { username: 'ab' } } as unknown as Request; // too short
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await updateUserHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ErrorHandler);
    expect(err.statusCode).toBe(400);
  });

  it('deleteUserHandler returns success when found', async () => {
    mockDb.select.mockImplementationOnce(() => ({
      from: () => ({ where: () => ({ limit: async () => [{ id: 'u1' }] }) }),
    }));
    mockDb.delete.mockImplementationOnce(() => ({ where: () => ({ returning: async () => [{ id: 'u1' }] }) }));

    const req = { params: { id: 'u1' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await deleteUserHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const sent = (res.json as jest.Mock).mock.calls[0][0];
    expect(sent).toHaveProperty('message', 'User deleted successfully');
  });

  it('getCurrentUserHandler returns NotAuthenticated when no req.user', async () => {
    const req = {} as Request; // no user
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await getCurrentUserHandler(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ErrorHandler);
    expect(err.statusCode).toBe(401);
  });
});
