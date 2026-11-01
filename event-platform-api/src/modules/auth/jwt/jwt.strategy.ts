import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { User } from '../../../models/users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: { sub: number; email: string }) {
        if (!Number.isInteger(payload.sub) || payload.sub <= 0) {
            throw new UnauthorizedException();
        }

        const user = await this.usersRepository.findOne({
            where: { userId: payload.sub },
            relations: {
                role: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Пользователь не найден');
        }

        return {
            userId: user.userId,
            email: user.email,
            roles: user.role ? [user.role.roleName] : [],
        };
    }
}
