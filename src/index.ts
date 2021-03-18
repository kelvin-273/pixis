import { Observable, interval } from "rxjs";
import {} from 'rxjs/operators';

console.log("hello");

const obs: Observable<number> = interval(1000);
obs.subscribe(console.log);
