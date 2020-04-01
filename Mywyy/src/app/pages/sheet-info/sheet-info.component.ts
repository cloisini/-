import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, takeUntil } from 'rxjs/internal/operators';
import { SongSheet, Song, Singer } from 'src/app/service/data-types/common.types';
import { AppStoreModule } from 'src/app/store';
import { Store, select } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { getCurrentSong } from 'src/app/store/selectors/player.selector';
import { SongService } from 'src/app/service/song.service';
import { BatchActionsService } from 'src/app/store/batch-actions.service';
import { NzMessageBaseService, NzMessageService } from 'ng-zorro-antd';
import { findIndex } from 'src/app/utils/array';
import { ModalTypes } from 'src/app/store/reducers/member.reducer';
import { MemberService } from 'src/app/service/member.service';
import { SetShareInfo } from 'src/app/store/actions/member.actions';

@Component({
  selector: 'app-sheet-info',
  templateUrl: './sheet-info.component.html',
  styleUrls: ['./sheet-info.component.less']
})
export class SheetInfoComponent implements OnInit, OnDestroy{
 
  sheetInfo: SongSheet;
  description = {
    short: '',
    long: ''
  }

  controlDesc = {
    isExpand: false,
    label: '展开',
    iconCls: 'down'
  }

  currentSong: Song;
  currentIndex = -1;
  private appStore$: Observable<AppStoreModule>;
  private destory$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private store$: Store<{player: AppStoreModule}>,
    private songServe: SongService,
    private batchActionServe: BatchActionsService,
    private nzMessageServe: NzMessageService,
    private memberServe: MemberService,
    ) {
    this.route.data.pipe(map(res => res.sheetInfo)).subscribe(res => {
      console.log('res :', res);
      this.sheetInfo = res;
      if (res.description) {
        this.changeDescc(res.description);
      }
      this.listenCurrent();
    })
   }

  ngOnInit() {
  }
  private listenCurrent() {
    this.store$
    .pipe(select('player'), select(getCurrentSong), takeUntil(this.destory$))
    .subscribe(song => {
      console.log('song :', song);
      this.currentSong = song;
      if (song) {
        this.currentIndex = findIndex(this.sheetInfo.tracks, song);
      }else {
        this.currentIndex = -1;
      }
    });

  }

  private changeDescc (desc: string) {
    if (desc.length < 99) {
      this.description = {
        short: this.replaceBr('<b>介绍：</b>' + desc),
        long: ''
      }
    } else {
      //const str = '<b>介绍：</b>' + desc.replace(/\n/g,'<br />');
      this.description = {
        //short:  '<b>介绍：</b>' + desc.slice(0 ,99).replace(/\n/g,'<br />') + '...',
        short:  this.replaceBr('<b>介绍：</b>' + desc.slice(0 ,99)) + '...',
        long: this.replaceBr('<b>介绍：</b>' + desc)
      }
    }
  }

  private replaceBr(str: string): string {
    return str.replace(/\n/g,'<br />')
  }
 
  toggleDesc() {
    this.controlDesc.isExpand = !this.controlDesc.isExpand;
    if (this.controlDesc.isExpand){
      this.controlDesc.label = '收起';
      this.controlDesc.iconCls = 'up';
    } else {
      this.controlDesc.label = '展开';
      this.controlDesc.iconCls = 'down';
    }
  }
  //添加一首歌曲
  onAddSong(song: Song, isPlay = false) {
    if (!this.currentSong || this.currentSong.id !==  song.id) {
      this.songServe.getSongList(song).subscribe(list => {
        if (list.length) {
          this.batchActionServe.insertSong(list[0], isPlay)
        } else {
          this.nzMessageServe.create('waring','无url！');
        }
      });
    }
  }

  onAddSongs(songs: Song[], isPlay = false) {
    this.songServe.getSongList(songs).subscribe(list => {
      if (list.length) {
        this.batchActionServe.insertSongs(list);
        if (isPlay) {
          this,this.batchActionServe.selectPlayList({list, index: 0});
        } else {
          this,this.batchActionServe.insertSongs(list);
        }
      }
    })
  }

  // 收藏歌单
  onLikeSheet(id: string) {
    console.log('id :', id);
    this.memberServe.likeSheet(id).subscribe(() => {
      this.alertMessage('success', '收藏成功');
    }, error => {
      this.alertMessage('error', error.msg || '收藏失败');

    });
  }

  // 收藏歌曲
  onLikeSong(id: string) { 
    this.batchActionServe.likeSong(id);
  }

  // 分享
  shareResource(resource: Song | SongSheet, type = 'song') {
    let txt = '';
    if (type === 'playlist') {
      txt = this.makeTxt('歌单', resource.name, (<SongSheet>resource).creator.nickname);
    } else {
      txt = this.makeTxt('歌曲', resource.name, (<Song>resource).ar);
    }
    this.store$.dispatch(SetShareInfo({
       info: { id: resource.id.toString(), type, txt }
      }));
     console.log('txt :', txt);
  }
  private makeTxt (type: string, name: string, makeBy: string | Singer[]):string {
    let makeByStr = '';
    if (Array.isArray(makeBy)) {
      makeByStr = makeBy.map(item => item.name).join('/');
    } else {
      makeByStr = makeBy;
    }
    return `${type}: ${name} -- ${makeByStr}`;
  }

  private alertMessage (type: string, msg: string) {
    this.nzMessageServe.create(type, msg);
}

  ngOnDestroy(): void {
   this.destory$.next();
   this.destory$.complete();
  }

}
