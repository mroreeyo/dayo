import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { CalendarsModule } from '../calendars/calendars.module';

@Module({
  imports: [CalendarsModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
