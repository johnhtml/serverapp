import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, startWith } from 'rxjs';
import { DataState } from './emun/data-state.enum';
import { Status } from './emun/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { Server } from './interface/server';
import { ServerService } from './service/server.service';
import { CreateServerDialogComponent } from './create-server-dialog/create-server-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from './service/notification.service';
import { ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  //the next line, the component is gonna check the changes
  //when a the component initializes,
  //this can be done because our variables are Observables,
  //i.e. we have appState$ as Observable
  //The default strategy checks all the time for
  //changes in all variables, fir that reason
  //its resources requirement can be high
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private i = 1;
  @ViewChild('tabla') table!: MatTable<any>;
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

  constructor(private serverService: ServerService, public dialog: MatDialog, private notifier: NotificationService) { }


  openDialog(): void {
    const dialogRef = this.dialog.open(CreateServerDialogComponent, {
      width: '400px',
      data: {} as Server,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.saveServer(result) }
    });
  }


  getDataSource<server>(server: Server, servers: Server[]): string {

    return "asdf" //this.appState$?.
    //.pipe(appData?.data?.servers.filter(x => x.id === row.id)?.status;
  }


  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          this.notifier.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED_STATE, appData: { ...response, data: { servers: response.data.servers?.reverse() } } }
        }),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: string) => {
          this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error: error });
        })
      );
  }

  pingAndRerenderTable(ipAddress: string): void {
    if (this.i === 1 && this.table) {
      this.dataSubject.subscribe(() => {
        this.table.renderRows();
      });
      this.i = 2;
    }
    this.pingServer(ipAddress);
  }

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(response => {
          this.filterSubject.next('');
          this.notifier.onDefault(response.message);
          response.data.server && this.dataSubject.value.data.servers
            ?
            this.dataSubject.value.data.servers[
            this.dataSubject.value.data.servers.findIndex(
              server => server.id === response.data.server?.id
            )
            ] = response.data.server
            :
            null;
          this.dataSubject.next(this.dataSubject.value);
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.filterSubject.next('');
          this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error: error });
        })
      );
  }


  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          this.notifier.onDefault(response.message);
          return { dataState: DataState.LOADED_STATE, appData: response }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notifier.onError(error);
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
          this.notifier.onDefault(response.message);
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
          this.notifier.onError(error);
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
          this.notifier.onDefault(response.message);
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error: error });
        })
      );
  }


  printReport(): void {
    window.print();
  }

  downloadExcel(): void {
    this.notifier.onDefault('Report downloaded');
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
