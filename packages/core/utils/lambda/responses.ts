import * as z from "zod";
import { messageDataSchema } from "./parsers";

export enum MimeType {
  JSON = "application/json",
  XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  CSV = "text/csv",
}

// Not exhaustive; can be added to as needed
export type StatusCode2XX = 200 | 201 | 202 | 204;
export type StatusCode4XX =
  | 400
  | 401
  | 403
  | 404
  | 405
  | 406
  | 408
  | 409
  | 410
  | 429;
export type StatusCode5XX = 500 | 501 | 502 | 503 | 504;
export type StatusCode = StatusCode2XX | StatusCode4XX | StatusCode5XX;

export type MessageData = z.infer<typeof messageDataSchema>;

export interface DataResponse<T> {
  meta: Metadata | null;
  data: T | null;
  errors: ResponseError[] | null;
}

export interface DataListResponse<T, TMeta = Metadata> {
  meta: TMeta | null;
  data: T[] | null;
  errors: ResponseError[] | null;
  pagination: Pagination | null;
}

export interface Metadata {
  totalCount?: number;
  [key: string]: unknown;
}

export interface Pagination {
  first: number;
  last: number | null;
  prev: number | null;
  next: number | null;
}

export interface ResponseError {
  status: string;
  code: string;
}
