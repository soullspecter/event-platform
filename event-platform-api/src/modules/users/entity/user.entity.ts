import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn({ name: 'user_id', type: 'integer' })
    userId: number;

    @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
    passwordHash: string;

    @Column({ name: 'first_name', type: 'varchar', length: 100 })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 100 })
    lastName: string;

    @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
    middleName: string | null;

    @Column({ name: 'birth_date', type: 'date' })
    birthDate: string;

    @Column({ name: 'role_id', type: 'smallint' })
    roleId: number;

    @ManyToOne(() => Role, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'role_id', referencedColumnName: 'roleId' })
    role: Role;
}
