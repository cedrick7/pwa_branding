import { createSelector } from '@ngrx/store';

import { ShoppingState, getShoppingState } from '../shopping-store';

export const getSearchState = createSelector(
  getShoppingState,
  (state: ShoppingState) => state.search
);

export const getSearchTerm = createSelector(
  getSearchState,
  state => state.searchTerm
);

export const getCurrentSearchboxId = createSelector(
  getSearchState,
  state => state.currentSearchboxId
);

export const getSuggestSearchResults = createSelector(
  getSearchState,
  state => state.suggestSearchResults
);
