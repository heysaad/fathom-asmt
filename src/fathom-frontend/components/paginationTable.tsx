"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import apiClient from "@/app/lib/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "./ui/datatable";
import { ColumnDef } from "@tanstack/react-table";
import { Field, FieldLabel } from "./ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Pagination, PaginationContent, PaginationItem } from "./ui/pagination";
import { Button } from "./ui/button";
import {
  ChevronLeft,
  ChevronRight,
  SearchIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

export function PaginationTable<TData, TValue>({
  url,
  columns,
  filters,
  actions,
  headerLeft,
  initialPageSize,
}: {
  url: string;
  columns: ColumnDef<TData, TValue>[];
  filters?: any;
  actions?: React.ReactNode;
  headerLeft?: React.ReactElement;
  initialPageSize?: number;
}) {
  const {
    totalPages,
    data,
    prevPage,
    nextPage,
    hasNext,
    hasPrev,
    currentPage,
    totalRecords,
    error,
    loading,
    pageSize,
    setPageSize,
    goToPage,
    search,
    setSearch,
  } = usePagination<TData>({ url: url, filters, initialPageSize });
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handleValueChange = (cb: (value: number) => void) => {
    return (value: string) => {
      return cb(value ? parseInt(value) : 0);
    };
  };

  return (
    <div className="w-full relative">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="size-8 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-500">Error loading data</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-10 pt-28 pb-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Loading data...</p>
          </div>
        </div>
      )}
      {data && (
        <div className="relative overflow-x-auto w-full">
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-4">
            <div>{headerLeft}</div>
            <div className="flex gap-3 items-center">
              <InputGroup>
                <InputGroupInput
                  placeholder="Search.."
                  value={search}
                  onChange={(x) => setSearch(x.target.value)}
                />
                <InputGroupAddon>
                  <SearchIcon className="size-4" />
                </InputGroupAddon>
              </InputGroup>
              {actions}
            </div>
          </div>

          <DataTable columns={columns} data={data} />

          <div className="flex items-center justify-between gap-4 mt-4">
            <div className="flex items-center justify-between gap-4">
              <Field orientation="horizontal" className="w-fit">
                <FieldLabel
                  htmlFor="select-rows-per-page"
                  className="max-md:hidden"
                >
                  Per page
                </FieldLabel>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handleValueChange(setPageSize)}
                  defaultValue={pageSize.toString()}
                >
                  <SelectTrigger className="w-20" id="select-rows-per-page">
                    <SelectValue defaultValue={pageSize} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {totalRecords} records
              </div>
            </div>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      onClick={prevPage}
                      disabled={!hasPrev}
                      size="icon"
                      variant={"ghost"}
                    >
                      <ChevronLeft />
                    </Button>
                  </PaginationItem>

                  {pages.map((x, i) => (
                    <PaginationItem key={i}>
                      <Button
                        onClick={() => goToPage(x)}
                        size="icon"
                        variant={currentPage == x ? "outline" : "ghost"}
                      >
                        {x}
                      </Button>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <Button
                      onClick={nextPage}
                      disabled={!hasNext}
                      variant={"ghost"}
                    >
                      <ChevronRight />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function usePagination<T>({
  url,
  filters,
  initialPageSize = 10,
}: {
  url: string;
  filters?: any;
  initialPageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T[]>();
  const [error, setError] = useState<string>();
  const filterKey = JSON.stringify(filters ?? null);
  const debouncedSearch = useDebounce(search, 400);
  const debouncedFilterKey = useDebounce(filterKey, 400);

  // Calculate slice indices for the current page
  const { lastIndex, firstIndex } = useMemo(() => {
    const lastIndex = currentPage * pageSize;
    const firstIndex = lastIndex - pageSize;
    return { lastIndex, firstIndex };
  }, [pageSize, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedFilterKey, pageSize, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setError(undefined);
      setLoading(true);
      try {
        const response = await apiClient.post<paginationResult<T>>(url, {
          page: currentPage,
          pageSize: pageSize,
          search: debouncedSearch,
          filters:
            debouncedFilterKey === "null"
              ? undefined
              : JSON.parse(debouncedFilterKey),
        });
        const data = response.data;

        if (cancelled) {
          return;
        }

        setTotalRecords(data.total);
        setTotalPages(Math.ceil(data.total / pageSize));
        setData(data.data);
      } catch (ex) {
        if (cancelled) {
          return;
        }

        setError("Failed to load data");
      } finally {
        if (cancelled) {
          return;
        }

        setLoading(false);
      }
    };

    const timeout = window.setTimeout(loadData, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [currentPage, debouncedFilterKey, debouncedSearch, pageSize, url]);

  // Handlers to pass to the UI
  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  return {
    currentPage,
    totalPages,
    firstIndex,
    lastIndex,
    goToPage,
    nextPage,
    prevPage,
    hasNext,
    hasPrev,
    search,
    setSearch,
    setPageSize: (size: number) => {
      setPageSize(size);
    },
    pageSize,
    loading,
    data,
    error,
    totalRecords,
    setTotalRecords
  };
}

export interface paginationResult<T> {
  total: number;
  data: T[];
}
