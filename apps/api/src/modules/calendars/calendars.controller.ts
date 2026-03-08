import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { RequestUser } from '../../common/auth/types';
import { OkRevisionResponseDto } from '../../common/dto/ok-revision.dto';
import { CalendarsService } from './calendars.service';
import { CalendarItemDto, CreateCalendarDto, ListCalendarsResponseDto, UpdateCalendarDto } from './calendars.dto';

@ApiTags('Calendars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/calendars')
export class CalendarsController {
  constructor(private readonly calendars: CalendarsService) {}

  @ApiOperation({ summary: 'List calendars I belong to' })
  @ApiOkResponse({ type: ListCalendarsResponseDto })
  @Get()
  listMyCalendars(@CurrentUser() user: RequestUser) {
    return this.calendars.listMyCalendars(user.id);
  }

  @ApiOperation({ summary: 'Create a calendar (creator becomes OWNER)' })
  @ApiCreatedResponse({ type: CalendarItemDto })
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCalendarDto) {
    return this.calendars.createCalendar(user.id, dto);
  }

  @ApiOperation({ summary: 'Update a calendar (ADMIN+)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CalendarItemDto })
  @Patch('/:id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') calendarId: string,
    @Body() dto: UpdateCalendarDto,
  ) {
    return this.calendars.updateCalendar(user.id, calendarId, dto);
  }

  @ApiOperation({ summary: 'Delete a calendar (OWNER)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OkRevisionResponseDto })
  @Delete('/:id')
  remove(@CurrentUser() user: RequestUser, @Param('id') calendarId: string) {
    return this.calendars.deleteCalendar(user.id, calendarId);
  }
}
