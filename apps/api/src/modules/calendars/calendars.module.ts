import { Module } from '@nestjs/common';
import { CalendarsController } from './calendars.controller';
import { CalendarsService } from './calendars.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';

@Module({
  controllers: [CalendarsController],
  providers: [CalendarsService, CalendarPolicy],
  exports: [CalendarPolicy],
})
export class CalendarsModule {}
