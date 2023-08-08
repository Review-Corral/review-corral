import { AxiomAPIRequest, withAxiom } from "next-axiom";
import { NextResponse } from "next/server";

export const GET = withAxiom(async (req: AxiomAPIRequest) => {
  return NextResponse.json({ data: "Operational" }, { status: 200 });
});
