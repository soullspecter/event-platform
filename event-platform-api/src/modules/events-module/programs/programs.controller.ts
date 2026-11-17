import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

import { SaveProgramDto } from './dto/save-program.dto';
import { ProgramsService } from './programs.service';

@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ProgramsController {
    constructor(private readonly programsService: ProgramsService) {}

    @Post('event/:eventId')
    create(@Param('eventId', ParseIntPipe) eventId: number, @Body() dto: SaveProgramDto) {
        return this.programsService.create(eventId, dto);
    }

    @Get('event/:eventId')
    findAllByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
        return this.programsService.findAllByEvent(eventId);
    }

    @Get(':programId')
    findOne(@Param('programId', ParseIntPipe) programId: number) {
        return this.programsService.findOne(programId);
    }

    @Patch(':programId')
    update(@Param('programId', ParseIntPipe) programId: number, @Body() dto: SaveProgramDto) {
        return this.programsService.update(programId, dto);
    }

    @Delete(':programId')
    remove(@Param('programId', ParseIntPipe) programId: number) {
        return this.programsService.remove(programId);
    }
}
