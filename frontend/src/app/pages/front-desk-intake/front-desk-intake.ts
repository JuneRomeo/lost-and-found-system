
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-front-desk-intake',
  imports: [FormsModule],
  templateUrl: './front-desk-intake.html',
  styleUrl: './front-desk-intake.css',
})
export class FrontDeskIntake implements OnInit {
  private http = inject(HttpClient);

  foundItems = signal<any[]>([]);
  selectedItemId = '';
  cabinetNumber = '';
  shelfNumber = '';

  successMessage = signal('');
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadFoundItems();
  }

  // Load all found items
  loadFoundItems(): void {
    this.http.get<any[]>('http://localhost:5000/api/items')
      .subscribe({
        next: (response) => {
          this.foundItems.set(
            response.filter(item => item.reportType === 'found')
          );
        },
        error: (error) => {
          console.error('Failed to load found items:', error);
          this.errorMessage.set('Failed to load found items.');
        }
      });
  }

  // Record item turnover
  recordTurnover(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.selectedItemId || !this.cabinetNumber.trim() || !this.shelfNumber.trim()) {
      this.errorMessage.set('Please select an item and enter its cabinet and shelf numbers.');
      return;
    }

    this.http.patch<any>(
      `http://localhost:5000/api/items/${this.selectedItemId}/turnover`,
      {
        cabinetNumber: this.cabinetNumber,
        shelfNumber: this.shelfNumber
      }
    ).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);

        this.selectedItemId = '';
        this.cabinetNumber = '';
        this.shelfNumber = '';

        this.loadFoundItems();
      },
      error: (error) => {
        console.error('Failed to record turnover:', error);
        this.errorMessage.set(
          error.error?.message || 'Failed to record item turnover.'
        );
      }
    });
  }
}
