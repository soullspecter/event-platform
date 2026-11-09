import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entity/user.entity';

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findById(userId: number): Promise<User | null> {
        return this.usersRepository.findOne({ where: { userId } });
    }
}
