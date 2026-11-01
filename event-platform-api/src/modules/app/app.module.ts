import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events-module/events/events.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres' as const,
                host: configService.getOrThrow<string>('DB_HOST'),
                port: Number(configService.get('DB_PORT') ?? 5432),
                username: configService.getOrThrow<string>('DB_USERNAME'),
                password: configService.getOrThrow<string>('DB_PASSWORD'),
                database: configService.getOrThrow<string>('DB_DATABASE'),

                ssl: {
                    rejectUnauthorized: false,
                },

                autoLoadEntities: true,
                synchronize: false,
            }),
        }),

        UsersModule,
        AuthModule,
        EventsModule,
    ],
})
export class AppModule {}
