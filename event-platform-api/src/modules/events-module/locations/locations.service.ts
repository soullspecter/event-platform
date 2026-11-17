import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';

import { LocationPlace } from '../location-places/entity/location-place.entity';
import { SaveLocationDto } from './dto/save-location.dto';
import { Location } from './entity/location.entity';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,
        @InjectRepository(LocationPlace)
        private readonly placesRepository: Repository<LocationPlace>,
    ) {}

    async create(dto: SaveLocationDto) {
        const name = this.cleanText(dto.name);
        const address = this.cleanText(dto.address);

        if (!name && !address) {
            throw new BadRequestException('Заполните хотя бы одно поле: название или адрес');
        }

        const existing = await this.findByContent({ name, address });
        if (existing) return existing;

        try {
            return await this.locationsRepository.save(this.locationsRepository.create({ name, address }));
        } catch (error) {
            if (this.isUniqueViolation(error)) {
                const retry = await this.findByContent({ name, address });
                if (retry) return retry;
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
        if (!location) throw new NotFoundException('Физическое место не найдено');
        return location;
    }

    async update(locationId: number, dto: SaveLocationDto) {
        const location = await this.findOne(locationId);
        if (dto.name !== undefined) location.name = this.cleanText(dto.name);
        if (dto.address !== undefined) location.address = this.cleanText(dto.address);

        try {
            return await this.locationsRepository.save(location);
        } catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new ConflictException('Такая физическая локация уже существует');
            }
            throw error;
        }
    }

    async remove(locationId: number) {
        const location = await this.findOne(locationId);
        try {
            await this.placesRepository.delete({ locationId });
            await this.locationsRepository.remove(location);
        } catch (error) {
            if (this.isForeignKeyViolation(error)) {
                throw new ConflictException('Нельзя удалить локацию: она используется в мероприятиях');
            }
            throw error;
        }
        return { message: 'Физическое место и его площадки удалены' };
    }

    /** Находит существующую локацию по name+address или создаёт новую. */
    async findOrCreate(manager: EntityManager, data: { name: string | null; address: string | null }): Promise<Location> {
        const repo = manager.getRepository(Location);
        const existing = await repo
            .createQueryBuilder('location')
            .where("LOWER(TRIM(COALESCE(location.name, ''))) = LOWER(TRIM(COALESCE(:name, '')))", { name: data.name })
            .andWhere("LOWER(TRIM(COALESCE(location.address, ''))) = LOWER(TRIM(COALESCE(:address, '')))", {
                address: data.address,
            })
            .getOne();
        if (existing) return existing;

        return repo.save(repo.create({ name: data.name, address: data.address }));
    }

    private async findByContent(data: { name: string | null; address: string | null }): Promise<Location | null> {
        return this.locationsRepository
            .createQueryBuilder('location')
            .where("LOWER(TRIM(COALESCE(location.name, ''))) = LOWER(TRIM(COALESCE(:name, '')))", { name: data.name })
            .andWhere("LOWER(TRIM(COALESCE(location.address, ''))) = LOWER(TRIM(COALESCE(:address, '')))", {
                address: data.address,
            })
            .getOne();
    }

    private isUniqueViolation(error: unknown): boolean {
        return error instanceof QueryFailedError && (error.driverError as { code?: string })?.code === '23505';
    }

    private isForeignKeyViolation(error: unknown): boolean {
        return error instanceof QueryFailedError && (error.driverError as { code?: string })?.code === '23503';
    }

    private cleanText(value: string | null | undefined): string | null {
        if (value == null) return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
}
