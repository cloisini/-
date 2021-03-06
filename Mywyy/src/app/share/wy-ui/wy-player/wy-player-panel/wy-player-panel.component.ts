import { Component, EventEmitter,OnInit, Input, OnChanges, SimpleChanges, Output, ViewChildren, QueryList, ElementRef, Inject } from '@angular/core';
import { Song } from 'src/app/service/data-types/common.types';
import { WyScrollComponent } from '../wy-scroll/wy-scroll.component';
import { findIndex } from 'src/app/utils/array';
import { timer } from 'rxjs';
import { SongService } from 'src/app/service/song.service';
import { WyLyric, BaseLyricLine } from './wy-lyric';

@Component({
  selector: 'app-wy-player-panel',
  templateUrl: './wy-player-panel.component.html',
  styleUrls: ['./wy-player-panel.component.less']
})
export class WyPlayerPanelComponent implements OnInit ,OnChanges {
  @Input() playing: boolean;
  @Input() songList: Song[];
  @Input() currentSong: Song;
  @Input() show: boolean;

  @Output() onClose = new EventEmitter<void>();
  @Output() onChangeSong = new EventEmitter<Song>();
  @Output() onDeleteSong = new EventEmitter<Song>();
  @Output() onClearSong = new EventEmitter<void>();
  @Output() onToInfo = new EventEmitter<[string, number]>();
  @Output() onLikeSong= new EventEmitter<string>();
  @Output() onShareSong = new EventEmitter<Song>();

  
  scrollY = 0;

  currentIndex: number;
  currentLyric: BaseLyricLine[];
  currentLineNum: number;

  private  lyric: WyLyric;
  private  lyricRefs: NodeList;
  private  startLine = 2; 

  @ViewChildren(WyScrollComponent) private wyScroll: QueryList<WyScrollComponent>;

  constructor(private songServe: SongService) { 
    
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void{
    if (changes['playing']) {
      if (!changes['playing'].firstChange) {
        this.lyric && this.lyric.togglePlay(this.playing);
      }
    }

    if (changes['songList']) {
      if (this.currentSong)  {
        this.updateCurrentIndex();
      }
    }

    if (changes['currentSong']) {
      if (this.currentSong) {
        this.updateCurrentIndex();
        this.updateLyic();
        if (this.show) {
          this.scrollToCurrent();
        }
      }else {
        this.resetLyric();
      }
     
    }

    if (changes['show']) {
      if (!changes['show'].firstChange && this.show)
      {
        this.wyScroll.first.refreshScroll();
        this.wyScroll.last.refreshScroll();
        /*timer(1000,2000)  第一个参数意为1000毫秒后执行，第二个参数为每两千毫秒执行一次，
        如果只有一个参数，那么就相当setTimeOut只执行一次*/
        timer(80).subscribe(() => {
          if (this.currentSong) {
            this.scrollToCurrent(0);
          }
          if (this.lyricRefs) {
            this.scrollToCurrentLyric(0);
          }
        }) ;
      }
    }
  }

  private updateCurrentIndex() {
    this.currentIndex = findIndex(this.songList, this.currentSong);
  }

  private updateLyic () {
    this.resetLyric();
    this.songServe.getLyric(this.currentSong.id).subscribe(res => {
      //console.log('res :', res);
      this.lyric = new WyLyric(res);
      this.currentLyric = this.lyric.lines;
      console.log('currentLyric :', this.currentLyric);
      this.startLine = res.tlyric ? 1 : 3;
      this.handleLyric();

      this.wyScroll.last.scrollTo(0, 0);
      
      console.log('this.playing :', this.playing);

      if (this.playing) {
        this.lyric.play();
      }
    });
  }

  private handleLyric() {
    this.lyric.handler.subscribe(({ lineNum }) => {
      if (!this.lyricRefs) {
        this.lyricRefs = this.wyScroll.last.el.nativeElement.querySelectorAll('ul li');
        console.log('this.lyricRefs :', this.lyricRefs);
      }
      if (this.lyricRefs.length) {
        this.currentLineNum =  lineNum;
        if (lineNum > this.startLine) { 
          this.scrollToCurrentLyric(300);
        }else {
          this.wyScroll.last.scrollTo(0 ,0);
        }
        
      }

    });
  }


  private resetLyric() {
    if (this.lyric) {
      this.lyric.stop();
      this.lyric = null;
      this.currentLyric = [];
      this.currentLineNum = 0;
      this.lyricRefs = null;
    }
  }

  seekLyric(time: number) {
    if (this.lyric) {
      this.lyric.seek(time);
    }
  }


  private scrollToCurrent(speend = 300) {
    const songListRefs = this.wyScroll.first.el.nativeElement.querySelectorAll('ul li');
    if (songListRefs.length) {
      const currentLi = <HTMLElement>songListRefs[this.currentIndex || 0];
      const offsetTop = currentLi.offsetTop;
      const offsetHeight = currentLi.offsetHeight;
      console.log('scrollY :', this.scrollY);
      console.log('offsetTop :', offsetTop);
      console.log('offsetHeight :', offsetHeight);
      if (((offsetTop - Math.abs(this.scrollY)) > offsetHeight * 5) || (offsetTop < Math.abs(this.scrollY))) {
        this.wyScroll.first.scrollToElement(currentLi, speend, false, false);
      }
    }
  }
  private scrollToCurrentLyric(speend = 300) {
    const targetLine = this.lyricRefs[this.currentLineNum - this.startLine];
    if (targetLine) {
      this.wyScroll.last.scrollToElement(targetLine, speend, false, false);
    }
  }

  toInfo(evt: MouseEvent, path: [string, number]) {
    evt.stopPropagation();//阻止冒泡
    this.onToInfo.emit(path);
  }
  likeSong(evt: MouseEvent, id: string) {
    evt.stopPropagation();
    this.onLikeSong.emit(id);
  }
  shareSong(evt: MouseEvent, song: Song) {
    evt.stopPropagation();
    this.onShareSong.emit(song);
  }
  
}
