import {Feature, FeatureId} from "@luciad/ria/model/feature/Feature.js";
import {EventedSupport} from "@luciad/ria/util/EventedSupport.js";
import {GeoJsonCodec} from "@luciad/ria/model/codec/GeoJsonCodec.js";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference.js";
import {Cursor} from "@luciad/ria/model/Cursor.js";
import {Store} from "@luciad/ria/model/store/Store.js";

interface RestApiStoreOptions {
   endpoint?: string;
   reference?: CoordinateReference;
}

export class RestApiStore extends EventedSupport implements Store {
    private static codec = new GeoJsonCodec();
    // @ts-ignore
    private reference: CoordinateReference | undefined;
    private endpoint: string;

    constructor(options?: RestApiStoreOptions) {
        super();
        options = options ? options : {};
        this.endpoint = options.endpoint ? options.endpoint : "http://localhost:3000/api/items";
        this.reference = options.reference;
    }

    // @ts-ignore
    query(query?: (feature: Feature) => boolean): Promise<Cursor> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json"); // Ensure JSON content type
        const requestOptions: RequestInit = {
            method: 'GET',
            headers: myHeaders,
            redirect: "follow"
        }
        return new Promise<Cursor>(resolve => {
            fetch(`${this.endpoint}`, requestOptions)
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
                    const content = "[]";
                    const cursor = this.decode({content, contentType: "application/json"})
                    resolve(cursor);
                })
        })
    }

    // @ts-ignore
    add(feature: Feature, options?: any): Promise<string> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json"); // Ensure JSON content type
        const item = this.encode(feature);

        const requestOptions:RequestInit = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(item),
            redirect: 'follow'
        };

        return new Promise<string>(resolve => {
            fetch(
                `${this.endpoint}`,
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

    // @ts-ignore
    put(feature: Feature, options?: any): Promise<string> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json"); // Ensure JSON content type
        const item = this.encode(feature);

        const requestOptions:RequestInit = {
            method: 'PUT',
            headers: myHeaders,
            body: JSON.stringify(item),
            redirect: 'follow'
        };

        return new Promise<string>(resolve => {
            fetch(
                `${this.endpoint}/${feature.id}`,
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


    remove(assetId:FeatureId):Promise<boolean> {
        const myHeaders = new Headers();
        const requestOptions: RequestInit = {
            method: 'DELETE',
            headers: myHeaders,
            redirect: 'follow'
        }
        return new Promise<boolean>(resolve => {
            fetch(
                `${this.endpoint}/${assetId}`,
                requestOptions)
                .then(response => {
                    if (!response.ok) {
                        throw new Error("HTTP error " + response.status);
                    }
                    this.emit("StoreChanged", "remove", undefined, assetId);
                    resolve(true);
                })
                .catch(() => {
                    resolve(false);
                })
        })
    }

    get(assetId: FeatureId):Promise<Feature> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json"); // Ensure JSON content type
        const requestOptions: RequestInit = {
            method: 'GET',
            headers: myHeaders,
            redirect: "follow"
        }
        return new Promise<Feature>(resolve => {
            fetch(
                `${this.endpoint}/${assetId}`,
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
        const feature = param.content = {...param.content, type:"Feature"};
        return RestApiStore.codec.decodeObject(feature).next();
    }
    private decode(param: { contentType: string; content: any }) {
        const features = param.content.map((f:any)=>({...f, type: "Feature"}));
        return RestApiStore.codec.decodeObject(features);
    }

    private encode(feature: Feature) {
        let geometry = undefined;
        if (feature.shape) {
            geometry = RestApiStore.codec.encodeShape(feature.shape);
        }
        return {geometry, properties: feature.properties, id: feature.id};
    }
}
