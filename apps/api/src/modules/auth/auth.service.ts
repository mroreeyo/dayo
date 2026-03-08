import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/auth/types';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        nickname: dto.nickname,
        passwordHash,
      },
    });

    const tokens = this.issueTokens({ sub: user.id, email: user.email });

    return {
      tokens,
      user: { id: user.id, email: user.email, nickname: user.nickname },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.issueTokens({ sub: user.id, email: user.email });

    return {
      tokens,
      user: { id: user.id, email: user.email, nickname: user.nickname },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email } satisfies JwtPayload,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    return { accessToken };
  }

  private issueTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.jwt.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
    return { accessToken, refreshToken };
  }
}
