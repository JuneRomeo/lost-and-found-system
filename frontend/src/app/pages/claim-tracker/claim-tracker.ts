import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-claim-tracker',
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './claim-tracker.html',
  styleUrl: './claim-tracker.css',
})
export class ClaimTracker {
  private http = inject(HttpClient);

  claimReference = '';
  claimResult = signal<any>(null);
  errorMessage = signal('');

  trackClaim(): void {
    const reference = this.claimReference.trim();

    if (!reference) {
      this.errorMessage.set('Please enter your claim reference number.');
      this.claimResult.set(null);
      return;
    }

    this.errorMessage.set('');
    this.claimResult.set(null);

    this.http.get<any>(
      'http://localhost:5000/api/claims/track/' + reference
    ).subscribe({
      next: (response) => {
        this.claimResult.set(response);
      },
      error: (error) => {
        this.errorMessage.set(
          error.error?.message || 'Failed to track your claim.'
        );
      }
    });
  }
}