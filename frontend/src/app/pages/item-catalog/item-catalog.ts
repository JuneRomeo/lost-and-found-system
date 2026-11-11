
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-item-catalog',
  imports: [RouterLink, DatePipe],
  templateUrl: './item-catalog.html',
  styleUrl: './item-catalog.css',
})

export class ItemCatalog implements OnInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  items = signal<any[]>([]);
  searchTerm = signal('');

  reportType = signal<'lost' | 'found' | null>(null);

  pageTitle = computed(() => {
    if (this.reportType() === 'lost') return 'Lost Items';
    if (this.reportType() === 'found') return 'Found Items';
    return 'Lost and Found Items';
  });

  filteredItems = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const type = this.reportType();

    return this.items().filter(item => {
      const matchesType = !type || item.reportType === type;

      const matchesSearch =
        !query ||
        item.itemName?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  });

  ngOnInit(): void {
    const type = this.route.snapshot.data['reportType'];

    if (type === 'lost' || type === 'found') {
      this.reportType.set(type);
    }

    this.loadItems();
  }

  loadItems(): void {
    this.http.get<any[]>('http://localhost:5000/api/items')
      .subscribe({
        next: (response) => {
          this.items.set(response);
          console.log('Items loaded successfully:', this.items());
        },
        error: (error) => {
          console.error('Failed to load items:', error);
        }
      });
  }

  isSensitiveItem(item: any): boolean {
    const itemInfo = `
      ${item.itemName || ''}
      ${item.category || ''}
      ${item.description || ''}
    `.toLowerCase();

    const sensitiveKeywords = [
      'id',
      'identification',
      'school id',
      'wallet',
      'passport',
      'license',
      'document',
      'credit card',
      'debit card',
      'bank card'
    ];

    return sensitiveKeywords.some(keyword => {
      if (keyword === 'id') {
        return /\bid\b/.test(itemInfo);
      }

      return itemInfo.includes(keyword);
    });
  }
}
