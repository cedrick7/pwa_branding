import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import { instance, mock } from 'ts-mockito';

import { MockComponent } from 'ish-core/utils/dev/mock.component';

import { AccountPageContainerComponent } from './account-page.container';

describe('Account Page Container', () => {
  let fixture: ComponentFixture<AccountPageContainerComponent>;
  let component: AccountPageContainerComponent;
  let element: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AccountPageContainerComponent,
        MockComponent({
          selector: 'ish-account-page',
          template: 'Account Page Component',
        }),
        MockComponent({
          selector: 'ish-breadcrumb',
          template: 'Breadcrumb Component',
          inputs: ['account', 'trail'],
        }),
      ],
      providers: [
        { provide: Store, useFactory: () => instance(mock(Store)) },
        { provide: ActivatedRoute, useValue: { firstChild: { data: EMPTY } } },
      ],
      imports: [RouterTestingModule, TranslateModule.forRoot()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountPageContainerComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
    expect(element).toBeTruthy();
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});