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
  selectedCodec: string;
  selectedParameter: string;
  selectedContainer: string;
  ws: WebSocket = null;

  constructor() {

  }

  ngOnInit() {
    this.codecList.push('Speex');

    this.paraList.push('NB');
    this.paraList.push('WB');
    this.paraList.push('UWB');

    this.containerList.push('None');
    this.containerList.push('Nuance Frame');


  }

  browseFile(fileInput: Event) {
    console.log('browser file');
    this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];
  }

  sendToServer() {
    console.log('sending to server');
    console.log(this.selectedCodec);

    const query_begin = {
      message: 'query_begin',
      codec: this.selectedCodec,
      parameter: this.selectedParameter,
      container: this.selectedContainer
    };
    const fr: FileReader = new FileReader();
    fr.readAsArrayBuffer(this.selectedFile);
    const query_end = {
      message: 'query_end',
    };

    this.ws = new WebSocket('ws://' + location.host + '/ws');
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify(query_begin));
      this.ws.send(fr.result);
      this.ws.send(JSON.stringify(query_end));
    };

    const _ws = this.ws;
    let rate = 8000;
    this.ws.onmessage = function (event) {
      console.log(event.data);
      if (typeof(event.data) === 'string') {
        const res = JSON.parse(event.data);
        if (res['message'] === 'res_begin') {
          console.log('res_begin');
          rate = res['rate'];
        }
        if (res['message'] === 'res_end') {
          console.log('res_end');
          _ws.close();
        }
      } else {
        const pcm16Buffer = new Int16Array(event.data);
        const audioToPlay = new Float32Array(pcm16Buffer.length);
        for (let i = 0; i < pcm16Buffer.length; i++) {
          audioToPlay[i] = pcm16Buffer[i] / 32768;
        }
        // audioToPlay.set(event.data, 0);

        const audioContext = new ((<any>window).AudioContext || (<any>window).webkitAudioContext)();
        const audioBuffer = audioContext.createBuffer(1, audioToPlay.length, rate);
        const source = audioContext.createBufferSource();

        audioBuffer.getChannelData(0).set(audioToPlay);
        source.buffer = audioBuffer;

        source.connect(audioContext.destination);
        source.start(0);

      }

    };
  }

  codecChange($event) {
    const index = (<HTMLSelectElement>$event.target).selectedIndex - 1;
    if (index >= 0 && index < this.codecList.length) {
      this.selectedCodec = this.codecList[index];
    } else {
      this.selectedCodec = this.codecList[0];
    }
  }

  paraChange($event) {
    const index = (<HTMLSelectElement>$event.target).selectedIndex - 1;
    if (index >= 0 && index < this.paraList.length) {
      this.selectedParameter = this.paraList[index];
    } else {
      this.selectedParameter = this.paraList[0];
    }
  }

  containerChange($event) {
    const index = (<HTMLSelectElement>$event.target).selectedIndex - 1;
    if (index >= 0 && index < this.containerList.length) {
      this.selectedContainer = this.containerList[index];
    } else {
      this.selectedContainer = this.containerList[0];
    }
  }
}
