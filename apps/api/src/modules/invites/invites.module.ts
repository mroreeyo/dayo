import { Module } from '@nestjs/common';
import { CalendarsModule } from '../calendars/calendars.module';
import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [CalendarsModule, AuditModule, RealtimeModule],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
