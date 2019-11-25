import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-informacoes',
  templateUrl: './informacoes.page.html',
  styleUrls: ['./informacoes.page.scss'],
})
export class InformacoesPage implements OnInit {
  public eventos: Observable<any[]>;

  constructor(public db: AngularFirestore, ) {
    this.eventos = this.db.collection('eventos', ref => ref.orderBy('dataInicio', 'asc')).valueChanges();
  }

  ngOnInit() {
  }

}
