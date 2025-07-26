import { UsersModule } from '../../src/users/users.module';

describe('UsersModule', () => {
  let module: UsersModule;

  beforeAll(() => {
    module = new UsersModule();
  });

  it('should compile UsersModule', () => {
    expect(module).toBeDefined();
  });
});
