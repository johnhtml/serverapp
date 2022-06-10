import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Status } from '../emun/status.enum';
import { CustomResponse } from '../interface/custom-response';
import { Server } from '../interface/server';



@Injectable({
  providedIn: 'root'
})
export class ServerService {

  private readonly apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  /* 
  This is the procedural way to implement the function
  getServers(): Observable<CustomResponse> {
    return this.http.get<CustomResponse>(`http://localhost:8080/server/list`);
  }
  */

  servers$ = <Observable<CustomResponse>>
    this.http.get<CustomResponse>(`${this.apiUrl}/server/list`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );


  save$ = (server: Server) => <Observable<CustomResponse>>
    this.http.post<CustomResponse>(`${this.apiUrl}/server/save`, server)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );


  ping$ = (ipAddress: string) => <Observable<CustomResponse>>
    this.http.get<CustomResponse>(`${this.apiUrl}/server/ping/${ipAddress}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );


  filter$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>>
    new Observable<CustomResponse>(
      suscriber => {
        console.log(response);
        suscriber.next(
          status === Status.ALL ? { ...response, message: `Servers filtered by ${status} status` } :
            {
              ...response,
              message: response.data.servers ?
                (
                  response.data.servers.filter(server => server.status === status).length > 0 ?
                    `Servers filtered by ${status === Status.SERVER_UP ? 'SERVER_UP' : 'SERVER_DOWN'} status`
                    :
                    `No servers of ${status} found`
                )
                : 'No data loaded from server',
              data: {
                servers: response.data.servers?.filter(server => server.status === status)
              }
            }
        );
        suscriber.complete();
      }
    )
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  delete$ = (serverId: number) => <Observable<CustomResponse>>
    this.http.delete<CustomResponse>(`${this.apiUrl}/server/delete/${serverId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );


  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError(() => new Error(`An error occurred - Error code: ${error.status}`));
  }
}
