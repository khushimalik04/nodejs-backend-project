// Unit tests for task controller logic. Mocks DB and helper modules so tests run fast.
jest.mock('@/core/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const mockDb: any = {
  insert: jest.fn(() => ({ values: () => ({ returning: async () => [{ id: 't1', title: 'T1', userId: 'u1' }] }) })),
  select: jest.fn(() => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) })),
  update: jest.fn(() => ({ set: () => ({ where: () => ({ returning: async () => [] }) }) })),
  delete: jest.fn(() => ({ where: () => ({ returning: async () => [] }) })),
};

// Inject our mocks into the real db object so controllers use them
const realDb = require('../../src/db').db;
realDb.insert = mockDb.insert;
realDb.select = mockDb.select;
realDb.update = mockDb.update;
realDb.delete = mockDb.delete;

// Mock verifyUserAccess to just check req.user presence
jest.mock('@/middlewares/verifyUserAccess', () => ({
  verifyUserAccess: (req: any) => {
    if (!req.user) throw new (require('@/utils/errorHandler')).default.AuthError('Not authenticated');
  },
}));

jest.mock('@/utils/googleStatus', () => ({
  createCalendarEventForTask: jest.fn(async () => null),
  updateCalendarEventForTask: jest.fn(async () => null),
  deleteCalendarEventForTask: jest.fn(async () => true),
}));

import { createTaskHandler, getTaskByIdHandler, updateTaskHandler, deleteTaskHandler } from '../../src/controllers/task.controller';
import ErrorHandler from '../../src/utils/errorHandler';

describe('Task Controller - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createTaskHandler creates a task and returns 201-like result', async () => {
    const req: any = { user: { id: 'u1', isVerified: true }, body: { title: 'New', description: 'd' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await createTaskHandler(req as any, res as any, next as any);

    expect(res.status).toHaveBeenCalledWith(201);
    const sent = res.json.mock.calls[0][0];
    expect(sent).toHaveProperty('data');
    expect(sent.data).toHaveProperty('id', 't1');
  });

  it('getTaskByIdHandler returns NotFound if task missing', async () => {
    // make select return empty
    mockDb.select.mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }));
    const req: any = { user: { id: 'u1', isVerified: true }, params: { id: 'missing' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await getTaskByIdHandler(req as any, res as any, next as any);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ErrorHandler);
  });

  it('updateTaskHandler forbids update when owned by other user', async () => {
    // return a task owned by someone else
    mockDb.select.mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 't2', userId: 'other' }] }) }) }));
    const req: any = { user: { id: 'u1', isVerified: true }, params: { id: 't2' }, body: { title: 'X' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await updateTaskHandler(req as any, res as any, next as any);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(ErrorHandler);
  });

  it('deleteTaskHandler forbids delete when owned by other user', async () => {
    mockDb.select.mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 't3', userId: 'other', title: 'T' }] }) }) }));
    const req: any = { user: { id: 'u1', isVerified: true }, params: { id: 't3' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await deleteTaskHandler(req as any, res as any, next as any);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(ErrorHandler);
  });
});

