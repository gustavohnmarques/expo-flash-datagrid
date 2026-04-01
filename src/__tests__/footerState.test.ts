import { resolveFooterState } from '../utils/footerState';

describe('resolveFooterState', () => {
  it('keeps the default footer behavior when local search is inactive', () => {
    expect(
      resolveFooterState({
        paginationModel: { page: 3, pageSize: 25 },
        localRowCount: 4,
        localSearchActive: false,
      })
    ).toEqual({});
  });

  it('normalizes the displayed range for paged server-side local search', () => {
    expect(
      resolveFooterState({
        paginationModel: { page: 3, pageSize: 25 },
        localRowCount: 4,
        localSearchActive: true,
      })
    ).toEqual({
      rangePaginationModel: { page: 0, pageSize: 25 },
      rangeRowCount: 4,
    });
  });

  it('keeps only the local count override for infinite loading', () => {
    expect(
      resolveFooterState({
        paginationModel: { page: 1, pageSize: 50 },
        localRowCount: 7,
        localSearchActive: true,
        infinite: true,
      })
    ).toEqual({
      rangePaginationModel: undefined,
      rangeRowCount: 7,
    });
  });
});
