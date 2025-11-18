// Unit tests for user controller handlers. We inject mocks into the real `db` object.
jest.mock('@/core/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const mockDb: any = {
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Inject mocks into real db
const realDb = require('../../src/db').db;
realDb.select = mockDb.select;
realDb.update = mockDb.update;
realDb.delete = mockDb.delete;

import { listUsersHandler, getUserByIdHandler, updateUserHandler, deleteUserHandler, getCurrentUserHandler } from '../../src/controllers/user.controller';
import ErrorHandler from '../../src/utils/errorHandler';

describe('User Controller - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listUsersHandler returns users array', async () => {
    // Make select(...).from(...) return an array
    mockDb.select.mockImplementationOnce(() => ({ from: () => [{ id: 'u1', email: 'a@b' }] }));

    const req: any = {};
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await listUsersHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const sent = res.json.mock.calls[0][0];
    expect(sent).toHaveProperty('data');
    expect(Array.isArray(sent.data)).toBe(true);
    expect(sent.data.length).toBe(1);
  });

  it('getUserByIdHandler calls next with NotFound when missing', async () => {
    mockDb.select.mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }));
    const req: any = { params: { id: 'missing' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await getUserByIdHandler(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ErrorHandler);
    expect(err.statusCode).toBe(404);
  });

  it('updateUserHandler updates successfully', async () => {
    // existing user found
    mockDb.select.mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 'u1' }] }) }) }));
    // update returns updated row
    mockDb.update.mockImplementationOnce(() => ({ set: () => ({ where: () => ({ returning: async () => [{ id: 'u1', username: 'priya_updated', email: 'p@e' }] }) }) }));

    const req: any = { params: { id: 'u1' }, body: { username: 'priya_updated' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await updateUserHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const sent = res.json.mock.calls[0][0];
    expect(sent.data).toHaveProperty('username', 'priya_updated');
  });

  it('updateUserHandler rejects invalid data', async () => {
    mockDb.select.mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 'u1' }] }) }) }));
    const req: any = { params: { id: 'u1' }, body: { username: 'ab' } }; // too short
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await updateUserHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ErrorHandler);
    expect(err.statusCode).toBe(400);
  });

  it('deleteUserHandler returns success when found', async () => {
    mockDb.select.mockImplementationOnce(() => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 'u1' }] }) }) }));
    mockDb.delete.mockImplementationOnce(() => ({ where: () => ({ returning: async () => [{ id: 'u1' }] }) }));

    const req: any = { params: { id: 'u1' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await deleteUserHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const sent = res.json.mock.calls[0][0];
    expect(sent).toHaveProperty('message', 'User deleted successfully');
  });

  it('getCurrentUserHandler returns NotAuthenticated when no req.user', async () => {
    const req: any = {}; // no user
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await getCurrentUserHandler(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ErrorHandler);
    expect(err.statusCode).toBe(401);
  });
});
