export interface BingMapsMatch {
  name: string;
  bbox: number[];
}
export class BingmapsServices {
  private static token: string | undefined = "AugjqbGwtwHP0n0fUtpZqptdgkixBt5NXpfSzxb7q-6ATmbk-Vs4QnqiW6fhaV-i";

  public static getToken() {
    return this.token;
  }

  public static searchWorld(query: string ) {
    const BingMapsKey = this.getToken()
    const url = `https://dev.virtualearth.net/REST/v1/Locations?q=${query.trim()}&key=${BingMapsKey}`;

    return new Promise<BingMapsMatch[]>(resolve => {
      if (query.trim().length===0) return;

      this.GET_JSON(url).then((response)=>{
        if (response.ok) {
          response.json().then(result=>{
            if (result.resourceSets.length>0) {
              const resourceSet = result.resourceSets[0].resources.map((i:any)=>({name:i.name, bbox: i.bbox}));
              resolve(resourceSet);
            }
          })
        }
      })
    })
  }


  private static GET_JSON(url: string) {
    const requestOptions = {
      method: 'GET',
      redirect: 'follow'
    } as any;
    return fetch(url, requestOptions);
  }
}
