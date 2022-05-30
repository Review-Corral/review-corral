import { Body, Controller, Get, Param } from "@nestjs/common";

@Controller("/slack")
export class SlackController {
  @Get()
  getSlackAuthEvent(@Body() body: any, @Param() params: any) {
    console.log(body);
    console.log("params: ", params);
  }
}
