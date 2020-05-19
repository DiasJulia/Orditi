import { Component, OnInit } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Map, latLng, tileLayer, Layer, marker, circle, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Router } from '@angular/router';
import { MapaModalPage } from '../mapa-modal/mapa-modal.page';
import { ModalController } from '@ionic/angular';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';
import { AlertController } from '@ionic/angular';

import { Camera, CameraOptions } from '@ionic-native/camera/ngx';

import { AlertasService } from '../services/alertas.service';
import { AngularFirestore } from '@angular/fire/firestore';

import * as L from 'leaflet';

import * as firebase from 'firebase';
import { AppModule } from '../app.module';
import { CameraService } from '../services/camera/camera.service';

import * as moment from 'moment';

//Configuração dos markers do leaflet
const iconRetinaUrl = '../../assets/leaflet/images/marker-icon-2x.png';
const iconUrl = '../../assets/leaflet/images/marker-icon.png';
const shadowUrl = '../../assets/leaflet/images/marker-shadow.png';

const LeafIcon = L.Icon.extend({
  // iconRetinaUrl,
  // iconUrl,
  options: {
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  }
});

const defaultIcon = new LeafIcon({ iconUrl: '../../assets/leaflet/images/marker-icon.png' }),
  ambulanteIcon = new LeafIcon({ iconUrl: '../../assets/leaflet/images/ambulante-marker-icon.png' }),
  denunciaIcon = new LeafIcon({ iconUrl: '../../assets/leaflet/images/denuncia-marker-icon.png' });
// L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-denuncia',
  templateUrl: './denuncia.page.html',
  styleUrls: ['./denuncia.page.scss'],
})
export class DenunciaPage implements OnInit {

  // Var Camera
  public imgDenuncia = '../../assets/img/vetor.png';

  metadata = {
    contentType: 'image/jpeg',
  };

  public dataDenuncia: Date = new Date();
  public horaDenuncia: Date = new Date();
  public localDenuncia: any;
  public infoDenuncia;
  public local: any;
  public seunome: any;

  public imgAut;

  //Variaveis do mapa
  L: any = null;
  mostraMapa: boolean = false;



  map2: Map = null;
  lat: any;
  long: any;
  latLngC: any;
  routes = [
    {
      path: '',
      redirectTo: 'home'
    }
  ];

  returnHome() {
    this.router.navigate(['/home']);
  }

  constructor(
    private geolocation: Geolocation,
    public alertas: AlertasService,
    private nativeGeocoder: NativeGeocoder,
    public alertController: AlertController,
    public camera: Camera,
    public router: Router,
    public db: AngularFirestore,
    public modalController: ModalController,
    public usarCamera: CameraService
  ) {
    this.imgAut = "../../assets/img/avatar.svg";
  }




  // Função para camera

  cam() {
    this.usarCamera.presentActionSheet();
    if (this.usarCamera.imgPessoa) {
      this.imgAut = this.usarCamera.imgPessoa;
    }

  }


  ngOnInit() {
  }

