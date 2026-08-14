import { PAGINATION_DEFAULTS } from '../config/constants';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || PAGINATION_DEFAULTS.PAGE)));
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit || PAGINATION_DEFAULTS.LIMIT)))
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildSearchCondition(
  fields: string[],
  searchTerm: string | undefined,
  startParamIndex: number
): { condition: string; value: string | null; nextIndex: number } {
  if (!searchTerm || searchTerm.trim() === '') {
    return { condition: '', value: null, nextIndex: startParamIndex };
  }
  const term = `%${searchTerm.trim().toLowerCase()}%`;
  const conditions = fields.map(f => `LOWER(${f}) LIKE $${startParamIndex}`).join(' OR ');
  return {
    condition: `(${conditions})`,
    value: term,
    nextIndex: startParamIndex + 1,
  };
}

/**
 * Safely build ORDER BY clause. Only allows known column names.
 */
export function buildOrderBy(
  sortBy: string | undefined,
  sortOrder: string | undefined,
  allowedColumns: string[],
  defaultColumn = 'created_at'
): string {
  const col = allowedColumns.includes(sortBy || '') ? sortBy! : defaultColumn;
  const ord = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return `ORDER BY ${col} ${ord}`;
}
