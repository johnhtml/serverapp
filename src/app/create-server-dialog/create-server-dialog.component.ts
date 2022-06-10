import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Server } from '../interface/server';

@Component({
  selector: 'app-create-server-dialog',
  templateUrl: './create-server-dialog.component.html',
  styleUrls: ['./create-server-dialog.component.scss']
})
export class CreateServerDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<CreateServerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Server) { }

  ngOnInit(): void {

  }

  saveDetails(form: NgForm) {
    this.dialogRef.close();
  }
}
