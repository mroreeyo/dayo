import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { CalendarsModule } from '../calendars/calendars.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [CalendarsModule, AuditModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
