import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/auth/types';
import { GoogleProfile } from '../../common/auth/google.strategy';
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

  async googleLogin(profile: GoogleProfile): Promise<AuthResponseDto> {
    const byGoogleSub = await this.prisma.user.findUnique({
      where: { googleSub: profile.googleSub },
    });

    if (byGoogleSub) {
      const tokens = this.issueTokens({
        sub: byGoogleSub.id,
        email: byGoogleSub.email,
      });
      return {
        tokens,
        user: {
          id: byGoogleSub.id,
          email: byGoogleSub.email,
          nickname: byGoogleSub.nickname,
        },
      };
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (byEmail) {
      const linked = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: { googleSub: profile.googleSub },
      });
      const tokens = this.issueTokens({
        sub: linked.id,
        email: linked.email,
      });
      return {
        tokens,
        user: {
          id: linked.id,
          email: linked.email,
          nickname: linked.nickname,
        },
      };
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: profile.email,
        nickname: profile.nickname,
        googleSub: profile.googleSub,
        avatarUrl: profile.avatarUrl,
      },
    });
    const tokens = this.issueTokens({
      sub: newUser.id,
      email: newUser.email,
    });
    return {
      tokens,
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
      },
    };
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
