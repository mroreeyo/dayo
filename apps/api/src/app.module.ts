import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CalendarsModule } from './modules/calendars/calendars.module';
import { MembersModule } from './modules/members/members.module';
import { InvitesModule } from './modules/invites/invites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CalendarsModule,
    MembersModule,
    InvitesModule,
  ],
})
export class AppModule {}
