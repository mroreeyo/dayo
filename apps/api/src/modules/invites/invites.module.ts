import { Module } from '@nestjs/common';
import { CalendarsModule } from '../calendars/calendars.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [CalendarsModule],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
