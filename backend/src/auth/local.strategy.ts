import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { SupabaseAuthStrategy, SupabaseAuthUser } from "nestjs-supabase-auth";
import { ExtractJwt } from "passport-jwt";

@Injectable()
export class SupabaseStrategy extends PassportStrategy(
  SupabaseAuthStrategy,
  "supabase",
) {
  public constructor() {
    super({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      supabaseOptions: {},
      supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: SupabaseAuthUser): Promise<any> {
    console.log("Validating");
    const user = await super.validate(payload);
    console.log(user);
    return user;
  }

  authenticate(req) {
    console.log("authenticating");
    console.log(req);
    super.authenticate(req);
  }
}
