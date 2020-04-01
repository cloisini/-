import { Component, OnInit, Input, TemplateRef, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, OnChanges, ViewContainerRef } from '@angular/core';
import { fromEvent, from } from 'rxjs';
import { pluck, debounceTime, distinct, distinctUntilChanged } from 'rxjs/internal/operators';
import { isBoolean } from 'util';
import { SearchResult } from 'src/app/service/data-types/common.types';
import { isEmptyObject } from 'src/app/utils/tools';
import { Overlay, OverlayRef} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { WySearchPanelComponent } from './wy-search-panel/wy-search-panel.component';

@Component({
  selector: 'app-wy-search',
  templateUrl: './wy-search.component.html',
  styleUrls: ['./wy-search.component.less']
})
export class WySearchComponent implements OnInit, AfterViewInit, OnChanges {
  

  @Input() customView: TemplateRef<any>;
  @Input() searchResult: SearchResult;
  @Input() connectedRef: ElementRef;


  @Output() onSearch = new EventEmitter<string>();

  private overlayRef: OverlayRef;

  @ViewChild('search', {static: false}) private defaultRef: ElementRef;
  @ViewChild('nzInput', {static: false}) private nzInput: ElementRef;

  search
  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit(){
    fromEvent(this.nzInput.nativeElement, 'input')
    .pipe(debounceTime(300), distinctUntilChanged(), pluck('target', 'value'))
    .subscribe((value: string) => {
      console.log('value :', value);
      this.onSearch.emit(value);
    })
  }
  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
    if (changes['searchResult'] && !changes['searchResult'].firstChange) {
      if (!isEmptyObject(this.searchResult)) {
        this.showOverlayPanel();
      } else {
        this.showOverlayPanel();
      }
    }
  }
  onFocus() {
    if (!isEmptyObject(this.searchResult)) {
      this.showOverlayPanel();
    }
  }
  onBlur() {
    this.hideOverlayPanel();
  }

  showOverlayPanel () {
    this.hideOverlayPanel();
    const positionStrategy = this.overlay.position()
    .flexibleConnectedTo(this.connectedRef || this.defaultRef)
    .withPositions([{
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top'
    }]).withLockedPosition(true);
    this.overlayRef = this.overlay.create({
      //hasBackdrop: true,
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });
    const panelPortal = new ComponentPortal(WySearchPanelComponent, this.viewContainerRef);
    const panelRef = this.overlayRef.attach(panelPortal);
    panelRef.instance.searchResult = this.searchResult;
    this.overlayRef.backdropClick().subscribe(() => {
      this.hideOverlayPanel();
    });
  }
  hideOverlayPanel () {
    if (this.overlayRef && this.overlayRef.hasAttached) {
      this.overlayRef.dispose();
    }
  }

}
