import { Injectable } from '@angular/core';
import {AppSettings} from "../settings/AppSettings";
import {HxDRClient} from "../settings/HxDRClient";
import {v4 as uuidv4} from 'uuid';

const CODE_VERIFIER_PREFIX = 'CODE_VERIFIER_';

export enum AuthState {
  Loading = "Loading",
  Authenticated = "Authenticated",
  NotAuthenticated = "NotAuthenticated",
}

@Injectable({
  providedIn: 'root'
})
export class HxDRAuthService {
  private TOKEN_ENDPOINT: string;
  private LOGOUT_ENDPOINT: string;

  constructor() {
    this.TOKEN_ENDPOINT = `${HxDRClient.congitoUrl}/oauth2/token`;
    this.LOGOUT_ENDPOINT = `${HxDRClient.congitoUrl}/logout`;
  }

  public getToken() {
    return new Promise((resolve, reject) => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const code = urlParams.get('code');
      const stateParam = urlParams.get('state');
      // @ts-ignore
      const codeVerifier = window.sessionStorage.getItem(
        CODE_VERIFIER_PREFIX + stateParam
      );
      if (code && stateParam && codeVerifier) {
        this.fetchTokensUsingCode(code, codeVerifier).then((data:any)=>{
          AppSettings.setRefreshToken(data.refresh_token);
          // @ts-ignore
          window.location = HxDRClient.appHome();
        });
      } else {
        const refreshToken = AppSettings.getRefreshToken();
        if (refreshToken) {
          this.fetchTokensUsingRefresh(refreshToken).then((data:any)=>{
            AppSettings.setToken(data.access_token);
            resolve(data.access_token);
          }, (err:any)=>{
            reject();
          });
        } else {
          reject();
        }
      }
    })
  }

  public logout() {
    AppSettings.removeRefreshToken();
    const client_id = HxDRClient.clientID;
    const appHome = HxDRClient.appHome();
    // @ts-ignore
    window.location = `${this.LOGOUT_ENDPOINT}?client_id=${client_id}&logout_uri=${appHome}`;
  }
  public redirectToCognito() {
    const state = uuidv4();
    const codeVerifier = uuidv4();
    sha256(codeVerifier).then(value =>{
      const codeChallenge = this.base64UrlEncode(value );
      const client_id = HxDRClient.clientID;
      const redirect_uri = HxDRClient.appHome();
      const aLink = `${HxDRClient.congitoUrl}/login?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      window.sessionStorage.setItem(CODE_VERIFIER_PREFIX + state, codeVerifier);
      // @ts-ignore
      window.location = aLink;
    }, err=>{
      console.log("Err")
    });
  }

  private base64UrlEncode(str: ArrayBuffer) {
    // @ts-ignore
    return btoa(String.fromCharCode(...new Uint8Array(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private fetchTokensUsingCode(code: string, codeVerifier: string) {
    return new Promise((resolve, reject) => {
      fetch(this.TOKEN_ENDPOINT, {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: HxDRClient.clientID,
          code,
          redirect_uri: HxDRClient.appHome(),
          code_verifier: codeVerifier,
        }),
      }).then(response => {
        if (response.ok) {
          response.json().then( data => {
            resolve(data);
          }, err => {
            reject({err: 'error when fetching tokens'});
          })
        } else {
          reject({err: 'error when fetching tokens'});
        }
      }, err => {
        console.log(err);
        reject({err: 'error when fetching tokens'});
      })
    })
  }

  private fetchTokensUsingRefresh(refreshToken: string) {
    return new Promise((resolve, reject) => {
      fetch(this.TOKEN_ENDPOINT, {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: HxDRClient.clientID,
          refresh_token: refreshToken,
        }),
      }).then(response => {
        if (response.ok) {
          response.json().then( data => {
            resolve(data);
          }, err => {
            reject({err: 'error when fetching tokens'});
          })
        } else {
          reject({err: 'error when fetching tokens'});
        }
      }, err => {
        console.log(err);
        reject({err: 'error when fetching tokens'});
      })
    })
  }
}
async function sha256(str: string): Promise<ArrayBuffer> {
  return await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
}
