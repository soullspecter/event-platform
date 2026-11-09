import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

import { ProgramsService } from './programs.service';
import { SaveProgramDto } from './dto/save-program.dto';

@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ProgramsController {
    constructor(private readonly programsService: ProgramsService) {}

    @Post()
    create(@Body() dto: SaveProgramDto) {
        return this.programsService.create(dto);
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
