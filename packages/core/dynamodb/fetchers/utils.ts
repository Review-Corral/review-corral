import {
  AnyColumn,
  GetColumnData,
  Placeholder,
  SQLWrapper,
  TableConfig,
  and,
  eq,
  getTableColumns,
  or,
} from "drizzle-orm";
import { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { HttpError } from "../../utils/errors/Errors";

type ColumnComparison<TColumn extends AnyColumn> =
  | GetColumnData<TColumn, "raw">
  | Placeholder
  | SQLWrapper
  | AnyColumn;

export function any<TColumn extends AnyColumn>(
  left: TColumn,
  values: ColumnComparison<TColumn>[]
) {
  return or(...values.map((v) => eq(left, v)));
}

export function all<TColumn extends AnyColumn>(
  left: TColumn,
  values: ColumnComparison<TColumn>[]
) {
  return and(...values.map((v) => eq(left, v)));
}

export function omitColumns<T extends TableConfig<AnyPgColumn>>(
  table: PgTable<T>,
  ...columnNames: (keyof T["columns"])[]
) {
  const columns = getTableColumns(table);
  for (const columnName of columnNames) delete columns[columnName];
  return columns;
}

export function takeFirst<T>(items: T[]): T | undefined {
  return items.at(0);
}

export function takeFirstOrThrow<T>(items: T[]): T {
  const item = items.at(0);
  if (!item) throw new HttpError(404, "Item not found", true);
  return item;
}
