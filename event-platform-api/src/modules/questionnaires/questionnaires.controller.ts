import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';

import { QuestionnairesService } from './questionnaires.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('questionnaires')
@UseGuards(JwtAuthGuard)
export class QuestionnairesController {
  constructor(
    private readonly questionnairesService: QuestionnairesService,
  ) {}

  // Администратор: получить анкеты мероприятия
  @Get('event/:eventId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findForEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.questionnairesService.findForEvent(eventId);
  }

  // Администратор: создать анкету
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateQuestionnaireDto) {
    return this.questionnairesService.create(dto);
  }

  // Участник: получить доступные анкеты
  @Get('available/:eventId')
  findAvailable(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: any,
  ) {
    return this.questionnairesService.findAvailableForUser(
      eventId,
      req.user.userId,
    );
  }

  // Участник: отправить ответы
  @Post(':id/submit')
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: SubmitQuestionnaireDto,
  ) {
    return this.questionnairesService.submit(
      id,
      req.user.userId,
      dto,
    );
  }
}