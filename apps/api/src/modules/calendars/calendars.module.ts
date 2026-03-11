import { Module } from "@nestjs/common";
import { CalendarsController } from "./calendars.controller";
import { CalendarsService } from "./calendars.service";
import { CalendarPolicy } from "../../libs/policies/calendar.policy";
import { AuditModule } from "../audit/audit.module";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [AuditModule, RealtimeModule],
  controllers: [CalendarsController],
  providers: [CalendarsService, CalendarPolicy],
  exports: [CalendarPolicy],
})
export class CalendarsModule {}
