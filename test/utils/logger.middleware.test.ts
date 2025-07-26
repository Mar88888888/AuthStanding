import { LoggerMiddleware } from '../../src/utils/logger.middleware';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let mockLoggerLog: jest.SpyInstance;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
    mockLoggerLog = jest
      .spyOn(middleware['logger'], 'log')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next()', () => {
    const req = {
      ip: '127.0.0.1',
      method: 'GET',
      originalUrl: '/test',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    } as any;

    const onFinishCallbacks: { [key: string]: () => void } = {};
    const res = {
      on: (event: string, cb: () => void) => {
        onFinishCallbacks[event] = cb;
      },
      get: jest.fn().mockReturnValue('123'),
      statusCode: 200,
    } as any;

    const next = jest.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();

    onFinishCallbacks['finish']();

    expect(mockLoggerLog).toHaveBeenCalledWith(
      'GET /test 200 123 - Mozilla/5.0 127.0.0.1',
    );
  });
});
