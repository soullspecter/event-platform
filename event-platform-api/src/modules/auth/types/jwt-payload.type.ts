// auth/types/jwt-payload.type.ts
export type JwtPayload = {
    sub: number;
    email: string;
    roles: string[];
};

export type AuthUser = {
    userId: number;
    email: string;
    roles: string[];
};
