
import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home')
      .then(m => m.Home)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login')
      .then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register')
      .then(m => m.Register)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/train-search')
      .then(m => m.TrainSearch)
  },
  {
    path: 'availability',
    loadComponent: () => import('./pages/availability')
      .then(m => m.Availability)
  },
  {
    path: 'booking',
    canActivate: [authGuard]
    loadComponent: () => import('./pages/booking')
      .then(m => m.Booking)
  },
  {
    path: 'my-bookings',
    canActivate: [authGuard]
    loadComponent: () => import('./pages/my-bookings')
      .then(m => m.MyBookings)
  },
  {
    path: 'pnr-status',
    loadComponent: () => import('./pages/pnr-status')
      .then(m => m.PnrStatus)
  },
  { path: '**', redirectTo: '' }
];
