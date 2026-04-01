import type { PaginationModel } from '../types';

export interface FooterState {
  rangePaginationModel?: PaginationModel;
  rangeRowCount?: number;
}

interface ResolveFooterStateParams {
  paginationModel: PaginationModel;
  localRowCount: number;
  localSearchActive: boolean;
  infinite?: boolean;
}

export function resolveFooterState(
  params: ResolveFooterStateParams
): FooterState {
  if (!params.localSearchActive) {
    return {};
  }

  return {
    rangePaginationModel: params.infinite
      ? undefined
      : {
          page: 0,
          pageSize: params.paginationModel.pageSize,
        },
    rangeRowCount: params.localRowCount,
  };
}
