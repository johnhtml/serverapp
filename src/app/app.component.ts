import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, catchError, map, Observable, of, startWith } from 'rxjs';
import { DataState } from './emun/data-state.enum';
import { Status } from './emun/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { Server } from './interface/server';
import { ServerService } from './service/server.service';
import { CreateServerDialogComponent } from './create-server-dialog/create-server-dialog.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  appState$!: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(<CustomResponse>{});
  filterStatus$ = this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  columns = [
    {
      columnDef: 'image',
      header: 'Image',
      cell: (element: Server) => `${element.imageUrl}`,
    },
    {
      columnDef: 'ipAddress',
      header: 'Ip Address',
      cell: (element: Server) => `${element.ipAddress}`,
    },
    {
      columnDef: 'name',
      header: 'Name',
      cell: (element: Server) => `${element.name}`,
    },
    {
      columnDef: 'memory',
      header: 'Memory',
      cell: (element: Server) => `${element.memory}`,
    },
    {
      columnDef: 'type',
      header: 'Type',
      cell: (element: Server) => `${element.type}`,
    },
    {
      columnDef: 'status',
      header: 'Status',
      cell: (element: Server) => `${element.status}`,
    },
    {
      columnDef: 'ping',
      header: 'Ping',
      cell: (element: Server) => ``,
    },
    {
      columnDef: 'actions',
      header: 'Actions',
      cell: (element: Server) => ``,
    },
  ];

  displayedColumns = this.columns.map(c => c.columnDef);

  constructor(private serverService: ServerService, public dialog: MatDialog) { }


  openDialog(): void {
    const dialogRef = this.dialog.open(CreateServerDialogComponent, {
      width: '400px',
      data: {} as Server,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.saveServer(result) }
    });
  }


  getDataSource<Server>(server?: Server, servers?: Server[]): Server[] {
    if (server) return [server];
    if (servers) return servers;
    return [];
  }


  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED_STATE, appData: { ...response, data: { servers: response.data.servers?.reverse() } } }
        }),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error: error });
        })
      );
  }


  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(response => {
          this.dataSubject.value.data.servers && response.data.server ?
            this.dataSubject.value.data.servers[
            this.dataSubject.value.data.servers.findIndex(
              server => server.id === response.data.server?.id
            )
            ] = response.data.server
            :
            null;
          this.filterSubject.next('');
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.filterSubject.next('');
          return of({ dataState: DataState.ERROR_STATE, error: error });
        })
      );
  }


  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          return { dataState: DataState.LOADED_STATE, appData: response }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error: error });
        })
      );
  }


  saveServer(serverForm: Server): void {
    this.isLoading.next(true);
    // serverForm.value as Server is equal to <Server>serverForm.value
    this.appState$ = this.serverService.save$(serverForm as Server)
      .pipe(
        map(response => {
          response.data.server && this.dataSubject.value.data.servers ?
            this.dataSubject.next(
              { ...response, data: { servers: [response.data.server, ...this.dataSubject.value.data.servers] } }
            ) : null;
          document.getElementById('closeModal')?.click();
          this.isLoading.next(false);
          //serverForm.resetForm({ status: this.Status.SERVER_DOWN });
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.isLoading.next(false);
          return of({ dataState: DataState.ERROR_STATE, error: error });
        })
      );
  }

  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id)
      .pipe(
        map(response => {
          this.dataSubject.next(
            {
              ...response, data: {
                servers: this.dataSubject.value.data.servers?.filter(
                  serv3r => serv3r.id !== server.id
                )
              }
            }
          );
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error: error });
        })
      );
  }


  printReport(): void {
    window.print();
  }

  downloadExcel(): void {
    let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    let tableSelect = document.getElementById('servidores');
    let tableHtml = tableSelect?.outerHTML.replace(/ /g, '%20');
    let downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
    downloadLink.download = 'server-report.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}
