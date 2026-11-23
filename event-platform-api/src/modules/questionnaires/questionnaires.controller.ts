import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { QuestionnairesService } from './questionnaires.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
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

    @Get('event/:eventId')
    @UseGuards(RolesGuard)
    @Roles('admin')
    findForEvent(@Param('eventId', ParseIntPipe) eventId: number) {
        return this.questionnairesService.findForEvent(eventId);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('admin')
    create(@Body() dto: CreateQuestionnaireDto) {
        return this.questionnairesService.create(dto);
    }

    @Get('available/:eventId')
    findAvailable(@Param('eventId', ParseIntPipe) eventId: number, @Req() req: AuthenticatedFastifyRequest) {
        return this.questionnairesService.findAvailableForUser(eventId, req.user.userId);
    }

    @Post(':id/submit')
    submit(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedFastifyRequest, @Body() dto: SubmitQuestionnaireDto) {
        return this.questionnairesService.submit(id, req.user.userId, dto);
    }
}
