import { Body, Controller, Get } from "@nestjs/common";

@Controller("/slack")
export class SlackController {
  @Get()
  getSlackAuthEvent(@Body() body: any) {
    console.log(body);
  }
}
