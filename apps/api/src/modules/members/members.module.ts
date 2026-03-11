import { Module } from "@nestjs/common";
import { MembersController } from "./members.controller";
import { MembersService } from "./members.service";
import { CalendarsModule } from "../calendars/calendars.module";
import { AuditModule } from "../audit/audit.module";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [CalendarsModule, AuditModule, RealtimeModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
