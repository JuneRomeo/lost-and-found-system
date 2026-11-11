
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('adminToken');

  if (token) {
    return true;
  }

  return router.createUrlTree(['/admin-login']);
};
