import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PaginatedResult } from "@/lib/pagination";

type SearchParamsInput = Record<string, string | string[] | undefined>;

function buildHref({
  pathname,
  searchParams,
  pageParamName,
  page,
}: {
  pathname: string;
  searchParams: SearchParamsInput;
  pageParamName: string;
  page: number;
}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === pageParamName || value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, value);
  }

  if (page > 1) {
    params.set(pageParamName, String(page));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getPageWindow(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);

  if (page <= 2) {
    pages.add(2);
    pages.add(3);
  }

  if (page >= totalPages - 1) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  return Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
}

export function TablePagination({
  pagination,
  pathname,
  searchParams = {},
  pageParamName = "page",
}: {
  pagination: PaginatedResult<unknown>;
  pathname: string;
  searchParams?: SearchParamsInput;
  pageParamName?: string;
}) {
  if (pagination.totalCount === 0) {
    return null;
  }

  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(
    pagination.totalCount,
    pagination.page * pagination.pageSize,
  );
  const pages = getPageWindow(pagination.page, pagination.totalPages);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {start}-{end} of {pagination.totalCount}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {pagination.page > 1 ? (
          <Button asChild size="sm" variant="outline">
            <Link
              href={buildHref({
                pathname,
                searchParams,
                pageParamName,
                page: pagination.page - 1,
              })}
            >
              Previous
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            Previous
          </Button>
        )}

        {pages.map((pageNumber, index) => {
          const previousPage = pages[index - 1];
          const showGap = previousPage != null && pageNumber - previousPage > 1;

          return (
            <div key={pageNumber} className="flex items-center gap-2">
              {showGap ? (
                <span className="px-1 text-sm text-muted-foreground">...</span>
              ) : null}
              {pageNumber === pagination.page ? (
                <Button size="sm" variant="default" disabled>
                  {pageNumber}
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={buildHref({
                      pathname,
                      searchParams,
                      pageParamName,
                      page: pageNumber,
                    })}
                  >
                    {pageNumber}
                  </Link>
                </Button>
              )}
            </div>
          );
        })}

        {pagination.page < pagination.totalPages ? (
          <Button asChild size="sm" variant="outline">
            <Link
              href={buildHref({
                pathname,
                searchParams,
                pageParamName,
                page: pagination.page + 1,
              })}
            >
              Next
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
