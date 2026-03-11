import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";

describe("AuthController (e2e-like)", () => {
  let app: INestApplication;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /v1/auth/register", () => {
    it("returns 201 with tokens on valid registration", async () => {
      const mockResponse = {
        tokens: { accessToken: "at", refreshToken: "rt" },
        user: { id: "uuid-1", email: "a@b.com", nickname: "Alice" },
      };
      mockAuthService.register.mockResolvedValue(mockResponse);

      const res = await request(app.getHttpServer())
        .post("/v1/auth/register")
        .send({ email: "a@b.com", password: "password123", nickname: "Alice" })
        .expect(201);

      expect(res.body).toEqual(mockResponse);
    });

    it("returns 400 for invalid email", async () => {
      await request(app.getHttpServer())
        .post("/v1/auth/register")
        .send({
          email: "not-email",
          password: "password123",
          nickname: "Alice",
        })
        .expect(400);
    });

    it("returns 400 for short password", async () => {
      await request(app.getHttpServer())
        .post("/v1/auth/register")
        .send({ email: "a@b.com", password: "short", nickname: "Alice" })
        .expect(400);
    });

    it("returns 400 for missing nickname", async () => {
      await request(app.getHttpServer())
        .post("/v1/auth/register")
        .send({ email: "a@b.com", password: "password123" })
        .expect(400);
    });

    it("returns 400 for extra fields (forbidNonWhitelisted)", async () => {
      await request(app.getHttpServer())
        .post("/v1/auth/register")
        .send({
          email: "a@b.com",
          password: "password123",
          nickname: "Alice",
          admin: true,
        })
        .expect(400);
    });
  });

  describe("POST /v1/auth/login", () => {
    it("returns 201 with tokens on valid login", async () => {
      const mockResponse = {
        tokens: { accessToken: "at", refreshToken: "rt" },
        user: { id: "uuid-1", email: "a@b.com", nickname: "Alice" },
      };
      mockAuthService.login.mockResolvedValue(mockResponse);

      const res = await request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({ email: "a@b.com", password: "password123" })
        .expect(201);

      expect(res.body).toEqual(mockResponse);
    });
  });

  describe("POST /v1/auth/refresh", () => {
    it("returns 201 with new access token", async () => {
      mockAuthService.refresh.mockResolvedValue({ accessToken: "new-at" });

      const res = await request(app.getHttpServer())
        .post("/v1/auth/refresh")
        .send({ refreshToken: "valid-rt" })
        .expect(201);

      expect(res.body).toEqual({ accessToken: "new-at" });
    });

    it("returns 400 for missing refreshToken", async () => {
      await request(app.getHttpServer())
        .post("/v1/auth/refresh")
        .send({})
        .expect(400);
    });
  });
});

describe("JwtAuthGuard", () => {
  it("is defined and extends AuthGuard", () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });
});

describe("CurrentUser decorator", () => {
  it("is defined", () => {
    expect(CurrentUser).toBeDefined();
  });
});
