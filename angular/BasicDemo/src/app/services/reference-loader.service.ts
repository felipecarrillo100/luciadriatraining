import { Injectable } from '@angular/core';
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference";
import {addReference, isValidReferenceIdentifier, parseWellKnownText} from "@luciad/ria/reference/ReferenceProvider.js";
import {BehaviorSubject, Observable} from "rxjs";

interface ReferenceEntry {
  wkt: string;
  authorityName: string;
  authorityCode: string;
}

const WKTBatchLocation = "./assets/projections/references.txt";
const JSONBatchLocation = "./assets/projections/references.json";

@Injectable({
  providedIn: 'root'
})
export class ReferenceLoaderService {
  private subjectReferencesLoaded = new BehaviorSubject<Boolean>(false);
  constructor() {
    this.fetchJSONReferences(JSONBatchLocation).then(result=>{
      this.subjectReferencesLoaded.next(result);
    });
    // this.fetchWKTReferences(WKTBatchLocation).then(result=>{
    //   this.subjectReferencesLoaded.next(result);
    // });
  }

  onReferencesLoaded(): Observable<Boolean> {
    return this.subjectReferencesLoaded.asObservable();
  }

  private loaBatchReferencesFromWKT(text: string): Promise<CoordinateReference[]> {
    return new Promise((resolve) => {
      const loadedReferences = [];
      const supportedReferenceIdentifierPattern = /(EPSG):(\d+)/i;

      const lines = text.replace(new RegExp("\r", "gm"), "").split(/\n/);
      for (let epsgLineIndex = 0; epsgLineIndex < lines.length; epsgLineIndex++) {
        const epsgLine = lines[epsgLineIndex];
        if (epsgLine.length === 0 || epsgLine.substring(0, 1) === "#") {
          continue;
        }

        supportedReferenceIdentifierPattern.exec(epsgLine);

        const matchResult = supportedReferenceIdentifierPattern.exec(epsgLine);
        if (!matchResult) {
          console.log(`Found unsupported reference identifier pattern: ${epsgLine} . Ignoring.`);
          continue;
        }

        epsgLineIndex++;

        const wkt = lines[epsgLineIndex];

        const reference = this.loadReferenceEntry({wkt, authorityName:matchResult[1], authorityCode:matchResult[2]})
        if (reference) loadedReferences.push(reference);
      }
      resolve(loadedReferences);
    });
  }

  private loadBatchReferencesFromJSONArray(entries: ReferenceEntry[]): Promise<CoordinateReference[]> {
    return new Promise((resolve) => {
      const loadedReferences = [];
      for (const entry of entries) {
        let reference = this.loadReferenceEntry(entry);
        if (reference) loadedReferences.push(reference);
      }
      resolve(loadedReferences);
    });
  }

  private fetchJSONReferences(url: string) {
    return new Promise<boolean>(resolve => {
      fetch(url).then(response=>{
        if (response.ok) {
          response.json().then((jsonArray)=>{
            this.loadBatchReferencesFromJSONArray(jsonArray).then((references)=>{
              console.log(`References loaded from ${url}: ${references.length}`)
              resolve(true);
            })
          })
        } else {
          resolve(false);
        }
      });
    })
  }

  private fetchWKTReferences(url: string) {
    return new Promise<boolean>(resolve => {
      fetch(url).then(response=>{
        if (response.ok) {
          response.text().then((wktText)=>{
            this.loaBatchReferencesFromWKT(wktText).then((references)=>{
              console.log(`References loaded from ${url}: ${references.length}`)
              resolve(true);
            });
          })
        } else {
          resolve(false);
        }
      });
    })
  }

  public loadReferenceEntry(referenceObject: ReferenceEntry) {
    let reference = null;
    try {
      reference = parseWellKnownText(referenceObject.wkt, referenceObject.authorityName, referenceObject.authorityCode);
      // Add new reference to the ReferenceProvider if not present
      if (!isValidReferenceIdentifier(reference.identifier)) {
        addReference(reference);
      }
    } catch (ignore) {
      console.log(`Could not parse the following WKT string: ${referenceObject.authorityName}:${referenceObject.authorityCode}. Ignoring the string.`)
    }
    return reference
  }
}
