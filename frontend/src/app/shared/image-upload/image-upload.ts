
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-image-upload',
  styleUrl: './image-upload.css',
  templateUrl: './image-upload.html',
})
export class ImageUpload {

  selectedFile: File | null = null;
  @Output() fileSelected = new EventEmitter<File | null>();
  imagePreview: string | null = null;


onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  // Check if the selected file is an image
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');

    this.selectedFile = null;
    this.imagePreview = null;
    this.fileSelected.emit(null);

    input.value = '';
    return;
  }

  // Check if the image is larger than 5 MB
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must not exceed 5 MB.');

    this.selectedFile = null;
    this.imagePreview = null;
    this.fileSelected.emit(null);

    input.value = '';
    return;
  }

  this.selectedFile = file;
  this.fileSelected.emit(file);

  // Generate image preview
  const reader = new FileReader();

  reader.onload = () => {
    this.imagePreview = reader.result as string;
  };

  reader.readAsDataURL(file);
}


  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.fileSelected.emit(null);
  }
}
