## Creating a LocalStorageStore

In previous exercises, we utilized a `MemoryStore`. This example demonstrates how to create a new class that extends `MemoryStore` to store data in the browser's Local Storage. This approach allows you to retain data even after closing the page; the next time you open it, the data will be retrieved from Local Storage.

### Extending MemoryStore

To begin, extend your class from `MemoryStore`:

```typescript
export class LocalStorageStore extends MemoryStore {}
```

### Overriding CRUD Operations

You will need to override the CRUD operations to ensure they write to Local Storage:

```typescript
// Add feature
add(feature: Feature, options?: object): FeatureId {
    // Call the parent class method
    const result = super.add(feature, options);
    // If successfull we store the change in local storage
    if (result) this.encodeAndReplaceData();
    return result;
}

// Update feature
put(feature: Feature, options?: object): FeatureId {
    // Call the parent class method
    const result = super.put(feature, options);
    // If successfull we store the change in local storage
    if (result) this.encodeAndReplaceData();
    return result;
}

// Remove feature
remove(id: FeatureId) {
    // Call the parent class method
    const result = super.remove(id);
    // If successfull we store the change in local storage
    if (result) this.encodeAndReplaceData();
    return result;
}
```

### Loading Data from Local Storage

In the constructor, load all data from Local Storage and put it in the Memorystore:

```typescript
constructor(options: LocalStorageStoreOptions) {
    const data = LocalStorageStore.loadData(options.item);
    // Use parent class contructor method to store the data taken from localstorage
    super({ ...options, data });
    this.item = options.item;
}
```

Notice that `options.item` contains the key of localstorage where the data is actually stored.
```typescript
  ...
  window.localStorage.setItem(this.item, data);
  ...
```


### Key Highlights

- **Feature Representation**: In LuciadRIA, features are represented using the `Feature` class. It's essential to encode these features into a format that can be stored as a string. To achieve this, encode the feature into a JSON object and convert it into a string that can be stored in Local Storage. Use the sample provided as reference in case of doubts.

This setup ensures that your application can persist data locally, providing a seamless user experience by maintaining data across sessions.
