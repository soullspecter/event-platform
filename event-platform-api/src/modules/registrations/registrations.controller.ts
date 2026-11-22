import { Controller, Post, Delete, Get, Param, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/jwt-payload.type';
import { RegistrationsService } from './registrations.service';
import { RegisterParamsDto } from './dto/register-params.dto';

@Controller('events/:eventId/registration')
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
    constructor(private readonly svc: RegistrationsService) {}

    @Post()
    @HttpCode(201)
    register(@Param() p: RegisterParamsDto, @CurrentUser() user: AuthUser) {
        return this.svc.register(user.userId, p.eventId);
    }

    @Delete()
    @HttpCode(204)
    async unregister(@Param() p: RegisterParamsDto, @CurrentUser() user: AuthUser) {
        await this.svc.unregister(user.userId, p.eventId);
    }

    @Get('status')
    async status(@Param() p: RegisterParamsDto, @CurrentUser() user: AuthUser) {
        const registered = await this.svc.isRegistered(user.userId, p.eventId);
        return { registered };
    }
}
