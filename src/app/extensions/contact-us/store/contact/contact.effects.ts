import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, map, switchMap } from 'rxjs/operators';

import { mapErrorToAction, mapToPayloadProperty } from 'ish-core/utils/operators';

import { ContactService } from '../../services/contact/contact.service';

import {
  createContact,
  createContactFail,
  createContactSuccess,
  loadContact,
  loadContactFail,
  loadContactSuccess,
} from './contact.actions';

@Injectable()
export class ContactEffects {
  constructor(private actions$: Actions, private contactService: ContactService) {}

  /**
   * Load the contact subjects, which the customer can select for his request
   */
  loadSubjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadContact),
      switchMap(() =>
        this.contactService.getContactSubjects().pipe(
          map(subjects => loadContactSuccess({ subjects })),
          mapErrorToAction(loadContactFail)
        )
      )
    )
  );

  /**
   * Send the contact request, when a customer want to get in contact with the shop
   */
  createContact$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createContact),
      mapToPayloadProperty('contact'),
      concatMap(contact =>
        this.contactService.createContactRequest(contact).pipe(
          map(() => createContactSuccess()),
          mapErrorToAction(createContactFail)
        )
      )
    )
  );
}
