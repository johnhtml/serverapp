import { DataState } from "../emun/data-state.enum";

export interface AppState<T> {
    //thi is going to be LOADING, LOADED or ERROR
    dataState: DataState;
    //we will have either appData or error but not both
    appData?: T;
    error?: string;
}
