## Creating an Editable RESTful Store

In previous exercises, we demonstrated how to create editable feature layers. We utilized existing stores from the LuciadRIA API and extended functionality to store data in memory and LocalStorage. However, many applications require more permanent data storage, typically in a database. To achieve this, we have implemented a REST API for storing features.

In this tutorial, we will focus on creating a RESTful store that interacts with a backend using standard operations: Get, Add, Put, and Remove. We will build the store from scratch, following these steps:

### Step 1: Create the RestApiStore Class

Begin by creating a new class that extends `EventedSupport` and implements all methods defined in the `Store` interface:

```typescript
export class RestApiStore extends EventedSupport implements Store {
    // Class implementation will go here
}
```
* `EventedSupport` is important because it will allow us to trigger events to the map
  * `Store` Is an interface that defined all the CRUD methods that provide the data manipulation operations such as `add`, `put`, `remove`, `get`, `query` that we will have to implement on our own.

### Step 2: Implement CRUD Methods with Asynchronous Operations

Since AJAX calls to the REST API are asynchronous, you need to handle these operations using promises.

#### Example: Implementing the `get` Method

The `get` method retrieves a feature by its ID: In this case we return a promise to a Feature. Notice we use fetch to perform the AJAX request but feel free to use your preferred library for this purpose,

```typescript
get(assetId: FeatureId): Promise<Feature> {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json"); // Ensure JSON content type
    const requestOptions: RequestInit = {
        method: 'GET',
        headers: myHeaders,
        redirect: "follow"
    };
    return new Promise<Feature>(resolve => {
        fetch(`${this.endpoint}/${assetId}`, requestOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error("HTTP error " + response.status);
                }
                return response.json();
            })
            .then(content => {
                const feature = this.decodeOne({content, contentType: "application/json"});
                resolve(feature);
            })
            .catch(() => {
                resolve(undefined as any);
            });
    });
}
```

### Important: Emitting StoreChanged Events

Whenever a method causes a feature to change (`add`, `put`, `remove`), it must trigger a `StoreChanged` event. This event informs the LuciadRIA Map that the feature has changed and needs re-rendering. For instance, in the `put` method requires to emit a `StoreChanged`/`update`. See the code snippet below:

```typescript
put(feature: Feature, options?: any): Promise<string> {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json"); // Ensure JSON content type
    const item = this.encode(feature);

    const requestOptions: RequestInit = {
        method: 'PUT',
        headers: myHeaders,
        body: JSON.stringify(item),
        redirect: 'follow'
    };

    return new Promise<string>(resolve => {
        fetch(`${this.endpoint}/${feature.id}`, requestOptions)
            .then(response => response.json())
            .then(result => {
                feature.id = result.id;
                this.emit("StoreChanged", "update", feature, result.id);
                resolve(result.id);
            })
            .catch(error => {
                console.log('error', error);
            });
    });
}
```

Similarly, emit events for the following actions:

- `this.emit("StoreChanged", "add", feature, feature.id);`
- `this.emit("StoreChanged", "update", feature, result.id);`
- `this.emit("StoreChanged", "remove", undefined, assetId);`

### Note

In our previous `LocalStorageStore` example, we didn't manually trigger events because we extended an existing class. The parent class methods (`super.put()`, `super.add()`, `super.remove()`) triggered `StoreChanged` events behind the scenes.

### Final Note: Using the Toolbox Library

This example uses the toolbox library to create a context menu on right-clicking features. Since this context menu is React-based, it won't work in an Angular project. You'll need to find an alternative solution for Angular applications.

