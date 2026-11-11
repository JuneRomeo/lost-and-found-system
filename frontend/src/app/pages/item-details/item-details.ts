import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-item-details',
  imports: [RouterLink, FormsModule, DatePipe, TitleCasePipe],
  templateUrl: './item-details.html',
  styleUrl: './item-details.css',
})
export class ItemDetails implements OnInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  item = signal<any>(null);
  claimReference = signal('');

  // Claim modal
  showClaimModal = signal(false);
  backToCatalog = signal('/item-catalog');
  isSubmittingClaim = signal(false);

  // Claim form fields
  claimantName = '';
  contactNumber = '';
  email = '';
  claimDetails = '';

  // Digital signature
  signatureData = '';
  private isDrawing = false;
  private signatureCanvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const from = this.route.snapshot.queryParamMap.get('from');

    if (from === 'found') {
      this.backToCatalog.set('/found-items');
    } else if (from === 'lost') {
      this.backToCatalog.set('/lost-items');
    } else {
      this.backToCatalog.set('/item-catalog');
    }

    if (id) {
      this.loadItem(id);
    }
  }

  // LOAD ITEM DETAILS
  loadItem(id: string): void {
    this.http.get<any>('http://localhost:5000/api/items/' + id)
      .subscribe({
        next: (response) => {
          this.item.set(response);

          console.log('Item details loaded:', response);
          console.log('Report type:', response.reportType);
          console.log('Item status:', response.status);
        },
        error: (error) => {
          console.error('Failed to load item details:', error);
          alert('Failed to load item details.');
        }
      });
  }

  // CHECK SENSITIVE ITEMS
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

  // OPEN CLAIM MODAL
    openClaimModal(): void {
      if (!this.item() || this.item().reportType !== 'found') {
        alert('Only found items can be claimed.');
        return;
      }

      if (this.item().status !== 'open') {
        alert('This item is no longer available for claiming.');
        return;
      }

      this.showClaimModal.set(true);
    }

  // CLOSE CLAIM MODAL
  closeClaimModal(): void {
    this.showClaimModal.set(false);
  }

  // START DIGITAL SIGNATURE
  startDrawing(event: PointerEvent): void {
    const canvas = event.target as HTMLCanvasElement;

    this.signatureCanvas = canvas;
    this.context = canvas.getContext('2d');

    if (!this.context) return;

    this.isDrawing = true;
    canvas.setPointerCapture(event.pointerId);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    this.context.beginPath();
    this.context.moveTo(
      (event.clientX - rect.left) * scaleX,
      (event.clientY - rect.top) * scaleY
    );

    this.context.strokeStyle = '#000000';
    this.context.lineWidth = 2;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
  }

  // DRAW DIGITAL SIGNATURE
  drawSignature(event: PointerEvent): void {
    if (!this.isDrawing || !this.context || !this.signatureCanvas) {
      return;
    }

    const rect = this.signatureCanvas.getBoundingClientRect();
    const scaleX = this.signatureCanvas.width / rect.width;
    const scaleY = this.signatureCanvas.height / rect.height;

    this.context.lineTo(
      (event.clientX - rect.left) * scaleX,
      (event.clientY - rect.top) * scaleY
    );

    this.context.stroke();
  }

  // STOP DRAWING
  stopDrawing(): void {
    if (!this.isDrawing || !this.signatureCanvas) return;

    this.isDrawing = false;
    this.signatureData = this.signatureCanvas.toDataURL('image/png');
  }

  // CLEAR DIGITAL SIGNATURE
  clearSignature(): void {
    if (this.context && this.signatureCanvas) {
      this.context.clearRect(
        0,
        0,
        this.signatureCanvas.width,
        this.signatureCanvas.height
      );
    }

    this.signatureData = '';
  }

  // SUBMIT CLAIM
  submitClaim(): void {
    if (this.isSubmittingClaim()) return;

    if (
      !this.claimantName.trim() ||
      !this.contactNumber.trim() ||
      !this.claimDetails.trim()
    ) {
      alert('Please complete all required fields.');
      return;
    }

    if (!this.signatureData) {
      alert('Please provide your digital signature before submitting.');
      return;
    }

    if (!this.item() || this.item().reportType !== 'found') {
      alert('Only found items can be claimed.');
      return;
    }
    
    if (this.item().status !== 'open') {
      alert('This item is no longer available for claiming.');
      return;
    }

    this.isSubmittingClaim.set(true);

    const claimData = {
      item: this.item()._id,
      claimantName: this.claimantName.trim(),
      contactNumber: this.contactNumber.trim(),
      email: this.email.trim(),
      claimDetails: this.claimDetails.trim(),
      signatureData: this.signatureData
    };

    this.http.post<any>(
      'http://localhost:5000/api/claims',
      claimData
    ).subscribe({
      next: (response) => {
        console.log('Claim submitted successfully:', response);

        this.claimReference.set(response.claimReference);

        this.closeClaimModal();

        this.claimantName = '';
        this.contactNumber = '';
        this.email = '';
        this.claimDetails = '';

        this.clearSignature();

        this.isSubmittingClaim.set(false);
      },
      error: (error) => {
        console.error('Claim submission failed:', error);

        alert(error.error?.message || 'Failed to submit claim.');

        this.isSubmittingClaim.set(false);
      }
    });
  }

  // COPY CLAIM REFERENCE
  copyClaimReference(): void {
    navigator.clipboard.writeText(this.claimReference())
      .then(() => {
        alert('Claim reference number copied successfully!');
      })
      .catch(() => {
        alert('Unable to copy reference number. Please copy it manually.');
      });
  }
}