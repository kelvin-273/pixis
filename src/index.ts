import { Observable, interval, fromEvent } from "rxjs";
import {} from 'rxjs/operators';

const mouseDownObs = fromEvent(document, 'mousedown');
const mouseUpObs = fromEvent(document, 'mouseup');

mouseDownObs.subscribe((e) => console.log("there we go!"));
mouseUpObs.subscribe((e) => console.log("DROP THE MOUSE!"));

console.log("hello");

const obs: Observable<number> = interval(1000);
obs.subscribe(console.log);
