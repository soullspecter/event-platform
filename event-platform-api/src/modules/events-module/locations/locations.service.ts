import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Location } from './entity/location.entity';
import { SaveLocationDto } from './dto/save-location.dto';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,
    ) {}

    async create(dto: SaveLocationDto) {
        const name = dto.name?.trim() || null;
        const address = dto.address?.trim() || null;

        if (!name && !address) {
            throw new BadRequestException('Заполните хотя бы одно поле: название или адрес');
        }

        const existing = await this.findByContent({ name, address });

        if (existing) {
            return existing;
        }

        try {
            const location = this.locationsRepository.create({
                name,
                address,
            });

            return await this.locationsRepository.save(location);
        } catch (error) {
            if (error instanceof QueryFailedError && (error.driverError as { code?: string })?.code === '23505') {
                const retry = await this.findByContent({ name, address });
                if (retry) {
                    return retry;
                }
            }
            throw error;
        }
    }

    async findAll() {
        return this.locationsRepository.find({
            relations: { places: true },
            order: { locationId: 'DESC' },
        });
    }

    async findOne(locationId: number) {
        const location = await this.locationsRepository.findOne({
            where: { locationId },
            relations: { places: true },
        });

        if (!location) {
            throw new NotFoundException('Физическое место не найдено');
        }

        return location;
    }

    async update(locationId: number, dto: SaveLocationDto) {
        const location = await this.findOne(locationId);

        if (dto.name !== undefined) {
            location.name = dto.name?.trim() || null;
        }

        if (dto.address !== undefined) {
            location.address = dto.address?.trim() || null;
        }

        try {
            return await this.locationsRepository.save(location);
        } catch (error) {
            if (error instanceof QueryFailedError && (error.driverError as { code?: string })?.code === '23505') {
                throw new ConflictException('Такая физическая локация уже существует');
            }

            throw error;
        }
    }

    async remove(locationId: number) {
        const location = await this.findOne(locationId);

        try {
            await this.locationsRepository.remove(location);
        } catch (error) {
            if (error instanceof QueryFailedError && (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23503') {
                throw new ConflictException('Нельзя удалить физическое место, пока оно используется площадками мероприятий');
            }
            throw error;
        }

        return { message: 'Физическое место удалено' };
    }

    private async findByContent(data: { name: string | null; address: string | null }): Promise<Location | null> {
        return this.locationsRepository
            .createQueryBuilder('location')
            .where("LOWER(TRIM(COALESCE(location.name, ''))) = LOWER(TRIM(COALESCE(:name, '')))", {
                name: data.name,
            })
            .andWhere("LOWER(TRIM(COALESCE(location.address, ''))) = LOWER(TRIM(COALESCE(:address, '')))", {
                address: data.address,
            })
            .getOne();
    }
}
