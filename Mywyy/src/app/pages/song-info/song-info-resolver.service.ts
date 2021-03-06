import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { SongSheet, Lyric, Song } from 'src/app/service/data-types/common.types';
import { Observable, forkJoin } from 'rxjs';
import { SongService } from 'src/app/service/song.service';
import { first } from 'rxjs/internal/operators';

type SongDataModel = [Song, Lyric];

@Injectable()
export class SongInfoResolverService implements Resolve<SongDataModel> {
    constructor(private songServe: SongService) {}
    resolve(route: ActivatedRouteSnapshot): Observable<SongDataModel> {
        const id = route.paramMap.get('id');
        return forkJoin([
            this.songServe.getSongDetail(id),
            this.songServe.getLyric(Number(id))
        ]).pipe(first());
    }
}