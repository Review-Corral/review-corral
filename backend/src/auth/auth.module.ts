import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { PrismaService } from "src/prisma/prisma.service";
import { UsersService } from "src/users/users.service";
import { AuthService } from "./auth.service";
import { SupabaseStrategy } from "./local.strategy";

@Module({
  imports: [PassportModule],
  providers: [UsersService, AuthService, SupabaseStrategy, PrismaService],
  exports: [AuthService, SupabaseStrategy],
})
export class AuthModule {}
