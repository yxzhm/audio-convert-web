import {Injectable} from '@angular/core';
import {Observable, Subject, ReplaySubject, from, of, range, Observer} from 'rxjs';
import {map, filter, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
@Injectable()
export class WebsocketService {
  constructor() {
  }

  private subject: Subject<MessageEvent>;

  public connect(url): Subject<MessageEvent> {
    if (!this.subject) {
      this.subject = this.create(url);
      console.log('Successfully connected: ' + url);
    }
    return this.subject;
  }

  private create(url): Subject<MessageEvent> {
    const ws = new WebSocket(url);

    const observable = Observable.create(
      (obs: Observer<MessageEvent>) => {
        ws.onmessage = obs.next.bind(obs);
        ws.onerror = obs.error.bind(obs);
        ws.onclose = obs.complete.bind(obs);
        return ws.close.bind(ws);
      });
    const observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      }
    };
    return Subject.create(observer, observable);
  }

}
