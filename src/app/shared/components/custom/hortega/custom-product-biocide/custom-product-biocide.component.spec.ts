import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomProductBiocideComponent } from './custom-product-biocide.component';

describe('Custom Product Biocide Component', () => {
  let component: CustomProductBiocideComponent;
  let fixture: ComponentFixture<CustomProductBiocideComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomProductBiocideComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomProductBiocideComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
    expect(element).toBeTruthy();
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
