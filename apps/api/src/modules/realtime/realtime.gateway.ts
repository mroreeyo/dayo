import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  WsException,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RealtimeService } from "./realtime.service";
import { verifyWsToken, WsUser } from "./realtime.ws-guard";

@WebSocketGateway({
  namespace: "/rt",
  cors: { origin: process.env.CORS_ORIGINS?.split(",") ?? true },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(private readonly realtime: RealtimeService) {}

  afterInit(server: Server): void {
    this.realtime.bindServer(server);
  }

  async handleConnection(client: Socket): Promise<void> {
    const user = verifyWsToken(client);

    if (!user) {
      client.disconnect(true);
      return;
    }

    client.data.user = user;
    await client.join(`user:${user.id}`);
  }

  @SubscribeMessage("calendar.join")
  async joinCalendar(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { calendarId: string },
  ): Promise<{ ok: boolean }> {
    const user = client.data.user as WsUser | undefined;
    if (!user) {
      throw new WsException("Unauthorized");
    }

    await this.realtime.joinCalendarRoom(client, user.id, body.calendarId);
    return { ok: true };
  }

  @SubscribeMessage("calendar.leave")
  async leaveCalendar(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { calendarId: string },
  ): Promise<{ ok: boolean }> {
    await client.leave(`calendar:${body.calendarId}`);
    return { ok: true };
  }
}
