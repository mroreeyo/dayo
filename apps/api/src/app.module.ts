import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { CalendarsModule } from './modules/calendars/calendars.module';
import { MembersModule } from './modules/members/members.module';
import { InvitesModule } from './modules/invites/invites.module';
import { EventsModule } from './modules/events/events.module';
import { SyncModule } from './modules/sync/sync.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { QueuesModule } from './modules/queues/queues.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AuditModule,
    RealtimeModule,
    CalendarsModule,
    MembersModule,
    InvitesModule,
    EventsModule,
    SyncModule,
    QueuesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
