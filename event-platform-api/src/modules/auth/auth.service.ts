import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../models/users/user.entity';
import { Role } from '../../models/roles/role.entity';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type PostgresError = Error & {
    code?: string;
};

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,

        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,

        private readonly jwtService: JwtService,
        private readonly dataSource: DataSource,
    ) {}

    async register(dto: RegisterDto) {
        const email = dto.email.trim().toLowerCase();

        const existingUser = await this.usersRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Пользователь с таким email уже существует');
        }

        const defaultRole = await this.rolesRepository.findOne({
            where: { roleName: 'user' },
        });

        if (!defaultRole) {
            throw new InternalServerErrorException('Роль не найдена');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        try {
            const user = await this.dataSource.transaction(async (manager) => {
                const users = manager.getRepository(User);

                const newUser = users.create({
                    email,
                    passwordHash,
                    firstName: dto.firstName.trim(),
                    lastName: dto.lastName.trim(),
                    middleName: dto.middleName?.trim() || null,
                    birthDate: dto.birthDate,
                    roleId: defaultRole.roleId,
                    role: defaultRole,
                });

                return users.save(newUser);
            });

            return this.createAuthResponse(user, [defaultRole.roleName]);
        } catch (error) {
            if (error instanceof QueryFailedError && (error.driverError as PostgresError).code === '23505') {
                throw new ConflictException('Пользователь с таким email уже существует');
            }

            throw error;
        }
    }

    async registerAdmin(dto: RegisterDto) {
        const email = dto.email.trim().toLowerCase();

        const existingUser = await this.usersRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Пользователь с таким email уже существует');
        }

        const adminRole = await this.rolesRepository.findOne({
            where: { roleName: 'admin' },
        });

        if (!adminRole) {
            throw new InternalServerErrorException('Роль admin не найдена');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        try {
            const user = await this.dataSource.transaction(async (manager) => {
                const users = manager.getRepository(User);

                const newUser = users.create({
                    email,
                    passwordHash,
                    firstName: dto.firstName.trim(),
                    lastName: dto.lastName.trim(),
                    middleName: dto.middleName?.trim() || null,
                    birthDate: dto.birthDate,
                    roleId: adminRole.roleId,
                    role: adminRole,
                });

                return users.save(newUser);
            });

            return this.createAuthResponse(user, [adminRole.roleName]);
        } catch (error) {
            if (error instanceof QueryFailedError && (error.driverError as PostgresError).code === '23505') {
                throw new ConflictException('Пользователь с таким email уже существует');
            }

            throw error;
        }
    }

    async login(dto: LoginDto) {
        const email = dto.email.trim().toLowerCase();

        const user = await this.usersRepository.createQueryBuilder('user').addSelect('user.passwordHash').leftJoinAndSelect('user.role', 'role').where('user.email = :email', { email }).getOne();

        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        return this.createAuthResponse(user, user.role ? [user.role.roleName] : []);
    }

    async getProfile(userId: number) {
        const user = await this.usersRepository.findOne({
            where: { userId },
            relations: {
                role: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Пользователь не найден');
        }

        return {
            id: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            middleName: user.middleName,
            birthDate: user.birthDate,
            roles: user.role ? [user.role.roleName] : [],
        };
    }

    private async createAuthResponse(user: User, roles: string[]) {
        const accessToken = await this.jwtService.signAsync({
            sub: user.userId,
            email: user.email,
            roles,
        });

        return {
            accessToken,
            user: {
                id: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                middleName: user.middleName,
                birthDate: user.birthDate,
                roles,
            },
        };
    }
}
