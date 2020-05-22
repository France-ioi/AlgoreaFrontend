import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'lib-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
})
export class ImageUploadComponent implements OnInit {
  @Input() label;

  imgURL;
  imagePath;

  constructor() {}

  ngOnInit() {}

  uploadImage(files) {
    if (files.length === 0) {
      return;
    }

    const mimeType = files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }

    const reader = new FileReader();
    this.imagePath = files;
    reader.readAsDataURL(files[0]);
    reader.onload = (event) => {
      this.imgURL = reader.result;
    };
  }

  removeImage(e) {
    this.imgURL = null;
  }
}
