import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, Store, StoreModule, combineReducers } from '@ngrx/store';
import { cold, hot } from 'jest-marbles';
import { Observable, noop, of, throwError } from 'rxjs';
import { anyString, anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';

import { BasketBaseData } from 'ish-core/models/basket/basket.interface';
import { Basket } from 'ish-core/models/basket/basket.model';
import { Customer } from 'ish-core/models/customer/customer.model';
import { HttpError } from 'ish-core/models/http-error/http-error.model';
import { LineItem } from 'ish-core/models/line-item/line-item.model';
import { Link } from 'ish-core/models/link/link.model';
import { Order } from 'ish-core/models/order/order.model';
import { Product } from 'ish-core/models/product/product.model';
import { coreReducers } from 'ish-core/store/core-store.module';
import { LoginUserSuccess, LogoutUser } from 'ish-core/store/user/user.actions';
import { BasketMockData } from 'ish-core/utils/dev/basket-mock-data';
import { AddressService } from '../../../services/address/address.service';
import { BasketService } from '../../../services/basket/basket.service';
import { OrderService } from '../../../services/order/order.service';
import { LoadProduct, LoadProductSuccess } from '../../shopping/products';
import { shoppingReducers } from '../../shopping/shopping-store.module';
import {
  DeleteCustomerAddressFail,
  DeleteCustomerAddressSuccess,
  UpdateCustomerAddressFail,
  UpdateCustomerAddressSuccess,
} from '../addresses/addresses.actions';
import { checkoutReducers } from '../checkout-store.module';

import * as basketActions from './basket.actions';
import { BasketEffects } from './basket.effects';

describe('Basket Effects', () => {
  let actions$: Observable<Action>;
  let basketServiceMock: BasketService;
  let orderServiceMock: OrderService;
  let addressServiceMock: AddressService;
  let effects: BasketEffects;
  let store$: Store<{}>;
  let location: Location;

  // tslint:disable-next-line:use-component-change-detection
  @Component({ template: 'dummy' })
  // tslint:disable-next-line:prefer-mocks-instead-of-stubs-in-tests
  class DummyComponent {}

  beforeEach(() => {
    basketServiceMock = mock(BasketService);
    orderServiceMock = mock(OrderService);
    addressServiceMock = mock(AddressService);

    TestBed.configureTestingModule({
      declarations: [DummyComponent],
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'checkout', children: [{ path: 'receipt', component: DummyComponent }] },
        ]),
        StoreModule.forRoot({
          ...coreReducers,
          shopping: combineReducers(shoppingReducers),
          checkout: combineReducers(checkoutReducers),
        }),
      ],
      providers: [
        BasketEffects,
        provideMockActions(() => actions$),
        { provide: BasketService, useFactory: () => instance(basketServiceMock) },
        { provide: OrderService, useFactory: () => instance(orderServiceMock) },
        { provide: AddressService, useFactory: () => instance(addressServiceMock) },
      ],
    });

    effects = TestBed.get(BasketEffects);
    store$ = TestBed.get(Store);
    location = TestBed.get(Location);
  });

  describe('loadBasket$', () => {
    beforeEach(() => {
      when(basketServiceMock.getBasket(anyString())).thenCall((id: string) => of({ id } as Basket));
    });

    it('should call the basketService for loadBasket', done => {
      const id = 'BID';
      const action = new basketActions.LoadBasket({ id });
      actions$ = of(action);

      effects.loadBasket$.subscribe(() => {
        verify(basketServiceMock.getBasket(id)).once();
        done();
      });
    });

    it('should map to action of type LoadBasketSuccess', () => {
      const id = 'BID';
      const action = new basketActions.LoadBasket({ id });
      const completion = new basketActions.LoadBasketSuccess({ basket: { id } as Basket });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadBasket$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type LoadBasketFail', () => {
      when(basketServiceMock.getBasket(anyString())).thenReturn(throwError({ message: 'invalid' }));
      const action = new basketActions.LoadBasket({ id: 'BID' });
      const completion = new basketActions.LoadBasketFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadBasket$).toBeObservable(expected$);
    });
  });

  describe('loadProductsForBasket$', () => {
    it('should trigger LoadProduct actions for line items if LoadBasketSuccess action triggered', () => {
      when(basketServiceMock.getBasket(anything())).thenReturn(of());

      const action = new basketActions.LoadBasketSuccess({
        basket: {
          id: 'BID',
          lineItems: [
            {
              id: 'BIID',
              name: 'NAME',
              position: 1,
              quantity: { value: 1 },
              price: undefined,
              productSKU: 'SKU',
            } as LineItem,
          ],
          payment: undefined,
        } as Basket,
      });

      const completion = new LoadProduct({ sku: 'SKU' });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadProductsForBasket$).toBeObservable(expected$);
    });
  });

  describe('createCustomerAddressForBasket$', () => {
    beforeEach(() => {
      when(addressServiceMock.createCustomerAddress('-', anything())).thenReturn(of(BasketMockData.getAddress()));

      store$.dispatch(
        new LoginUserSuccess({
          customer: {
            customerNo: '4711',
          } as Customer,
        })
      );
    });
    it('should call the addressService if user is logged in', done => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.CreateBasketAddress({ address, scope: 'invoice' });
      actions$ = of(action);

      effects.createAddressForBasket$.subscribe(() => {
        verify(addressServiceMock.createCustomerAddress('-', anything())).once();
        done();
      });
    });

    it('should map to Action createBasketAddressSuccess', () => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.CreateBasketAddress({ address, scope: 'invoice' });
      const completion = new basketActions.CreateBasketAddressSuccess({ address, scope: 'invoice' });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.createAddressForBasket$).toBeObservable(expected$);
    });
  });

  describe('createBasketAddressForBasket$', () => {
    beforeEach(() => {
      when(basketServiceMock.createBasketAddress('current', anything())).thenReturn(of(BasketMockData.getAddress()));
    });
    it('should call the basketService if user is not logged in', done => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.CreateBasketAddress({ address, scope: 'invoice' });
      actions$ = of(action);

      effects.createAddressForBasket$.subscribe(() => {
        verify(basketServiceMock.createBasketAddress('current', anything())).once();
        done();
      });
    });

    it('should map to Action createBasketAddressSuccess', () => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.CreateBasketAddress({ address, scope: 'invoice' });
      const completion = new basketActions.CreateBasketAddressSuccess({ address, scope: 'invoice' });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.createAddressForBasket$).toBeObservable(expected$);
    });
  });

  describe('assignNewAddressToBasket$', () => {
    it('should map to Action AssignBasketAddress for Invoice Address', () => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.CreateBasketAddressSuccess({ address, scope: 'invoice' });
      const completion = new basketActions.AssignBasketAddress({ addressId: address.id, scope: 'invoice' });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.assignNewAddressToBasket$).toBeObservable(expected$);
    });

    it('should map to Action AssignBasketAddress for Shipping Address', () => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.CreateBasketAddressSuccess({ address, scope: 'shipping' });
      const completion = new basketActions.AssignBasketAddress({ addressId: address.id, scope: 'shipping' });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.assignNewAddressToBasket$).toBeObservable(expected$);
    });

    it('should map to Action AssignBasketAddress for Invoice and Shipping Address', () => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.CreateBasketAddressSuccess({ address, scope: 'any' });
      const completion = new basketActions.AssignBasketAddress({ addressId: address.id, scope: 'any' });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.assignNewAddressToBasket$).toBeObservable(expected$);
    });
  });

  describe('assignBasketAddress$', () => {
    it('should trigger the updateBasket action to assign an Invoice Address', () => {
      const addressId = 'addressId';
      const action = new basketActions.AssignBasketAddress({ addressId, scope: 'invoice' });
      const completion = new basketActions.UpdateBasket({
        update: { invoiceToAddress: addressId },
      });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.assignBasketAddress$).toBeObservable(expected$);
    });

    it('should trigger the updateBasket action to assign a Shipping Address', () => {
      const addressId = 'addressId';
      const action = new basketActions.AssignBasketAddress({ addressId, scope: 'shipping' });

      const completion = new basketActions.UpdateBasket({
        update: { commonShipToAddress: addressId },
      });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.assignBasketAddress$).toBeObservable(expected$);
    });

    it('should trigger the updateBasket action to assign an Invoice and Shipping Address', () => {
      const addressId = 'addressId';
      const action = new basketActions.AssignBasketAddress({ addressId, scope: 'any' });
      const completion = new basketActions.UpdateBasket({
        update: { invoiceToAddress: addressId, commonShipToAddress: addressId },
      });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.assignBasketAddress$).toBeObservable(expected$);
    });
  });

  describe('updateBasket$', () => {
    beforeEach(() => {
      when(basketServiceMock.updateBasket(anyString(), anything())).thenReturn(of(BasketMockData.getBasket()));

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );
    });

    it('should call the basketService for updateBasket', done => {
      const basketId = 'BID';
      const update = { invoiceToAddress: '7654' };
      const action = new basketActions.UpdateBasket({ update });
      actions$ = of(action);

      effects.updateBasket$.subscribe(() => {
        verify(basketServiceMock.updateBasket(basketId, update)).once();
        done();
      });
    });

    it('should map to action of type LoadBasketSuccess', () => {
      const update = { commonShippingMethod: 'shippingId' };
      const action = new basketActions.UpdateBasket({ update });
      const completion = new basketActions.LoadBasketSuccess({ basket: BasketMockData.getBasket() });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.updateBasket$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type UpdateBasketFail', () => {
      const update = { commonShippingMethod: 'shippingId' };
      when(basketServiceMock.updateBasket(anyString(), anything())).thenReturn(throwError({ message: 'invalid' }));

      const action = new basketActions.UpdateBasket({ update });
      const completion = new basketActions.UpdateBasketFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.updateBasket$).toBeObservable(expected$);
    });
  });

  describe('updateBasketShippingMethod$', () => {
    it('should trigger the updateBasket action if called', () => {
      const shippingId = 'shippingId';
      const action = new basketActions.UpdateBasketShippingMethod({ shippingId });
      const completion = new basketActions.UpdateBasket({
        update: { commonShippingMethod: shippingId },
      });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.updateBasketShippingMethod$).toBeObservable(expected$);
    });
  });

  describe('updateBasketAddress$ for logged in user', () => {
    beforeEach(() => {
      when(addressServiceMock.updateCustomerAddress(anyString(), anything())).thenReturn(
        of(BasketMockData.getAddress())
      );
      store$.dispatch(new LoginUserSuccess({ customer: {} as Customer }));
    });

    it('should call the addressService for updateBasketAddress', done => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.UpdateBasketAddress({ address });
      actions$ = of(action);

      effects.updateBasketAddress$.subscribe(() => {
        verify(addressServiceMock.updateCustomerAddress('-', anything())).once();
        done();
      });
    });

    it('should map to action of type UpdateCustomerAddressSuccess and LoadBasket', () => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.UpdateBasketAddress({ address });
      const completion1 = new UpdateCustomerAddressSuccess({ address });
      const completion2 = new basketActions.LoadBasket();
      actions$ = hot('-a', { a: action });
      const expected$ = cold('-(cd)', { c: completion1, d: completion2 });

      expect(effects.updateBasketAddress$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type UpdateCustomerAddressFail', () => {
      const address = BasketMockData.getAddress();
      when(addressServiceMock.updateCustomerAddress(anyString(), anything())).thenReturn(
        throwError({ message: 'invalid' })
      );

      const action = new basketActions.UpdateBasketAddress({ address });
      const completion = new UpdateCustomerAddressFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.updateBasketAddress$).toBeObservable(expected$);
    });
  });

  describe('updateBasketAddress$ for anonymous user', () => {
    beforeEach(() => {
      when(basketServiceMock.updateBasketAddress(anyString(), anything())).thenReturn(of(BasketMockData.getAddress()));
    });

    it('should call the basketService for updateBasketAddress', done => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.UpdateBasketAddress({ address });
      actions$ = of(action);

      effects.updateBasketAddress$.subscribe(() => {
        verify(basketServiceMock.updateBasketAddress('current', anything())).once();
        done();
      });
    });

    it('should map to action of type UpdateCustomerAddressSuccess and LoadBasket', () => {
      const address = BasketMockData.getAddress();
      const action = new basketActions.UpdateBasketAddress({ address });
      const completion1 = new UpdateCustomerAddressSuccess({ address });
      const completion2 = new basketActions.LoadBasket();
      actions$ = hot('-a', { a: action });
      const expected$ = cold('-(cd)', { c: completion1, d: completion2 });

      expect(effects.updateBasketAddress$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type UpdateCustomerAddressFail', () => {
      const address = BasketMockData.getAddress();
      when(basketServiceMock.updateBasketAddress(anyString(), anything())).thenReturn(
        throwError({ message: 'invalid' })
      );

      const action = new basketActions.UpdateBasketAddress({ address });
      const completion = new UpdateCustomerAddressFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.updateBasketAddress$).toBeObservable(expected$);
    });
  });

  describe('deleteBasketShippingAddress$', () => {
    beforeEach(() => {
      when(addressServiceMock.deleteCustomerAddress(anyString(), anyString())).thenReturn(of(undefined));
    });

    it('should call the addressService for deleteBasketShippingAddress', done => {
      const addressId = 'addressId';
      const action = new basketActions.DeleteBasketShippingAddress({ addressId });
      actions$ = of(action);

      effects.deleteBasketShippingAddress$.subscribe(() => {
        verify(addressServiceMock.deleteCustomerAddress('-', anything())).once();
        done();
      });
    });

    it('should map to action of type DeleteCustomerAddressSuccess and LoadBasket', () => {
      const addressId = 'addressId';
      const action = new basketActions.DeleteBasketShippingAddress({ addressId });
      const completion1 = new DeleteCustomerAddressSuccess({ addressId });
      const completion2 = new basketActions.LoadBasket();
      actions$ = hot('-a', { a: action });
      const expected$ = cold('-(cd)', { c: completion1, d: completion2 });

      expect(effects.deleteBasketShippingAddress$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type DeleteCustomerAddressFail', () => {
      const addressId = 'addressId';
      when(addressServiceMock.deleteCustomerAddress(anyString(), anyString())).thenReturn(
        throwError({ message: 'invalid' })
      );

      const action = new basketActions.DeleteBasketShippingAddress({ addressId });
      const completion = new DeleteCustomerAddressFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.deleteBasketShippingAddress$).toBeObservable(expected$);
    });
  });

  describe('addItemsToBasket$', () => {
    beforeEach(() => {
      when(basketServiceMock.addItemsToBasket(anyString(), anything())).thenReturn(of(undefined));
    });

    it('should call the basketService for addItemsToBasket', done => {
      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );

      const items = [{ sku: 'SKU', quantity: 1 }];
      const action = new basketActions.AddItemsToBasket({ items });
      actions$ = of(action);

      effects.addItemsToBasket$.subscribe(() => {
        verify(basketServiceMock.addItemsToBasket('BID', items)).once();
        done();
      });
    });

    it('should call the basketService for addItemsToBasket with specific basketId when basketId set', done => {
      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );

      const items = [{ sku: 'SKU', quantity: 1 }];
      const basketId = 'BID';
      const action = new basketActions.AddItemsToBasket({ items, basketId });
      actions$ = of(action);

      effects.addItemsToBasket$.subscribe(() => {
        verify(basketServiceMock.addItemsToBasket('BID', items)).once();
        done();
      });
    });

    it('should not call the basketService for addItemsToBasket if no basket in store', () => {
      const items = [{ sku: 'SKU', quantity: 1 }];
      const action = new basketActions.AddItemsToBasket({ items });
      actions$ = of(action);

      effects.addItemsToBasket$.subscribe(fail, fail);

      verify(basketServiceMock.addItemsToBasket('BID', anything())).never();
    });

    it('should call the basketService for createBasket when no basket is present', done => {
      when(basketServiceMock.createBasket()).thenReturn(of({} as Basket));

      const items = [{ sku: 'SKU', quantity: 1 }];
      const action = new basketActions.AddItemsToBasket({ items });
      actions$ = of(action);

      effects.createBasketBeforeAddItemsToBasket$.subscribe(() => {
        verify(basketServiceMock.createBasket()).once();
        done();
      });
    });

    it('should map to action of type AddItemsToBasketSuccess', () => {
      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );

      const items = [{ sku: 'SKU', quantity: 1 }];
      const action = new basketActions.AddItemsToBasket({ items });
      const completion = new basketActions.AddItemsToBasketSuccess();
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.addItemsToBasket$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type AddItemsToBasketFail', () => {
      when(basketServiceMock.addItemsToBasket(anyString(), anything())).thenReturn(throwError({ message: 'invalid' }));

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );

      const items = [{ sku: 'invalid', quantity: 1 }];
      const action = new basketActions.AddItemsToBasket({ items });
      const completion = new basketActions.AddItemsToBasketFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.addItemsToBasket$).toBeObservable(expected$);
    });
  });

  describe('addProductToBasket$', () => {
    it('should map an AddProductToBasket to an AddItemsToBasket action', () => {
      const payload = { sku: 'SKU', quantity: 1 };
      const action = new basketActions.AddProductToBasket(payload);
      const completion = new basketActions.AddItemsToBasket({ items: [payload] });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.addProductToBasket$).toBeObservable(expected$);
    });
  });

  describe('addQuoteToBasket$', () => {
    it('should call the basketService for addQuoteToBasket', done => {
      when(basketServiceMock.addQuoteToBasket(anyString(), anyString())).thenReturn(of({} as Link));
      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );

      const quoteId = 'QID';
      const action = new basketActions.AddQuoteToBasket({ quoteId });
      actions$ = of(action);

      effects.addQuoteToBasket$.subscribe(() => {
        verify(basketServiceMock.addQuoteToBasket(quoteId, 'BID')).once();
        done();
      });
    });

    it('should call the basketService for createBasket if no basket is present', done => {
      when(basketServiceMock.createBasket()).thenReturn(of({} as Basket));

      const quoteId = 'quoteId';
      const action = new basketActions.AddQuoteToBasket({ quoteId });
      actions$ = of(action);

      effects.getBasketBeforeAddQuoteToBasket$.subscribe(() => {
        verify(basketServiceMock.createBasket()).once();
        done();
      });
    });

    it('should map to action of type AddQuoteToBasketSuccess', () => {
      when(basketServiceMock.addQuoteToBasket(anyString(), anyString())).thenReturn(of({} as Link));

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );

      const quoteId = 'QID';
      const action = new basketActions.AddQuoteToBasket({ quoteId });
      const completion = new basketActions.AddQuoteToBasketSuccess({ link: {} as Link });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.addQuoteToBasket$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type AddQuoteToBasketFail', () => {
      when(basketServiceMock.addQuoteToBasket(anyString(), anyString())).thenReturn(throwError({ message: 'invalid' }));

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );

      const quoteId = 'QID';
      const action = new basketActions.AddQuoteToBasket({ quoteId });
      const completion = new basketActions.AddQuoteToBasketFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.addQuoteToBasket$).toBeObservable(expected$);
    });
  });

  describe('loadBasketAfterAddItemsToBasket$', () => {
    it('should map to action of type LoadBasket if AddItemsToBasketSuccess action triggered', () => {
      const action = new basketActions.AddItemsToBasketSuccess();
      const completion = new basketActions.LoadBasket();
      actions$ = hot('-a', { a: action });
      const expected$ = cold('-c', { c: completion });

      expect(effects.loadBasketAfterBasketChangeSuccess$).toBeObservable(expected$);
    });
  });

  describe('mergeBasketAfterLogin$', () => {
    it('should map to action of type addItemsToBasket if pre login basket is filled', () => {
      when(basketServiceMock.getBaskets()).thenReturn(of([{ id: 'BIDNEW' } as BasketBaseData]));

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [
              {
                id: 'BIID',
                name: 'NAME',
                quantity: { value: 1 },
                productSKU: 'SKU',
                price: undefined,
              } as LineItem,
            ],
          } as Basket,
        })
      );
      store$.dispatch(new LoadProductSuccess({ product: { sku: 'SKU' } as Product }));

      const action = new LoginUserSuccess({ customer: {} as Customer });
      const completion = new basketActions.AddItemsToBasket({
        items: [
          {
            sku: 'SKU',
            quantity: 1,
          },
        ],
        basketId: 'BIDNEW',
      });
      actions$ = hot('-a', { a: action });
      const expected$ = cold('-c', { c: completion });

      expect(effects.mergeBasketAfterLogin$).toBeObservable(expected$);
    });
  });

  describe('loadBasketAfterLogin$', () => {
    it('should map to action of type LoadBasket if pre login basket is empty', () => {
      when(basketServiceMock.getBaskets()).thenReturn(of([{ id: 'BIDNEW' } as BasketBaseData]));

      const action = new LoginUserSuccess({ customer: {} as Customer });
      const completion = new basketActions.LoadBasket();
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadBasketAfterLogin$).toBeObservable(expected$);
    });
  });

  describe('updateBasketItems$', () => {
    beforeEach(() => {
      when(basketServiceMock.updateBasketItem(anyString(), anyString(), anything())).thenReturn(of());

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [
              {
                id: 'BIID',
                name: 'NAME',
                quantity: { value: 1 },
                productSKU: 'SKU',
                price: undefined,
              } as LineItem,
            ],
          } as Basket,
        })
      );
    });

    it('should call the basketService for updateBasketItem if quantity > 0', done => {
      const payload = {
        lineItemQuantities: [
          {
            itemId: 'BIID',
            quantity: 2,
          },
          {
            itemId: 'BIID',
            quantity: 3,
          },
          {
            itemId: 'BIID',
            quantity: 4,
          },
        ],
      };
      const action = new basketActions.UpdateBasketItems(payload);
      actions$ = of(action);

      effects.updateBasketItems$.subscribe(() => {
        verify(basketServiceMock.updateBasketItem('BID', payload.lineItemQuantities[1].itemId, anything())).thrice();
        verify(
          basketServiceMock.updateBasketItem(
            'BID',
            payload.lineItemQuantities[1].itemId,
            deepEqual({ quantity: { value: 2 } })
          )
        ).once();
        done();
      });
    });

    it('should call the basketService for deleteBasketItem if quantity = 0', done => {
      when(basketServiceMock.deleteBasketItem(anyString(), anyString())).thenReturn(of());

      const payload = {
        lineItemQuantities: [
          {
            itemId: 'BIID',
            quantity: 0,
          },
        ],
      };
      const action = new basketActions.UpdateBasketItems(payload);
      actions$ = of(action);

      effects.updateBasketItems$.subscribe(() => {
        verify(basketServiceMock.deleteBasketItem('BID', payload.lineItemQuantities[0].itemId)).once();
        done();
      });
    });

    it('should map to action of type UpdateBasketItemsSuccess', () => {
      const payload = {
        lineItemQuantities: [
          {
            itemId: 'IID',
            quantity: 2,
          },
        ],
      };
      const action = new basketActions.UpdateBasketItems(payload);
      const completion = new basketActions.UpdateBasketItemsSuccess();
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.updateBasketItems$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type UpdateBasketItemsFail', () => {
      when(basketServiceMock.updateBasketItem(anyString(), anyString(), anything())).thenReturn(
        throwError({ message: 'invalid' })
      );

      const payload = {
        lineItemQuantities: [
          {
            itemId: 'BIID',
            quantity: 2,
          },
        ],
      };
      const action = new basketActions.UpdateBasketItems(payload);
      const completion = new basketActions.UpdateBasketItemsFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.updateBasketItems$).toBeObservable(expected$);
    });
  });

  describe('loadBasketAfterUpdateBasketItem$', () => {
    it('should map to action of type LoadBasket if UpdateBasketItemSuccess action triggered', () => {
      const action = new basketActions.UpdateBasketItemsSuccess();
      const completion = new basketActions.LoadBasket();
      actions$ = hot('-a', { a: action });
      const expected$ = cold('-c', { c: completion });

      expect(effects.loadBasketAfterBasketChangeSuccess$).toBeObservable(expected$);
    });
  });

  describe('deleteBasketItem$', () => {
    beforeEach(() => {
      when(basketServiceMock.deleteBasketItem(anyString(), anyString())).thenReturn(of(undefined));

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );
    });

    it('should call the basketService for DeleteBasketItem action', done => {
      const itemId = 'BIID';
      const action = new basketActions.DeleteBasketItem({ itemId });
      actions$ = of(action);

      effects.deleteBasketItem$.subscribe(() => {
        verify(basketServiceMock.deleteBasketItem('BID', 'BIID')).once();
        done();
      });
    });

    it('should map to action of type DeleteBasketItemSuccess', () => {
      const itemId = 'BIID';
      const action = new basketActions.DeleteBasketItem({ itemId });
      const completion = new basketActions.DeleteBasketItemSuccess();
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.deleteBasketItem$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type DeleteBasketItemFail', () => {
      when(basketServiceMock.deleteBasketItem(anyString(), anyString())).thenReturn(throwError({ message: 'invalid' }));

      const itemId = 'BIID';
      const action = new basketActions.DeleteBasketItem({ itemId });
      const completion = new basketActions.DeleteBasketItemFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.deleteBasketItem$).toBeObservable(expected$);
    });
  });

  describe('loadBasketAfterDeleteBasketItem$', () => {
    it('should map to action of type LoadBasket if DeleteBasketItemSuccess action triggered', () => {
      const action = new basketActions.DeleteBasketItemSuccess();
      const completion = new basketActions.LoadBasket();
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadBasketAfterBasketChangeSuccess$).toBeObservable(expected$);
    });
  });

  describe('loadBasketEligibleShippingMethods$', () => {
    beforeEach(() => {
      when(basketServiceMock.getBasketEligibleShippingMethods(anyString())).thenReturn(
        of([BasketMockData.getShippingMethod()])
      );

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );
    });

    it('should call the basketService for loadBasketItemOptions', done => {
      const action = new basketActions.LoadBasketEligibleShippingMethods();
      actions$ = of(action);

      effects.loadBasketEligibleShippingMethods$.subscribe(() => {
        verify(basketServiceMock.getBasketEligibleShippingMethods('BID')).once();
        done();
      });
    });

    it('should map to action of type loadBasketEligibleShippingMethodsSuccess', () => {
      const action = new basketActions.LoadBasketEligibleShippingMethods();
      const completion = new basketActions.LoadBasketEligibleShippingMethodsSuccess({
        shippingMethods: [BasketMockData.getShippingMethod()],
      });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadBasketEligibleShippingMethods$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type LoadBasketEligibleShippingMethodsFail', () => {
      when(basketServiceMock.getBasketEligibleShippingMethods(anyString())).thenReturn(
        throwError({ message: 'invalid' })
      );
      const action = new basketActions.LoadBasketEligibleShippingMethods();
      const completion = new basketActions.LoadBasketEligibleShippingMethodsFail({
        error: {
          message: 'invalid',
        } as HttpError,
      });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadBasketEligibleShippingMethods$).toBeObservable(expected$);
    });
  });

  describe('loadBasketEligiblePaymentMethods$', () => {
    beforeEach(() => {
      when(basketServiceMock.getBasketEligiblePaymentMethods(anyString())).thenReturn(
        of([BasketMockData.getPaymentMethod()])
      );

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
          } as Basket,
        })
      );
    });
    it('should call the basketService for loadBasketPaymentOptions', done => {
      const action = new basketActions.LoadBasketEligiblePaymentMethods();
      actions$ = of(action);

      effects.loadBasketEligiblePaymentMethods$.subscribe(() => {
        verify(basketServiceMock.getBasketEligiblePaymentMethods('BID')).once();
        done();
      });
    });

    it('should map to action of type loadBasketEligiblePaymentMethodsSuccess', () => {
      const action = new basketActions.LoadBasketEligiblePaymentMethods();
      const completion = new basketActions.LoadBasketEligiblePaymentMethodsSuccess({
        paymentMethods: [BasketMockData.getPaymentMethod()],
      });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadBasketEligiblePaymentMethods$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type LoadBasketEligiblePaymentMethodsFail', () => {
      when(basketServiceMock.getBasketEligiblePaymentMethods(anyString())).thenReturn(
        throwError({ message: 'invalid' })
      );
      const action = new basketActions.LoadBasketEligiblePaymentMethods();
      const completion = new basketActions.LoadBasketEligiblePaymentMethodsFail({
        error: {
          message: 'invalid',
        } as HttpError,
      });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadBasketEligiblePaymentMethods$).toBeObservable(expected$);
    });
  });

  describe('setPaymentAtBasket$ - set payment at basket for the first time', () => {
    beforeEach(() => {
      when(basketServiceMock.setBasketPayment(anyString(), anyString())).thenReturn(of(undefined));

      store$.dispatch(
        new basketActions.LoadBasketSuccess({
          basket: {
            id: 'BID',
            lineItems: [],
            payment: undefined,
          } as Basket,
        })
      );
    });

    it('should call the basketService for setPaymentAtBasket', done => {
      const id = 'newPayment';
      const action = new basketActions.SetBasketPayment({ id });
      actions$ = of(action);

      effects.setPaymentAtBasket$.subscribe(() => {
        verify(basketServiceMock.setBasketPayment('BID', id)).once();
        done();
      });
    });

    it('should map to action of type SetBasketPaymentSuccess', () => {
      const id = 'newPayment';
      const action = new basketActions.SetBasketPayment({ id });
      const completion = new basketActions.SetBasketPaymentSuccess();
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.setPaymentAtBasket$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type SetPaymentFail', () => {
      when(basketServiceMock.setBasketPayment(anyString(), anyString())).thenReturn(throwError({ message: 'invalid' }));
      const action = new basketActions.SetBasketPayment({ id: 'newPayment' });
      const completion = new basketActions.SetBasketPaymentFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.setPaymentAtBasket$).toBeObservable(expected$);
    });
  });

  describe('setPaymentAtBasket$ - change payment method at basket', () => {
    beforeEach(() => {
      when(basketServiceMock.setBasketPayment(anyString(), anyString())).thenReturn(of(undefined));

      store$.dispatch(new basketActions.LoadBasketSuccess({ basket: BasketMockData.getBasket() }));
    });

    it('should call the basketService for setPaymentAtBasket', done => {
      const id = 'newPayment';
      const action = new basketActions.SetBasketPayment({ id });
      actions$ = of(action);

      effects.setPaymentAtBasket$.subscribe(() => {
        verify(basketServiceMock.setBasketPayment('4711', id)).once();
        done();
      });
    });

    it('should map to action of type SetBasketPaymentSuccess', () => {
      const id = 'newPayment';
      const action = new basketActions.SetBasketPayment({ id });
      const completion = new basketActions.SetBasketPaymentSuccess();
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.setPaymentAtBasket$).toBeObservable(expected$);
    });

    it('should map invalid addBasketPayment request to action of type SetPaymentFail', () => {
      when(basketServiceMock.setBasketPayment(anyString(), anyString())).thenReturn(throwError({ message: 'invalid' }));
      const action = new basketActions.SetBasketPayment({ id: 'newPayment' });
      const completion = new basketActions.SetBasketPaymentFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.setPaymentAtBasket$).toBeObservable(expected$);
    });
  });

  describe('resetBasketAfterLogout$', () => {
    it('should map to action of type ResetBasket if LogoutUser action triggered', () => {
      const action = new LogoutUser();
      const completion = new basketActions.ResetBasket();
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.resetBasketAfterLogout$).toBeObservable(expected$);
    });
  });

  describe('createOrder$', () => {
    it('should call the orderService for createOrder', done => {
      when(orderServiceMock.createOrder(anything(), anything())).thenReturn(of(undefined));
      const payload = BasketMockData.getBasket();
      const action = new basketActions.CreateOrder({ basket: payload });
      actions$ = of(action);

      effects.createOrder$.subscribe(() => {
        verify(orderServiceMock.createOrder(payload, true)).once();
        done();
      });
    });

    it('should map a valid request to action of type CreateOrderSuccess', () => {
      when(orderServiceMock.createOrder(anything(), anything())).thenReturn(
        of({ id: BasketMockData.getBasket().id } as Order)
      );
      const basket = BasketMockData.getBasket();
      const order = { id: basket.id } as Order;
      const action = new basketActions.CreateOrder({ basket });
      const completion = new basketActions.CreateOrderSuccess({ order });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.createOrder$).toBeObservable(expected$);
    });

    it('should map an invalid request to action of type CreateOrderFail', () => {
      when(orderServiceMock.createOrder(anything(), anything())).thenReturn(throwError({ message: 'invalid' }));
      const basket = BasketMockData.getBasket();
      const action = new basketActions.CreateOrder({ basket });
      const completion = new basketActions.CreateOrderFail({ error: { message: 'invalid' } as HttpError });
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.createOrder$).toBeObservable(expected$);
    });
  });

  describe('goToCheckoutReceiptPageAfterOrderCreation', () => {
    it('should navigate to /checkout/receipt after CreateOrderSuccess', fakeAsync(() => {
      const action = new basketActions.CreateOrderSuccess({ order: { id: '123' } as Order });
      actions$ = of(action);

      effects.goToCheckoutReceiptPageAfterOrderCreation$.subscribe(noop, fail, noop);

      tick(500);

      expect(location.path()).toEqual('/checkout/receipt');
    }));
  });
});
