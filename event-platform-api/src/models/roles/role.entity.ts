import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'roles' })
export class Role {
    @PrimaryGeneratedColumn({
        name: 'role_id',
        type: 'smallint',
    })
    roleId: number;

    @Column({
        name: 'role_name',
        type: 'varchar',
        length: 100,
        unique: true,
        nullable: false,
    })
    roleName: string;
}
