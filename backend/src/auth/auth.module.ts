import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { SupabaseStrategy } from "./local.strategy";

@Module({
  imports: [PassportModule],
  providers: [AuthService, SupabaseStrategy],
  exports: [AuthService, SupabaseStrategy],
})
export class AuthModule {}
