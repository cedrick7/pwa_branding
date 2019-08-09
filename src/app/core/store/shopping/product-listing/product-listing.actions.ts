import { Action } from '@ngrx/store';

import { ProductListingID, ProductListingType } from 'ish-core/models/product-listing/product-listing.model';
import { ViewType } from 'ish-core/models/viewtype/viewtype.types';

export enum ProductListingActionTypes {
  SetProductListingPages = '[ProductListing] Set Product Listing Pages',
  LoadMoreProducts = '[ProductListing] Load More Products',
  SetProductListingPageSize = '[ProductListing] Set Product Listing Page Size',
  SetViewType = '[ProductListing] Set View Type',
}

export class SetProductListingPages implements Action {
  readonly type = ProductListingActionTypes.SetProductListingPages;
  constructor(public payload: ProductListingType) {}
}

export class SetProductListingPageSize implements Action {
  readonly type = ProductListingActionTypes.SetProductListingPageSize;
  constructor(public payload: { itemsPerPage: number }) {}
}

export class LoadMoreProducts implements Action {
  readonly type = ProductListingActionTypes.LoadMoreProducts;
  constructor(public payload: { id: ProductListingID; page?: number }) {}
}

export class SetViewType implements Action {
  readonly type = ProductListingActionTypes.SetViewType;
  constructor(public payload: { viewType: ViewType }) {}
}

export type ProductListingAction = SetProductListingPages | LoadMoreProducts | SetProductListingPageSize | SetViewType;
