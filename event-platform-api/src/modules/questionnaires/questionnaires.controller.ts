import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { QuestionnairesService } from './questionnaires.service';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

interface AuthenticatedFastifyRequest extends FastifyRequest {
    user: {
        userId: number;
    };
}

@Controller('questionnaires')
@UseGuards(JwtAuthGuard)
export class QuestionnairesController {
    constructor(private readonly questionnairesService: QuestionnairesService) {}

    // Получение всех анкет мероприятия для администратора
    @Get('event/:eventId')
    @UseGuards(RolesGuard)
    @Roles('admin')
    findForEvent(@Param('eventId', ParseIntPipe) eventId: number) {
        return this.questionnairesService.findForEvent(eventId);
    }

    // Получение доступных анкет для участника
    @Get('available/:eventId')
    findAvailable(@Param('eventId', ParseIntPipe) eventId: number, @Req() req: AuthenticatedFastifyRequest) {
        return this.questionnairesService.findAvailableForUser(eventId, req.user.userId);
    }

    // Отправка ответов на анкету
    @Post(':id/submit')
    submit(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedFastifyRequest, @Body() dto: SubmitQuestionnaireDto) {
        return this.questionnairesService.submit(id, req.user.userId, dto);
    }
}
