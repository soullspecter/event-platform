import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

import { CommonScheduleService } from './common-schedule.service';
import { SaveCommonScheduleItemDto } from './dto/save-common-schedule-item.dto';

@Controller('events/:eventId/common-schedule')
export class CommonScheduleController {
    constructor(private readonly commonScheduleService: CommonScheduleService) {}

    @Get()
    findAllByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
        return this.commonScheduleService.findAllByEvent(eventId);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    create(@Param('eventId', ParseIntPipe) eventId: number, @Body() dto: SaveCommonScheduleItemDto) {
        return this.commonScheduleService.create(eventId, dto);
    }

    @Patch(':commonItemId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    update(@Param('eventId', ParseIntPipe) eventId: number, @Param('commonItemId', ParseIntPipe) commonItemId: number, @Body() dto: SaveCommonScheduleItemDto) {
        return this.commonScheduleService.update(eventId, commonItemId, dto);
    }

    @Delete(':commonItemId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    remove(@Param('eventId', ParseIntPipe) eventId: number, @Param('commonItemId', ParseIntPipe) commonItemId: number) {
        return this.commonScheduleService.remove(eventId, commonItemId);
    }
}
