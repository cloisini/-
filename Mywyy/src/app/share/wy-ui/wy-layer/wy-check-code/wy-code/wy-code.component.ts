import { Component, OnInit, ChangeDetectionStrategy, forwardRef, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators';
import { BACKSPACE } from '@angular/cdk/keycodes'
import { format } from 'url';

const CODELEN = 4;

@Component({
  selector: 'app-wy-code',
  templateUrl: './wy-code.component.html',
  styleUrls: ['./wy-code.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WyCodeComponent),
      multi: true
    }
  ]
})
export class WyCodeComponent implements OnInit, ControlValueAccessor, AfterViewInit, OnDestroy {
 


  inputArr = [];
  inputsEl: HTMLElement[];
  private code: string;
  private destory$ = new Subject();

  result: string[] = [];
  currentFocusIndex = 0;

  @ViewChild('codeWrap', {static: true}) private codeWrap: ElementRef; 
  constructor(private cdr: ChangeDetectorRef) {
    this.inputArr = Array(CODELEN).fill('');
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.inputsEl = this.codeWrap.nativeElement.getElementsByClassName('item') as HTMLElement[] ;
    console.log('inputEl :', this.inputsEl);
    this.inputsEl[0].focus();
    for (let a = 0; a < this.inputsEl.length; a++) {
      const item = this.inputsEl[a];
      fromEvent(item, 'keyup').pipe(takeUntil(this.destory$)).subscribe((event: KeyboardEvent) => {
        this.listenKeyUp(event)
      });
      fromEvent(item, 'click').pipe(takeUntil(this.destory$)).subscribe((event: KeyboardEvent) => {
        this.currentFocusIndex = a;
      });

    }
  }

  private listenKeyUp(event: KeyboardEvent) {
    const target = <HTMLInputElement>event.target;
    const value = target.value;
    const isBackSpack = event.keyCode === BACKSPACE;
    if (/\D/.test(value)) {
      target.value = '';
      this.result[this.currentFocusIndex] = '';
    } else if (value) {
      this.result[this.currentFocusIndex] = value;
      this.currentFocusIndex = (this.currentFocusIndex + 1) % CODELEN;
      this.inputsEl[this.currentFocusIndex].focus();
    } else if (isBackSpack) {
      this.result[this.currentFocusIndex] = '';
      this.currentFocusIndex = Math.max(this.currentFocusIndex - 1, 0);
      this.inputsEl[this.currentFocusIndex].focus();
    }
    this.checkResult(this.result);
    console.log('this.result :', this.result);
  }

  private checkResult(result: string[]) {
    const codeStr = result.join('');
    this.setValue(codeStr);
  }

  private setValue(code: string) {
    this.code = code;
    this.onValueChange(code);
    this.cdr.markForCheck();
  }

  private onValueChange(value: string): void {

  }

  private onTouched(): void {
    
  }

  writeValue(value: string): void {
    this.setValue(value);
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onValueChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {
    this.destory$.next();
  }
}
