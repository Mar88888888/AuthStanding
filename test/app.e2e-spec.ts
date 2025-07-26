import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { db } from '../src/db/drizzle.provider';
import { users } from '../src/db/schema';

describe('Users Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Cannot run tests outside of test environment!');
    }

    await db.delete(users);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        stopAtFirstError: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UsersController (e2e)', () => {
    const signupData = {
      username: 'john',
      password: 'password123',
      email: 'john@example.com',
      fullName: 'John Doe',
      birthday: '1990-01-01',
    };

    let jwtToken: string;

    it('/users/signup (POST) - should create user', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/signup')
        .send(signupData)
        .expect(201)
        .catch((err) => {
          console.error('Signup failed response:', err);
          throw err;
        });

      expect(res.body).toHaveProperty('id');
      expect(res.body.username).toBe(signupData.username);
      expect(res.body.email).toBe(signupData.email);
      expect(res.body.fullName).toBe(signupData.fullName);
      expect(res.body.birthday).toBe(signupData.birthday);
    });

    it('/users/signin (POST) - should sign in and return JWT', async () => {
      const signinData = {
        username: signupData.username,
        password: signupData.password,
      };

      const res = await request(app.getHttpServer())
        .post('/users/signin')
        .send(signinData)
        .expect(200);

      expect(typeof res.text).toBe('string');
      expect(res.text.length).toBeGreaterThan(10);

      jwtToken = res.text;
    });

    it('/users/profile (GET) - should return user profile with valid JWT', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body.username).toBe(signupData.username);
      expect(res.body.email).toBe(signupData.email);
    });

    it('/users/profile (GET) - should return 401 without JWT', async () => {
      await request(app.getHttpServer()).get('/users/profile').expect(401);
    });
  });
});
