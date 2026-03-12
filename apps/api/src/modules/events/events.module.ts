import { Module } from "@nestjs/common";
import { CalendarsModule } from "../calendars/calendars.module";
import { AuditModule } from "../audit/audit.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { QueuesModule } from "../queues/queues.module";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { RecurrenceService } from "./recurrence.service";

@Module({
  imports: [CalendarsModule, AuditModule, RealtimeModule, QueuesModule],
  controllers: [EventsController],
  providers: [EventsService, RecurrenceService],
  exports: [EventsService, RecurrenceService],
})
export class EventsModule {}
