import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  RegisterDeviceTokenDto,
  DeviceTokenResponseDto,
} from "./notifications.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerToken(
    userId: string,
    dto: RegisterDeviceTokenDto,
  ): Promise<DeviceTokenResponseDto> {
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token: dto.token },
    });

    if (existing) {
      const updated = await this.prisma.deviceToken.update({
        where: { id: existing.id },
        data: { userId, platform: dto.platform },
      });
      return this.toDto(updated);
    }

    const created = await this.prisma.deviceToken.create({
      data: {
        userId,
        token: dto.token,
        platform: dto.platform,
      },
    });

    return this.toDto(created);
  }

  async unregisterToken(userId: string, tokenId: string): Promise<void> {
    const token = await this.prisma.deviceToken.findFirst({
      where: { id: tokenId, userId },
    });

    if (!token) {
      throw new NotFoundException("Device token not found");
    }

    await this.prisma.deviceToken.delete({ where: { id: tokenId } });
  }

  async getTokensForUser(userId: string): Promise<DeviceTokenResponseDto[]> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return tokens.map((t) => this.toDto(t));
  }

  private toDto(t: {
    id: string;
    userId: string;
    token: string;
    platform: string;
    createdAt: Date;
  }): DeviceTokenResponseDto {
    return {
      id: t.id,
      userId: t.userId,
      token: t.token,
      platform: t.platform,
      createdAt: t.createdAt.toISOString(),
    };
  }
}
