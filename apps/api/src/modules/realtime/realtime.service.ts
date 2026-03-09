import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { RtEvent, RtPayload } from '../../libs/realtime/events';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  constructor(private readonly prisma: PrismaService) {}

  bindServer(server: Server): void {
    this.server = server;
  }

  async joinCalendarRoom(
    client: Socket,
    userId: string,
    calendarId: string,
  ): Promise<void> {
    const member = await this.prisma.calendarMember.findUnique({
      where: { calendarId_userId: { calendarId, userId } },
    });

    if (!member) {
      throw new WsException('Not a member of this calendar');
    }

    await client.join(`calendar:${calendarId}`);
  }

  broadcast(calendarId: string, event: RtEvent, payload: RtPayload): void {
    if (!this.server) return;
    this.server.to(`calendar:${calendarId}`).emit(event, payload);
  }

  broadcastToUser(userId: string, event: RtEvent, payload: RtPayload): void {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
