import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { GoogleProfile } from "../../common/auth/google.strategy";

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue("mock-token"),
  verify: jest.fn(),
};

const googleProfile: GoogleProfile = {
  googleSub: "google-sub-123",
  email: "alice@gmail.com",
  nickname: "Alice",
  avatarUrl: "https://lh3.googleusercontent.com/photo.jpg",
};

describe("AuthService.googleLogin", () => {
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

  it("logs in existing user found by googleSub", async () => {
    mockPrisma.user.findUnique.mockImplementation(
      (args: { where: { googleSub?: string; email?: string } }) => {
        if (args.where.googleSub === "google-sub-123") {
          return Promise.resolve({
            id: "uuid-existing",
            email: "alice@gmail.com",
            nickname: "Alice",
            googleSub: "google-sub-123",
          });
        }
        return Promise.resolve(null);
      },
    );

    const result = await service.googleLogin(googleProfile);

    expect(result.tokens.accessToken).toBe("mock-token");
    expect(result.tokens.refreshToken).toBe("mock-token");
    expect(result.user.id).toBe("uuid-existing");
    expect(result.user.email).toBe("alice@gmail.com");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("links google ID to existing user found by email", async () => {
    mockPrisma.user.findUnique.mockImplementation(
      (args: { where: { googleSub?: string; email?: string } }) => {
        if (args.where.googleSub) return Promise.resolve(null);
        if (args.where.email === "alice@gmail.com") {
          return Promise.resolve({
            id: "uuid-email-user",
            email: "alice@gmail.com",
            nickname: "Alice",
            googleSub: null,
          });
        }
        return Promise.resolve(null);
      },
    );
    mockPrisma.user.update.mockResolvedValue({
      id: "uuid-email-user",
      email: "alice@gmail.com",
      nickname: "Alice",
      googleSub: "google-sub-123",
    });

    const result = await service.googleLogin(googleProfile);

    expect(result.user.id).toBe("uuid-email-user");
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "uuid-email-user" },
      data: { googleSub: "google-sub-123" },
    });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("does not create duplicate user when email already exists", async () => {
    mockPrisma.user.findUnique.mockImplementation(
      (args: { where: { googleSub?: string; email?: string } }) => {
        if (args.where.googleSub) return Promise.resolve(null);
        if (args.where.email === "alice@gmail.com") {
          return Promise.resolve({
            id: "uuid-email-user",
            email: "alice@gmail.com",
            nickname: "Alice",
            googleSub: null,
          });
        }
        return Promise.resolve(null);
      },
    );
    mockPrisma.user.update.mockResolvedValue({
      id: "uuid-email-user",
      email: "alice@gmail.com",
      nickname: "Alice",
      googleSub: "google-sub-123",
    });

    await service.googleLogin(googleProfile);

    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("creates new user when no match by googleSub or email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "uuid-new",
      email: "alice@gmail.com",
      nickname: "Alice",
      googleSub: "google-sub-123",
      avatarUrl: "https://lh3.googleusercontent.com/photo.jpg",
    });

    const result = await service.googleLogin(googleProfile);

    expect(result.user.id).toBe("uuid-new");
    expect(result.tokens.accessToken).toBe("mock-token");
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "alice@gmail.com",
        nickname: "Alice",
        googleSub: "google-sub-123",
        avatarUrl: "https://lh3.googleusercontent.com/photo.jpg",
      },
    });
  });

  it("creates user without avatarUrl when profile has none", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "uuid-new",
      email: "bob@gmail.com",
      nickname: "Bob",
      googleSub: "google-sub-456",
    });

    const profileNoAvatar: GoogleProfile = {
      googleSub: "google-sub-456",
      email: "bob@gmail.com",
      nickname: "Bob",
    };

    await service.googleLogin(profileNoAvatar);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "bob@gmail.com",
        nickname: "Bob",
        googleSub: "google-sub-456",
        avatarUrl: undefined,
      },
    });
  });

  it("returns correct AuthResponseDto shape", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "uuid-new",
      email: "alice@gmail.com",
      nickname: "Alice",
      googleSub: "google-sub-123",
    });

    const result = await service.googleLogin(googleProfile);

    expect(result).toEqual({
      tokens: { accessToken: "mock-token", refreshToken: "mock-token" },
      user: { id: "uuid-new", email: "alice@gmail.com", nickname: "Alice" },
    });
  });
});
