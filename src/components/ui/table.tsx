/* eslint-disable react/prop-types */
"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  (props: React.HTMLAttributes<HTMLTableElement>, ref) => {
    const { className, ...rest } = props;

    return (
      <div className="relative w-full overflow-auto">
        <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...rest} />
      </div>
    );
  }
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  (props: React.HTMLAttributes<HTMLTableSectionElement>, ref) => {
    const { className, ...rest } = props;
    return <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...rest} />;
  }
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  (props: React.HTMLAttributes<HTMLTableSectionElement>, ref) => {
    const { className, ...rest } = props;
    return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...rest} />;
  }
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  (props: React.HTMLAttributes<HTMLTableSectionElement>, ref) => {
    const { className, ...rest } = props;
    return (
      <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...rest} />
    );
  }
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  (props: React.HTMLAttributes<HTMLTableRowElement>, ref) => {
    const { className, ...rest } = props;
    return (
      <tr
        ref={ref}
        className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
        {...rest}
      />
    );
  }
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  (props: React.ThHTMLAttributes<HTMLTableCellElement>, ref) => {
    const { className, ...rest } = props;
    return (
      <th
        ref={ref}
        className={cn(
          "h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground first:pl-6 last:pr-6",
          "[&:has([role=checkbox])]:pr-0",
          className
        )}
        {...rest}
      />
    );
  }
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  (props: React.TdHTMLAttributes<HTMLTableCellElement>, ref) => {
    const { className, ...rest } = props;
    return (
      <td
        ref={ref}
        className={cn("p-4 align-middle first:pl-6 last:pr-6 [&:has([role=checkbox])]:pr-0", className)}
        {...rest}
      />
    );
  }
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  (props: React.HTMLAttributes<HTMLTableCaptionElement>, ref) => {
    const { className, ...rest } = props;
    return <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...rest} />;
  }
);
TableCaption.displayName = "TableCaption";

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
