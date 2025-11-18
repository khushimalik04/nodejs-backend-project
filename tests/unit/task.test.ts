// Unit tests for task controller logic. Mocks DB and helper modules so tests run fast.
jest.mock('@/core/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

interface MockDb {
  insert: jest.Mock;
  select: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

const mockDb: MockDb = {
  insert: jest.fn(() => ({ values: () => ({ returning: async () => [{ id: 't1', title: 'T1', userId: 'u1' }] }) })),
  select: jest.fn(() => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) })),
  update: jest.fn(() => ({ set: () => ({ where: () => ({ returning: async () => [] }) }) })),
  delete: jest.fn(() => ({ where: () => ({ returning: async () => [] }) })),
};

// Inject our mocks into the real db object so controllers use them
import { db as realDb } from '../../src/db';
import ErrorHandler from '../../src/utils/errorHandler';

realDb.insert = mockDb.insert;
realDb.select = mockDb.select;
realDb.update = mockDb.update;
realDb.delete = mockDb.delete;

// Mock verifyUserAccess to just check req.user presence
jest.mock('@/middlewares/verifyUserAccess', () => ({
  verifyUserAccess: (req: { user?: unknown }) => {
    if (!req.user) throw new ErrorHandler('Not authenticated', 401);
  },
}));

jest.mock('@/utils/googleStatus', () => ({
  createCalendarEventForTask: jest.fn(async () => null),
  updateCalendarEventForTask: jest.fn(async () => null),
  deleteCalendarEventForTask: jest.fn(async () => true),
}));

import {
  createTaskHandler,
  getTaskByIdHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from '../../src/controllers/task.controller';
import type { Request, Response, NextFunction } from 'express';

describe('Task Controller - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createTaskHandler creates a task and returns 201-like result', async () => {
    const req = {
      user: { id: 'u1', isVerified: true },
      body: { title: 'New', description: 'd' },
    } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await createTaskHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    const sent = (res.json as jest.Mock).mock.calls[0][0];
    expect(sent).toHaveProperty('data');
    expect(sent.data).toHaveProperty('id', 't1');
  });

  it('getTaskByIdHandler returns NotFound if task missing', async () => {
    // make select return empty
    mockDb.select.mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }));
    const req = { user: { id: 'u1', isVerified: true }, params: { id: 'missing' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await getTaskByIdHandler(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ErrorHandler);
  });

  it('updateTaskHandler forbids update when owned by other user', async () => {
    // return a task owned by someone else
    mockDb.select.mockImplementationOnce(() => ({
      from: () => ({ where: () => ({ limit: async () => [{ id: 't2', userId: 'other' }] }) }),
    }));
    const req = {
      user: { id: 'u1', isVerified: true },
      params: { id: 't2' },
      body: { title: 'X' },
    } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;
    await updateTaskHandler(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0]).toBeInstanceOf(ErrorHandler);
  });

  it('deleteTaskHandler forbids delete when owned by other user', async () => {
    mockDb.select.mockImplementationOnce(() => ({
      from: () => ({ where: () => ({ limit: async () => [{ id: 't3', userId: 'other', title: 'T' }] }) }),
    }));
    const req = { user: { id: 'u1', isVerified: true }, params: { id: 't3' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;
    await deleteTaskHandler(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0]).toBeInstanceOf(ErrorHandler);
  });
});
