import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { CalendarsModule } from './modules/calendars/calendars.module';
import { MembersModule } from './modules/members/members.module';
import { InvitesModule } from './modules/invites/invites.module';
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AuditModule,
    CalendarsModule,
    MembersModule,
    InvitesModule,
    EventsModule,
  ],
})
export class AppModule {}
