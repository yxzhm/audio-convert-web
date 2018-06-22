import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  codecList: string[] = [];
  paraList: string[] = [];
  containerList: string[] = [];
  selectedFile: File = null;

  constructor() {
  }

  ngOnInit() {
    this.codecList.push('Speex');

    this.paraList.push('NB');
    this.paraList.push('WB');
    this.paraList.push('UB');

    this.containerList.push('None');
    this.containerList.push('Nuance Frame');
  }

  browseFile(fileInput: Event) {
    console.log('browser file');
    // let file = fileInput.target.files[0];
    // let fileName = file.name;
    this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];
  }

  sendToServer() {
    console.log('sending to server');
  }


}
