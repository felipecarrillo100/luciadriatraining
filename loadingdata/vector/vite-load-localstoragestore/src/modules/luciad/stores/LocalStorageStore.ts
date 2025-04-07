import {MemoryStore, MemoryStoreConstructorOptions} from "@luciad/ria/model/store/MemoryStore.js";
import {GeoJsonCodec} from "@luciad/ria/model/codec/GeoJsonCodec.js";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {FeatureId} from "@luciad/ria/model/feature/Feature.js";

interface LocalStorageStoreOptions extends MemoryStoreConstructorOptions {
    item: string;
}
export class LocalStorageStore extends MemoryStore {
    private item: string;
    constructor(options: LocalStorageStoreOptions) {
        const data = LocalStorageStore.loadData(options.item);
        super({...options, data});
        this.item = options.item;
    }

    private static loadData(item: string): Feature[] {
        const dataStr = window.localStorage.getItem(item);
        if (!dataStr) return [];
        else {
            const data = [];
            const codec = new GeoJsonCodec({});
            try {
                const cursor = codec.decode({content: dataStr, contentType:"application/json"});
                while (cursor.hasNext()) {
                    data.push(cursor.next());
                }
            } catch (err) {
                // Do nothing
            }
            return data;
        }
    }

    add(feature: Feature, options?: object): FeatureId {
        const result = super.add(feature, options);
        if (result) this.encodeAndReplaceData();
        return result;
    }

    put(feature: Feature, options?: object): FeatureId {
        const result  = super.put(feature, options);
        if (result) this.encodeAndReplaceData();
        return result;
    }

    remove(id: FeatureId) {
        const result = super.remove(id);
        if (result) this.encodeAndReplaceData();
        return result;
    }

    clear(): boolean {
        localStorage.removeItem(this.item);
        return super.clear();
    }

    private encodeAndReplaceData() {
        const data = this.encodeData();
        window.localStorage.setItem(this.item, data);
    }

    private encodeData() {
        const cursor = this.query();
        const codec = new GeoJsonCodec({});
        const result = codec.encode(cursor);
        return result.content;
    }
}
