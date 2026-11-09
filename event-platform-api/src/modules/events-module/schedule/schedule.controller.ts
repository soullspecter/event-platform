import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

import { SaveScheduleItemDto } from './dto/save-schedule-item.dto';
import { ScheduleService } from './schedule.service';

@Controller('schedule/:eventId')
export class ScheduleController {
    constructor(private readonly scheduleService: ScheduleService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    create(@Param('eventId', ParseIntPipe) eventId: number, @Body() dto: SaveScheduleItemDto) {
        return this.scheduleService.create(eventId, dto);
    }

    @Get()
    findPublished(@Param('eventId', ParseIntPipe) eventId: number) {
        return this.scheduleService.findPublished(eventId);
    }

    @Get('mine')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    findMine(@Param('eventId', ParseIntPipe) eventId: number) {
        return this.scheduleService.findMine(eventId);
    }

    @Patch(':scheduleItemId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    update(@Param('eventId', ParseIntPipe) eventId: number, @Param('scheduleItemId', ParseIntPipe) scheduleItemId: number, @Body() dto: SaveScheduleItemDto) {
        return this.scheduleService.update(eventId, scheduleItemId, dto);
    }

    @Delete(':scheduleItemId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    remove(@Param('eventId', ParseIntPipe) eventId: number, @Param('scheduleItemId', ParseIntPipe) scheduleItemId: number) {
        return this.scheduleService.remove(eventId, scheduleItemId);
    }
}
