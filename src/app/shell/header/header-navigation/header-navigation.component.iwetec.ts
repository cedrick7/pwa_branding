import { ChangeDetectionStrategy, Component, Inject, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { MAIN_NAVIGATION_MAX_SUB_CATEGORIES_DEPTH } from 'ish-core/configurations/injection-keys';
import { ShoppingFacade } from 'ish-core/facades/shopping.facade';
import { NavigationCategory } from 'ish-core/models/navigation-category/navigation-category.model';
import { InjectSingle } from 'ish-core/utils/injection';

@Component({
  selector: 'ish-header-navigation',
  templateUrl: './header-navigation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderNavigationComponent implements OnInit {
  @Input() view: 'auto' | 'small' | 'full' = 'auto';

  categories$: Observable<NavigationCategory[]>;

  private openedCategories: string[] = [];

  constructor(
    private shoppingFacade: ShoppingFacade,
    @Inject(MAIN_NAVIGATION_MAX_SUB_CATEGORIES_DEPTH)
    public mainNavigationMaxSubCategoriesDepth: InjectSingle<typeof MAIN_NAVIGATION_MAX_SUB_CATEGORIES_DEPTH>
  ) {}

  ngOnInit() {
    this.categories$ = this.shoppingFacade.navigationCategories$();
  }

  /**
   * Handle sub menu show.
   * Adds hover class to rendered element.
   *
   * @param subMenu The rendered sub menu element.
   */
  subMenuShow(subMenu: HTMLElement) {
    if (this.view == 'full') {
      console.warn('submenu hover class added');
      subMenu.classList.add('hover');
    }
  }

  /**
   * Handle sub menu hide.
   * Removes hover class from rendered element.
   *
   * @param subMenu The rendered sub menu element.
   */
  subMenuHide(subMenu: HTMLElement) {
    subMenu.classList.remove('hover');
  }

  /**
   * Indicate if specific category is expanded.
   *
   * @param category The category item.
   */
  isOpened(uniqueId: string): boolean {
    return this.openedCategories.includes(uniqueId);
  }

  /**
   * Toggle category open state.
   *
   * @param category The category item.
   */
  toggleOpen(uniqueId: string) {
    const index = this.openedCategories.findIndex(id => id === uniqueId);
    index > -1 ? this.openedCategories.splice(index, 1) : this.openedCategories.push(uniqueId);
  }
}
