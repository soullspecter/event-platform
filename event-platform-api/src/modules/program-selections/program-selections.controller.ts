import { Controller, Get, Post, Delete, Param, ParseIntPipe, UseGuards, HttpCode } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/jwt-payload.type';

import { ProgramSelectionsService } from './program-selections.service';

@Controller('events/:eventId/selections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
export class ProgramSelectionsController {
    constructor(private readonly selectionsService: ProgramSelectionsService) {}

    @Get()
    findMine(@Param('eventId', ParseIntPipe) eventId: number, @CurrentUser() user: AuthUser) {
        return this.selectionsService.findMine(user.userId, eventId);
    }

    @Post(':scheduleItemId')
    @HttpCode(201)
    select(@Param('eventId', ParseIntPipe) eventId: number, @Param('scheduleItemId', ParseIntPipe) scheduleItemId: number, @CurrentUser() user: AuthUser) {
        return this.selectionsService.select(user.userId, eventId, scheduleItemId);
    }

    @Delete(':scheduleItemId')
    @HttpCode(204)
    async unselect(@Param('eventId', ParseIntPipe) eventId: number, @Param('scheduleItemId', ParseIntPipe) scheduleItemId: number, @CurrentUser() user: AuthUser) {
        await this.selectionsService.unselect(user.userId, eventId, scheduleItemId);
    }
}
