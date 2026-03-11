import { applyFilter } from './filtering';
import { applySearch } from './searching';
import { applySorting } from './sorting';
import type {
  ColumnDef,
  FilterModel,
  FilterOperatorsConfig,
  PaginationModel,
  SortModel,
} from '../types';

export interface PaginationRange {
  from: number;
  to: number;
  total: number;
}

export function paginateRows<TRow>(
  rows: TRow[],
  paginationModel: PaginationModel
): TRow[] {
  const page = Math.max(0, paginationModel.page);
  const pageSize = Math.max(1, paginationModel.pageSize);
  const start = page * pageSize;
  const end = start + pageSize;

  return rows.slice(start, end);
}

export function getPaginationRange(
  total: number,
  paginationModel: PaginationModel
): PaginationRange {
  if (total <= 0) {
    return { from: 0, to: 0, total: 0 };
  }

  const page = Math.max(0, paginationModel.page);
  const pageSize = Math.max(1, paginationModel.pageSize);
  const from = page * pageSize + 1;
  const to = Math.min(total, from + pageSize - 1);

  return { from, to, total };
}

export interface ClientPipelineParams<TRow>
  extends FilterOperatorsConfig<TRow> {
  rows: TRow[];
  columns: ColumnDef<TRow>[];
  filterModel: FilterModel;
  searchText: string;
  sortModel: SortModel;
  paginationModel: PaginationModel;
}

export interface ClientPipelineResult<TRow> {
  filteredRows: TRow[];
  searchedRows: TRow[];
  sortedRows: TRow[];
  paginatedRows: TRow[];
}

export function applyClientPipeline<TRow>(
  params: ClientPipelineParams<TRow>
): ClientPipelineResult<TRow> {
  const filteredRows = applyFilter(
    params.rows,
    params.columns,
    params.filterModel,
    params
  );
  const searchedRows = applySearch(
    filteredRows,
    params.columns,
    params.searchText
  );
  const sortedRows = applySorting(
    searchedRows,
    params.columns,
    params.sortModel
  );
  const paginatedRows = paginateRows(sortedRows, params.paginationModel);

  return {
    filteredRows,
    searchedRows,
    sortedRows,
    paginatedRows,
  };
}
