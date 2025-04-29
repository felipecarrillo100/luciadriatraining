type FunctionEvent = (value:boolean)=>void;
export class GroupState {
  private groups: any;
  private events: FunctionEvent[] = [];
  constructor() {
    this.groups = {};
  }

  public add(groupId:string, value:boolean) {
    this.groups[groupId] = value;
  };

  public remove(groupId:string) {
    delete this.groups[groupId];
  };

  public get(groupId:string) {
    if (typeof this.groups[groupId] !== "undefined") {
      return this.groups[groupId];
    }  else {
      return true
    }
  }

  public update(groupId:string, newValue: boolean) {
    if (typeof this.groups[groupId] !== "undefined") {
      this.groups[groupId] = newValue;
      this.notifySubscribers(this.groups[groupId]);
    }
  };

  public subscribe(f: FunctionEvent) {
    this.events.push(f);
  }

  public unsubscribe(fo: FunctionEvent) {
    const index = this.events.findIndex(f => f===fo);
    if (index > -1){
      this.events.splice(index,1)
    }
  }

  private notifySubscribers(value: boolean) {
    for (const f of this.events) {
      if (typeof f === "function") {
        f(value)
      }
    }
  }
}
