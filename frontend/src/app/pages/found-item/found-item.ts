
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ImageUpload } from '../../shared/image-upload/image-upload';

@Component({
  imports: [RouterLink, FormsModule, ImageUpload],
  selector: 'app-found-item',
  styleUrl: './found-item.css',
  templateUrl: './found-item.html',
})
export class FoundItem {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  itemName = '';
  description = '';
  category = '';
  location = '';
  dateLostFound = '';

  selectedImage: File | null = null;

  turnoverCode = '';
  successMessage = '';
  copyMessage = '';

  private submissionInProgress = false;

  onImageSelected(file: File | null): void {
    this.selectedImage = file;
  }

  onSubmit(): void {

    // Prevent duplicate submissions
    if (this.submissionInProgress) {
      return;
    }

    // Validate required fields
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

    this.turnoverCode = '';
    this.successMessage = '';
    this.copyMessage = '';

    // Upload image if selected
    if (this.selectedImage) {
      const formData = new FormData();
      formData.append('image', this.selectedImage);

      this.http.post<any>(
        'http://localhost:5000/api/upload',
        formData
      ).subscribe({
        next: (uploadResponse) => {
          this.saveFoundItem(
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
      this.saveFoundItem('', '');
    }
  }

  saveFoundItem(
    imageUrl: string,
    imagePublicId: string
  ): void {

    const foundItemData = {
      reportType: 'found',
      itemName: this.itemName.trim(),
      description: this.description.trim(),
      category: this.category,
      location: this.location.trim(),
      dateLostFound: this.dateLostFound,
      imageUrl: imageUrl,
      imagePublicId: imagePublicId
    };

    this.http.post<any>(
      'http://localhost:5000/api/items/found',
      foundItemData
    ).subscribe({
      next: (response) => {

        console.log('Found item successfully saved!', response);

        const savedItem = response?.item ?? response;
        const generatedCode = savedItem?.turnoverCode;

        if (!generatedCode) {
          console.error('Turnover Code missing:', response);
          alert('Report saved, but Turnover Code was not returned. Please contact the administrator.');
          this.submissionInProgress = false;
          return;
        }

        // Display Turnover Code immediately
        this.turnoverCode = generatedCode;
        this.successMessage =
          'Your found item report was submitted successfully!';

        this.copyMessage = '';

        // Clear form fields
        this.itemName = '';
        this.description = '';
        this.category = '';
        this.location = '';
        this.dateLostFound = '';
        this.selectedImage = null;

        this.submissionInProgress = false;

        // Immediately update the Angular view
        this.cdr.detectChanges();

      },
      error: (error) => {
        console.error('Error submitting found item:', error);
        alert('Failed to submit found item report. Please try again.');
        this.submissionInProgress = false;
      }
    });
  }

  copyTurnoverCode(): void {
    if (!this.turnoverCode) {
      return;
    }

    navigator.clipboard.writeText(this.turnoverCode)
      .then(() => {
        this.copyMessage = 'Turnover Code copied successfully!';
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Copy failed:', error);
        this.copyMessage =
          'Copy failed. Please select and copy the code manually.';
        this.cdr.detectChanges();
      });
  }

  dismissSuccess(): void {
    this.turnoverCode = '';
    this.successMessage = '';
    this.copyMessage = '';
  }
}
