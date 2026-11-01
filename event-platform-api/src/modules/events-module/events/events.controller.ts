import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { EventsService } from './events.service';
import { SaveEventDto } from './dto/save-event.dto';

import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

type AuthenticatedRequest = FastifyRequest & {
    user: {
        userId: number;
        email: string;
        roles: string[];
    };
};

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    // Создание мероприятия — только администратор.
    @Post('drafts')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    createDraft(@Req() req: AuthenticatedRequest, @Body() dto: SaveEventDto) {
        return this.eventsService.createDraft(req.user.userId, dto);
    }

    @Post(':id/publish')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    publish(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.publish(id);
    }

    // Изменение мероприятия — только администратор.
    @Patch(':id/draft')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    updateDraft(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveEventDto) {
        return this.eventsService.updateEvent(id, dto);
    }

    // Список собственных мероприятий пользователя.
    @Get('mine')
    @UseGuards(JwtAuthGuard)
    findMine(@Req() req: AuthenticatedRequest) {
        return this.eventsService.findMine(req.user.userId);
    }

    // Получение мероприятия для административного редактирования.
    @Get(':id/manage')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    findForManagement(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.findForManagement(id);
    }

    // Список опубликованных мероприятий.
    @Get()
    findPublished() {
        return this.eventsService.findPublished();
    }

    // Публичная страница опубликованного мероприятия.
    @Get(':id')
    findPublishedById(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.findPublishedById(id);
    }

    // Удаление мероприятия — только администратор.
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.remove(id);
    }

    // Список черновиков для администратора.
    @Get('drafts')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    findDrafts() {
        return this.eventsService.findDrafts();
    }
}
