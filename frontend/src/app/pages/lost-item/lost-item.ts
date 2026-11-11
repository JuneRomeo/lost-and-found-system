import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ImageUpload } from '../../shared/image-upload/image-upload';

@Component({
  imports: [RouterLink, FormsModule, ImageUpload],
  selector: 'app-lost-item',
  styleUrl: './lost-item.css',
  templateUrl: './lost-item.html',
})
export class LostItem {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  itemName = '';
  description = '';
  category = '';
  location = '';
  dateLostFound = '';
  selectedImage: File | null = null;

  successMessage = '';
  private submissionInProgress = false;

  onImageSelected(file: File | null): void {
    this.selectedImage = file;
  }

  onSubmit(): void {
    if (this.submissionInProgress) return;

    if (
      !this.itemName.trim() ||
      !this.description.trim() ||
      !this.category ||
      !this.location.trim() ||
      !this.dateLostFound
    ) {
      alert('Please complete all required fields.');
      return;
    }

    this.submissionInProgress = true;
    this.successMessage = '';

    if (this.selectedImage) {
      const formData = new FormData();
      formData.append('image', this.selectedImage);

      this.http.post<any>(
        'http://localhost:5000/api/upload',
        formData
      ).subscribe({
        next: (uploadResponse) => {
          this.saveLostItem(
            uploadResponse.imageUrl,
            uploadResponse.publicId
          );
        },
        error: (error) => {
          console.error('Image upload failed:', error);
          alert('Image upload failed. Please try again.');
          this.submissionInProgress = false;
        }
      });
    } else {
      this.saveLostItem('', '');
    }
  }

  saveLostItem(imageUrl: string, imagePublicId: string): void {
    const lostItemData = {
      reportType: 'lost',
      itemName: this.itemName.trim(),
      description: this.description.trim(),
      category: this.category,
      location: this.location.trim(),
      dateLostFound: this.dateLostFound,
      imageUrl,
      imagePublicId
    };

    this.http.post<any>(
      'http://localhost:5000/api/items/lost',
      lostItemData
    ).subscribe({
      next: (response) => {
        console.log('Lost item successfully saved!', response);

        this.successMessage =
          'Your lost item report was submitted successfully!';

        this.itemName = '';
        this.description = '';
        this.category = '';
        this.location = '';
        this.dateLostFound = '';
        this.selectedImage = null;

        this.submissionInProgress = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error submitting lost item:', error);
        alert('Failed to submit lost item report. Please try again.');
        this.submissionInProgress = false;
      }
    });
  }

  dismissSuccess(): void {
    this.successMessage = '';
  }
}