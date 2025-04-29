const HXDRAccessToken = "HXDRAccessToken";
const HXDRRefreshToken = "HXDRRefreshToken";
export const AppSettings = {
  HxDRServer: 'https://uat-hxdr.com',
  getToken() {
    return localStorage.getItem(HXDRAccessToken) || null;
  },
  getRefreshToken() {
    return localStorage.getItem(HXDRRefreshToken) || null;
  },
  setToken(token: string) {
    localStorage.setItem(HXDRAccessToken, token);
  },
  setRefreshToken(token: string) {
    localStorage.setItem(HXDRRefreshToken, token);
  },
  removeRefreshToken() {
    localStorage.setItem(HXDRRefreshToken, "");
    localStorage.removeItem(HXDRRefreshToken);
  }
}
