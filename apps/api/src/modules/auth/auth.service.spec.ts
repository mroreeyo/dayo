import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue("mock-token"),
  verify: jest.fn(),
};

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe("register", () => {
    const dto = {
      email: "a@b.com",
      password: "password123",
      nickname: "Alice",
    };

    it("creates user and returns tokens", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "uuid-1",
        email: dto.email,
        nickname: dto.nickname,
      });

      const result = await service.register(dto);

      expect(result.tokens.accessToken).toBe("mock-token");
      expect(result.tokens.refreshToken).toBe("mock-token");
      expect(result.user.email).toBe(dto.email);
      expect(result.user.nickname).toBe(dto.nickname);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email,
          nickname: dto.nickname,
          passwordHash: expect.any(String),
        }),
      });
    });

    it("hashes the password with bcrypt", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "uuid-1",
        email: dto.email,
        nickname: dto.nickname,
      });

      await service.register(dto);

      const createdData = mockPrisma.user.create.mock.calls[0][0].data;
      const isHashed = await bcrypt.compare(
        dto.password,
        createdData.passwordHash,
      );
      expect(isHashed).toBe(true);
    });

    it("throws ConflictException if email exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "existing" });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe("login", () => {
    const dto = { email: "a@b.com", password: "password123" };

    it("returns tokens for valid credentials", async () => {
      const hash = await bcrypt.hash(dto.password, 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "uuid-1",
        email: dto.email,
        nickname: "Alice",
        passwordHash: hash,
      });

      const result = await service.login(dto);

      expect(result.tokens.accessToken).toBe("mock-token");
      expect(result.user.email).toBe(dto.email);
    });

    it("throws UnauthorizedException for wrong password", async () => {
      const hash = await bcrypt.hash("different", 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "uuid-1",
        email: dto.email,
        passwordHash: hash,
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException for user without password (social-only)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "uuid-1",
        email: dto.email,
        passwordHash: null,
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("refresh", () => {
    it("returns new access token for valid refresh token", async () => {
      mockJwt.verify.mockReturnValue({ sub: "uuid-1", email: "a@b.com" });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "uuid-1",
        email: "a@b.com",
      });

      const result = await service.refresh("valid-refresh-token");

      expect(result.accessToken).toBe("mock-token");
      expect(mockJwt.verify).toHaveBeenCalledWith("valid-refresh-token");
    });

    it("throws UnauthorizedException for invalid refresh token", async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error("invalid");
      });

      await expect(service.refresh("bad-token")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("throws UnauthorizedException if user no longer exists", async () => {
      mockJwt.verify.mockReturnValue({ sub: "uuid-gone", email: "a@b.com" });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh("orphan-token")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
