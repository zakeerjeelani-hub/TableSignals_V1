import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule} from '@angular/forms'
import { LeftMenuComponent } from '../layout/left-menu/left-menu.component';
import { TopMenuComponent } from '../layout/top-menu/top-menu.component';
import { SuccessMessageComponent } from '../common/success-message/success-message.component';
import { LogoutConfirmationDialog } from '../common/back-button/back-button.component';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LeftMenuComponent,
    TopMenuComponent,
    LogoutConfirmationDialog
  ],
  
})
export class RestaurantModule { }
