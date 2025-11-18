import ErrorHandler from '../../src/utils/errorHandler';
import { Response } from '../../src/utils/asyncHandler';

describe('Small unit tests - ErrorHandler & Response helpers', () => {
  it('ErrorHandler factory methods produce correct status codes', () => {
    const v = ErrorHandler.ValidationError('bad');
    const a = ErrorHandler.AuthError('no');
    const f = ErrorHandler.Forbidden('nope');
    const n = ErrorHandler.NotFound('missing');
    const c = ErrorHandler.Conflict('dup');

    expect(v.statusCode).toBe(400);
    expect(a.statusCode).toBe(401);
    expect(f.statusCode).toBe(403);
    expect(n.statusCode).toBe(404);
    expect(c.statusCode).toBe(409);
  });

  it('Response helpers return expected shapes', () => {
    const s = Response.success({ foo: 'bar' }, 'ok', 200);
    const c = Response.created({ id: '1' }, 'created');
    const p = Response.paginated([{ id: 1 }], 1, 1, 10, 'list');

    expect(s).toHaveProperty('data');
    expect(c.statusCode).toBe(201);
    expect(p.meta).toBeDefined();
    expect((p.meta as any).pagination.total).toBe(1);
  });
});