  /** Load leaflet map **/
  leafletMap() {
    this.mostraMapa = true;
    console.log('Mostrando mapa')
    if (this.map2 !== 'undefined' && this.map2 !== null) {
      this.map2.remove();
    }
    else {
      /** Get current position **/
      this.geolocation.getCurrentPosition().then((resp) => {
        this.lat = resp.coords.latitude;
        this.long = resp.coords.longitude;

        this.map2 = new Map('mapId2').setView([this.lat, this.long], 18);
        this.map2.on('click', (e) => { this.mapMarker(e); });

        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>', maxZoom: 18
        }).addTo(this.map2);

      }).catch((error) => {
        console.log('Error getting location', error);
      });
    }
  }

  mapRemove() {
    //this.map2.remove(); -> Isso tava fazendo dar um erro bem grande
    this.returnHome();
  }

  mapMarker(e) {
    console.log("Objeto: ", e);
    console.log("Latlng: ", e.latlng);
    console.log("Lat: ", e.latlng.lat);
    console.log("Lng: ", e.latlng.lng);
    if (this.L !== null) {
      this.map2.removeLayer(this.L);
    }
    this.L = marker(e.latlng, { icon: ambulanteIcon })

    this.L.addTo(this.map2).bindPopup('Você selecionou esse ponto').openPopup();
    this.local = e.latlng;

    let options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5
    };

    this.nativeGeocoder.reverseGeocode(e.latlng.lat, e.latlng.lng, options)
      .then((result: NativeGeocoderResult[]) => {
        this.localAtual("" + result[0].subAdministrativeArea + " " + result[0].subLocality + " " + result[0].thoroughfare);
      })
      .catch((error: any) => {
        this.geocoderTesteError(error);
      });
  }

  localAtual(endereco) {
    this.localDenuncia = endereco;
  }



  // DATA DO OCORRIDO
  mudaData(event) {
    this.dataDenuncia = new Date(event.detail.value);
    console.log('DIA', this.dataDenuncia);

  }
  mudaHora(event) {
    this.horaDenuncia = new Date(event.detail.value);
    console.log('Chegada:', this.horaDenuncia);
  }

  // ENVIAR DENUNCIA
  subDenuncia() {
    if (this.dataDenuncia === undefined || this.horaDenuncia === undefined ||
      this.infoDenuncia === undefined || this.local === undefined || this.seunome === undefined) {
      this.alertas.presentToast('Preencha os campos!');
    } else {
      if (this.localDenuncia === undefined) {
        this.localDenuncia = " ";
      }
      const dados = {
        dataDenuncia: this.dataDenuncia,
        horaDenuncia: this.horaDenuncia,
        localDenuncia: this.localDenuncia,
        infoDenuncia: this.infoDenuncia,
        foto: "",
        local: new firebase.firestore.GeoPoint(this.local.lat, this.local.lng)
      };
      console.log(dados)

      this.presentAlertDenuncia(dados)
      // COLOCA AQUI para envia dados da denuncia ao banco
      // Falta enviar a foto
      // E como tranformar o local no nome da rua
    }

  }

  Fiscal() {
    return AppModule.getUsuarioStatus();
    console.log(AppModule.getUsuarioStatus())
  }

  async geocoderTesteError(e) {
    const alert = await this.alertController.create({
      header: 'Erro',
      message: '' + e,
      buttons: ['OK']
    });

    await alert.present();
  }

  async presentAlertDenuncia(dados) {
    var resp: string = ' ';

    const alert = await this.alertController.create({
      header: 'Atenção',
      message: "Deseja registrar essa denuncia?",
      buttons: [
        {
          text: 'Fechar',
          role: 'cancel',

        }, {
          text: 'Registrar',
          handler: async () => {
            try {
              //Comando para adicionar imagem ao firebase storage - > após adicionar o arquivo pega o id de busca dele e armazena num atributo de dados
              if (this.usarCamera.imgDato) {
                let id = this.seunome + moment(this.dataDenuncia).format('DD-MM-YYYY:HH');
                firebase.storage().ref().child('denuncia/' + id + '.jpg').putString(this.usarCamera.imgDato, 'base64', this.metadata).then(doc => {
                  firebase.storage().ref().child('denuncia/' + id + '.jpg').getDownloadURL().then(url => {
                    dados.foto = url;
                    this.db.collection("denuncias").add(dados);
                  });
                }
                );
              } else {
                this.db.collection("denuncias").add(dados);
              }
              this.router.navigate(['/home']);
              this.alertas.presentToast('Executado com sucesso!')
              console.log('Executando')
            } catch (erro) {
              this.alertas.presentToast('Não foi possível realizar a denuncia!')
              console.log('Executando, mas com erro')
            }
          }
        }
      ]
    });

    await alert.present();
    return resp;
    console.log(resp);
  }
}