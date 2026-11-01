import {
    IsDateString,
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password: string;

    @IsString()
    @MaxLength(100)
    firstName: string;

    @IsString()
    @MaxLength(100)
    lastName: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    middleName?: string;

    @IsDateString()
    birthDate: string;
}
