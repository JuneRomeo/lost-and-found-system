
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  imports: [],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {
  private http = inject(HttpClient);
  private router = inject(Router);

  pin = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  login(): void {
    this.errorMessage.set('');

    if (!/^\d{6}$/.test(this.pin())) {
      this.errorMessage.set('Please enter your 6-digit PIN.');
      return;
    }

    this.isLoading.set(true);

    this.http.post<any>(
      'http://localhost:5000/api/admin-auth/login',
      { pin: this.pin() }
    ).subscribe({
      next: (response) => {
        localStorage.setItem('adminToken', response.token);
        this.router.navigate(['/admin-dashboard']);
      },
      error: (error) => {
        this.errorMessage.set(
          error.error?.message || 'Login failed. Please try again.'
        );
        this.isLoading.set(false);
      }
    });
  }
}
