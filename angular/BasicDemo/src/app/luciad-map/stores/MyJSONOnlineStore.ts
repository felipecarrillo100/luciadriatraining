import {Store} from "@luciad/ria/model/store/Store";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {Cursor} from "@luciad/ria/model/Cursor";
import {GeoJsonCodec} from "@luciad/ria/model/codec/GeoJsonCodec";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference";
import {EventedSupport} from "@luciad/ria/util/EventedSupport";

interface RestStoreOptions {
  collection: string;
  reference?:  CoordinateReference;
}
export class MyJSONOnlineStore  extends EventedSupport implements Store {
  private baseurlCollections = 'https://api.myjson.online/v1/collections';
  private baseurlRecords = 'https://api.myjson.online/v1/records';
  private token = "b9e9a345-4857-4580-9e44-e84a906d56b1";

  private static codec = new GeoJsonCodec();
  private reference: CoordinateReference | undefined;
  private collection: string;

  constructor(options: RestStoreOptions) {
    super();
    this.collection = options.collection;
    this.reference = options.reference
  }

  query(query?: (feature: Feature) => boolean): Promise<Cursor> {
    const myHeaders = new Headers();
    myHeaders.append("x-collection-access-token", this.token);
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
      redirect: "follow"
    }
    return new Promise<Cursor>(resolve => {
      fetch(`${this.baseurlCollections}/${this.collection}/records`, requestOptions)
        .then(response => {
          if (!response.ok) {
            throw new Error("HTTP error " + response.status);
          }
          return response.json();
        })
        .then(content => {
          const cursor = this.decode({content, contentType: "application/json"})
          resolve(cursor);
        })
        .catch(() => {
          const content = "{}";
          const cursor = this.decode({content, contentType: "application/json"})
          resolve(cursor);
        })
    })
  }

  add(feature: Feature, options?: any): Promise<string> {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("x-collection-access-token", this.token);

    const urlencoded = new URLSearchParams();
    urlencoded.append("jsonData", JSON.stringify(this.encode(feature)));
    urlencoded.append("collectionId", this.collection);

    const requestOptions:RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    return new Promise<string>(resolve => {
      fetch(
        `${this.baseurlRecords}`,
        requestOptions
      )
        .then(response => response.json())
        .then(result => {
          feature.id = result.id;
          this.emit("StoreChanged",  "add", feature, feature.id);
          resolve(result.id);
        })
        .catch(error => {console.log('error', error)});
    });
  }

  put(feature: Feature, options?: any): Promise<string> {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("x-collection-access-token", this.token);

    const urlencoded = new URLSearchParams();
    urlencoded.append("jsonData", JSON.stringify(this.encode(feature)));

    const requestOptions:RequestInit = {
      method: 'PUT',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    return new Promise<string>(resolve => {
      fetch(
        `${this.baseurlRecords}/${feature.id}`,
        requestOptions
      )
        .then(response => response.json())
        .then(result => {
          feature.id = result.id;
          this.emit("StoreChanged",  "update", feature, result.id);
          resolve(result.id);
        })
        .catch(error => {console.log('error', error)});
    });
  }



  remove(assetId:string):Promise<boolean> {
    const myHeaders = new Headers();
    myHeaders.append("x-collection-access-token", this.token);
    var urlencoded = new URLSearchParams();
    const requestOptions: RequestInit = {
      method: 'DELETE',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    }
    return new Promise<boolean>(resolve => {
      fetch(
        `${this.baseurlRecords}/${assetId}`,
        requestOptions)
        .then(response => {
          if (!response.ok) {
            throw new Error("HTTP error " + response.status);
          }
          return response.json();
        })
        .then(content => {
          this.emit("StoreChanged", "remove", undefined, assetId);
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        })
    })
  }

  get(assetId: string):Promise<Feature> {
    const myHeaders = new Headers();
    myHeaders.append("x-collection-access-token", this.token);
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
      redirect: "follow"
    }
    return new Promise<Feature>(resolve => {
      fetch(
        `${this.baseurlRecords}/${assetId}`,
        requestOptions)
        .then(response => {
          if (!response.ok) {
            throw new Error("HTTP error " + response.status);
          }
          return response.json();
        })
        .then(content => {
          const feature = this.decodeOne({content, contentType: "application/json"})
          resolve(feature);
        })
        .catch(() => {
          resolve(undefined as any);
        })
    })
  }

  private decodeOne(param: { contentType: string; content: any }) {
    const feature = param.content = {...param.content.data, id:param.content.id, type:"Feature"};
    return MyJSONOnlineStore.codec.decodeObject(feature).next();
  }
  private decode(param: { contentType: string; content: any }) {
    const features = param.content.records.map((i:any)=>({...i.data, id:i.id, type:"Feature"}));

    return MyJSONOnlineStore.codec.decodeObject(features);
  }

  private encode(feature: Feature) {
    let geometry = undefined;
    if (feature.shape) {
      geometry = MyJSONOnlineStore.codec.encodeShape(feature.shape);
    }
    const data = {geometry, properties: feature.properties, id: feature.id};
    return data;
  }
}
