import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();

  return (
    <div
      className={cn(
        `flex items-center py-4 px-3 space-x-2 uppercase font-semiBold ${
          canSort ? "cursor-pointer" : "cursor-default"
        }`,
        className
      )}
      onClick={() => {
        if (!canSort) return;
        switch (sorted) {
          case false:
            column.toggleSorting(false); // set to 'asc'
          case "asc":
            column.toggleSorting(true); // set to 'desc'
          case "desc":
            column.toggleSorting(undefined); // set to no sorting
        }
      }}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowDownIcon className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUpIcon className="ml-2 h-4 w-4" />
      ) : null}
    </div>
  );
}
