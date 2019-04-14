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

  showLoading: boolean = false;
  showPlayer: boolean = false;
  showError: boolean = false;
  playing: boolean = false;
  customProgress: number = 0;
  customProgressStep: number = 0;
  tip: string = '';
  interval;

  audioContext = null;
  source = null;
  audioBuffer = null;

  constructor() {
    this.audioContext = new ((<any>window).AudioContext || (<any>window).webkitAudioContext)();
    this.startTimer();
  }

  ngOnInit() {
    this.codecList.push('Speex');
    this.codecList.push('Opus');
    this.showLoading = false;
  }

  browseFile(fileInput: Event) {
    console.log('browser file');
    this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];
    this.showLoading = false;
  }

  sendToServer() {
    let _t = this;
    this.customProgress = 0;
    this.customProgressStep = 0;
    this.showPlayer = false;
    this.showLoading = true;
    this.showError = false;
    this.tip="";

    console.log('sending to server');
    console.log(this.selectedCodec);

    this.stop();

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
    const _ws = this.ws;

    this.ws = new WebSocket('wss://' + location.host + '/ws');
    // this.ws = new WebSocket('wss://' + 'audio.yxzhm.com' + '/ws');
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = () => {

      this.ws.send(JSON.stringify(query_begin));
      this.ws.send(fr.result);
      this.ws.send(JSON.stringify(query_end));
    };


    let rate = 8000;
    this.ws.onerror = function (event) {
      _t.showLoading = false;
      console.log('websocket error');
    };
    this.ws.onclose = function (event) {
      _t.showLoading = false;
      if (!_t.showPlayer){
        _t.showError=true;
      }
      console.log('ws closed');
    };
    this.ws.onmessage = function (event) {
      console.log(event.data);
      if (typeof (event.data) === 'string') {
        const res = JSON.parse(event.data);
        if (res['message'] === 'res_begin') {
          console.log('res_begin');
          rate = res['rate'];

        }
        if (res['message'] === 'res_end') {
          console.log('res_end');
          _t.showLoading = false;
          this.close();
        }
      } else {
        const pcm16Buffer = new Int16Array(event.data);
        const audioToPlay = new Float32Array(pcm16Buffer.length);
        for (let i = 0; i < pcm16Buffer.length; i++) {
          audioToPlay[i] = pcm16Buffer[i] / 32768;
        }

        _t.audioBuffer = _t.audioContext.createBuffer(1, audioToPlay.length, rate);
        _t.audioBuffer.getChannelData(0).set(audioToPlay);

        _t.play(0);

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

    this.paraList = [];
    this.containerList = [];

    if (this.selectedCodec === 'Speex') {

      this.paraList.push('NB');
      this.paraList.push('WB');
      this.paraList.push('UWB');

      this.containerList.push('None');
      this.containerList.push('Nuance Frame');
    }

    if (this.selectedCodec === 'Opus') {
      this.paraList.push('8K');
      this.paraList.push('12K');
      this.paraList.push('16K');
      this.paraList.push('24K');
      this.paraList.push('48K');

      this.containerList.push('Nuance Frame');
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

  play(progress) {
    let _t = this;
    this.stop();

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.audioContext.destination);
    this.source.onended = function (event) {
      _t.playing = false;
      console.log('Play Stopped');
    };
    if (this.source.buffer.duration>1) {
      this.showPlayer = true;
      this.tip = this.source.buffer.duration+"s";
      let offset = ((this.source.buffer.duration * progress) / 100).toFixed(2);
      console.log("progress " + progress);
      console.log('Play Starting, the duration is ' + this.source.buffer.duration + ' the offset is ' + offset);
      this.customProgress = +progress;
      this.customProgressStep = +((100 / this.source.buffer.duration).toFixed(0));

      this.playing = true;
      this.source.start(0, offset);
    }else{
      _t.showError=true;
    }

  }

  stop() {
    if (this.playing) {
      console.log('Play Stopping ');
      this.source.stop(0);
      this.source.disconnect();
    }
  }

  setRam(value) {
    console.log('Play audio at ' + value + '%');
    this.play(value);
  }

  startTimer() {
    let _t = this;
    this.pauseTimer();
    this.interval = setInterval(() => {
      // console.log("Timer Progress is "+_t.customProgress);
      // console.log("Timer Progress step is "+_t.customProgressStep);
      if (_t.customProgressStep > 0 && _t.customProgress<100) {
        _t.customProgress = _t.customProgress + _t.customProgressStep;
      }
    }, 1000);
  }

  pauseTimer() {
    console.log('pauseTimer');
    if (this.interval != null) {
      clearInterval(this.interval);
    }
  }
}
