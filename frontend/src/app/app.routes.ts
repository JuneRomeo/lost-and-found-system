import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { LostItems } from './pages/lost-items/lost-items';
import { FoundItems } from './pages/found-items/found-items';
import { About } from './pages/about/about';
import { LostItem } from './pages/lost-item/lost-item';
import { FoundItem } from './pages/found-item/found-item';
import { ItemCatalog } from './pages/item-catalog/item-catalog';
import { ItemDetails } from './pages/item-details/item-details';
import { ClaimTracker } from './pages/claim-tracker/claim-tracker';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { FrontDeskIntake } from './pages/front-desk-intake/front-desk-intake';
import { AdminLogin } from './pages/admin-login/admin-login';
import { adminAuthGuard } from './admin-auth.guard';


export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'lost-items',
    component: ItemCatalog,
    data: { reportType: 'lost' }
  },
  {
    path: 'found-items',
    component: ItemCatalog,
    data: { reportType: 'found' }
  },
  {
    path: 'about',
    component: About
  },
  {
    path: 'report-lost',
    component: LostItem
  },
  {
    path: 'report-found',
    component: FoundItem
  },
  
  {
  path: 'item-catalog',
  component: ItemCatalog
  },

  { 
  path: 'item-details/:id',
  component: ItemDetails 
  },
  
  { 
  path: 'claim-tracker', 
  component: ClaimTracker 
  },

  {
  path: 'admin-login',
  component: AdminLogin
  },

  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [adminAuthGuard]
  },

  {
    path: 'front-desk-intake',
    component: FrontDeskIntake,
    canActivate: [adminAuthGuard]
  },

  {
    path: '**',
    redirectTo: ''
  }
  
];