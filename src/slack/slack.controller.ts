import { Body, Controller, Get, Query } from "@nestjs/common";

@Controller("/slack")
export class SlackController {
  @Get()
  getSlackAuthEvent(
    @Body() body: any,
    @Query() query: { name: string; state?: string },
  ) {
    console.log(body);
    console.log("query: ", query);
  }
}
