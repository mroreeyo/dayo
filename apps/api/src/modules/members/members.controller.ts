import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { RequestUser } from '../../common/auth/types';
import { OkRevisionResponseDto } from '../../common/dto/ok-revision.dto';
import { MembersService } from './members.service';
import { ListMembersResponseDto, MemberDto, UpdateMemberRoleDto } from './members.dto';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/calendars/:id/members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @ApiOperation({ summary: 'List members of a calendar' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ListMembersResponseDto })
  @Get()
  listMembers(
    @CurrentUser() user: RequestUser,
    @Param('id') calendarId: string,
  ) {
    return this.members.listMembers(user.id, calendarId);
  }

  @ApiOperation({ summary: 'Update member role (ADMIN+)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: MemberDto })
  @Patch('/:userId')
  updateRole(
    @CurrentUser() user: RequestUser,
    @Param('id') calendarId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.members.updateRole(user.id, calendarId, targetUserId, dto);
  }

  @ApiOperation({ summary: 'Remove member (ADMIN+; self-leave allowed)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: OkRevisionResponseDto })
  @Delete('/:userId')
  removeMember(
    @CurrentUser() user: RequestUser,
    @Param('id') calendarId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.members.removeMember(user.id, calendarId, targetUserId);
  }
}
