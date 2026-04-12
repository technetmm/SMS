export const DEFAULT_TABLE_PAGE_SIZE = 10;

export type PaginationArgs = {
  skip: number;
  take: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function parsePageParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

export function buildPaginatedResult<T>({
  items,
  page,
  pageSize,
  totalCount,
}: {
  items: T[];
  page: number;
  pageSize?: number;
  totalCount: number;
}): PaginatedResult<T> {
  const resolvedPageSize = pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalCount / resolvedPageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  return {
    items,
    page: currentPage,
    pageSize: resolvedPageSize,
    totalCount,
    totalPages,
  };
}

export async function paginateQuery<T>({
  page,
  pageSize,
  count,
  query,
}: {
  page: number;
  pageSize?: number;
  count: () => Promise<number>;
  query: (args: PaginationArgs) => Promise<T[]>;
}): Promise<PaginatedResult<T>> {
  const resolvedPageSize = pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const totalCount = await count();
  const totalPages = Math.max(1, Math.ceil(totalCount / resolvedPageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  if (totalCount === 0) {
    return {
      items: [],
      page: 1,
      pageSize: resolvedPageSize,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const items = await query({
    skip: (currentPage - 1) * resolvedPageSize,
    take: resolvedPageSize,
  });

  return {
    items,
    page: currentPage,
    pageSize: resolvedPageSize,
    totalCount,
    totalPages,
  };
}
