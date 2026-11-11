import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TitleCasePipe, DatePipe } from '@angular/common';

type AdminTab = 'found' | 'lost' | 'claims' | 'returned';

@Component({
  selector: 'app-admin-dashboard',
  imports: [TitleCasePipe, DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private http = inject(HttpClient);

  items = signal<any[]>([]);
  claims = signal<any[]>([]);
  errorMessage = signal('');

  activeTab = signal<AdminTab>('found');

  // Found Item Reports
  foundItems = computed(() =>
    this.items()
      .filter(item =>
        item.reportType === 'found' &&
        item.status !== 'claimed' &&
        item.status !== 'returned'
      )
      .sort((a, b) =>
        Number(a.isTurnedOver) - Number(b.isTurnedOver)
      )
  );

  // Lost Item Reports
  lostItems = computed(() =>
    this.items().filter(item => item.reportType === 'lost')
  );

  // Submitted Claims: approved claims leave this section.
  submittedClaims = computed(() =>
    this.claims().filter(claim =>
      claim.status === 'pending' ||
      claim.status === 'rejected'
    )
  );

  // Returned Items: includes approved claims awaiting handover
  // and items that have already been physically returned.
  returnedItems = computed(() =>
    this.items().filter(item =>
      item.reportType === 'found' &&
      (item.status === 'claimed' || item.status === 'returned') &&
      this.getReturnedClaim(item._id) !== null
    )
  );

  pendingLocationCount = computed(() =>
    this.foundItems().filter(item => !item.isTurnedOver).length
  );

  ngOnInit(): void {
    this.loadItems();
    this.loadClaims();
  }

  selectTab(tab: AdminTab): void {
    this.activeTab.set(tab);
  }

  loadItems(): void {
    this.http.get<any[]>('http://localhost:5000/api/items/admin')
      .subscribe({
        next: (response) => {
          this.items.set(response);
          console.log('Admin items loaded:', response);
        },
        error: (error) => {
          console.error('Failed to load admin items:', error);
          this.errorMessage.set('Failed to load items.');
        }
      });
  }

  loadClaims(): void {
    this.http.get<any[]>('http://localhost:5000/api/claims')
      .subscribe({
        next: (response) => {
          this.claims.set(response);
          console.log('Admin claims loaded:', response);
        },
        error: (error) => {
          console.error('Failed to load claims:', error);
        }
      });
  }

  hasProofImage(claim: any): boolean {
    return !!claim.proofImageUrl;
  }

  updateClaimStatus(claimId: string, status: string): void {
    let rejectionReason = '';

    if (status === 'rejected') {
      const reason = prompt(
        'Please enter the reason for rejecting this claim:'
      );

      if (reason === null) {
        return;
      }

      rejectionReason = reason.trim();

      if (!rejectionReason) {
        alert('A rejection reason is required.');
        return;
      }
    }

    const confirmed = confirm(
      `Are you sure you want to ${status} this claim?`
    );

    if (!confirmed) return;

    this.http.patch<any>(
      `http://localhost:5000/api/claims/${claimId}/status`,
      {
        status,
        rejectionReason
      }
    ).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadClaims();
        this.loadItems();
      },
      error: (error) => {
        console.error('Failed to update claim:', error);
        alert(error.error?.message || 'Failed to update claim status.');
      }
    });
  }

  assignPickupLocation(
    itemId: string,
    cabinetNumber: string,
    shelfNumber: string
  ): void {
    if (!cabinetNumber.trim() || !shelfNumber.trim()) {
      alert('Please enter both cabinet and shelf numbers.');
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to assign this pickup location?'
    );

    if (!confirmed) return;

    this.http.patch<any>(
      `http://localhost:5000/api/items/${itemId}/turnover`,
      { cabinetNumber, shelfNumber }
    ).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadItems();
      },
      error: (error) => {
        console.error('Failed to assign pickup location:', error);
        alert(error.error?.message || 'Failed to assign pickup location.');
      }
    });
  }

  // Mark an approved claim as physically returned.
  updateClaimReturn(claimId: string): void {
    if (!confirm(
      'Are you sure this item has been physically returned to its owner?'
    )) {
      return;
    }

    this.http.patch<any>(
      `http://localhost:5000/api/claims/${claimId}/return`,
      {}
    ).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadClaims();
        this.loadItems();
      },
      error: (error) => {
        console.error('Error returning item:', error);
        alert(error.error?.message || 'Failed to record returned item.');
      }
    });
  }

  updateItemStatus(itemId: string, status: string): void {
    const confirmed = confirm(
      `Are you sure you want to mark this item as ${status}?`
    );

    if (!confirmed) return;

    this.http.patch<any>(
      `http://localhost:5000/api/items/${itemId}/status`,
      { status }
    ).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadItems();
      },
      error: (error) => {
        console.error('Failed to update item:', error);
        alert(error.error?.message || 'Failed to update item status.');
      }
    });
  }

  deleteLostItem(itemId: string): void {
    const confirmed = confirm(
      'Are you sure you want to delete this lost item report?'
    );

    if (!confirmed) return;

    this.http.delete<any>(
      `http://localhost:5000/api/items/${itemId}`
    ).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadItems();
      },
      error: (error) => {
        console.error('Failed to delete lost item:', error);
        alert(error.error?.message || 'Failed to delete lost item report.');
      }
    });
  }

  // Find the approved or returned claim associated with an item.
  getReturnedClaim(itemId: string): any | null {
    return this.claims().find(claim =>
      (claim.status === 'approved' || claim.status === 'returned') &&
      claim.item?._id === itemId
    ) || null;
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login';
  }
}