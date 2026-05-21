import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
// export interface CountyInfo {
//   county: string;
//   state: string;
//   stateFips?: string;
//   countyFips?: string;
//   zipCode: string;
//   coordinates?: {
//     latitude: number;
//     longitude: number;
//   };
//   source: string; // Which API provided the data
// }


export interface CountyInfo {
  county: string;
  state: string;
  stateFips?: string;
  countyFips?: string;
  tract?: string;
  block?: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  matchType?: string;
  source: string;
}

export interface CensusGeographyResponse {
  result: {
    input: {
      location: {
        x: number;
        y: number;
      };
    };
    geographies: {
      States?: Array<{
        STATE: string;
        NAME: string;
        CENTLAT: string;
        CENTLON: string;
      }>;
      Counties?: Array<{
        COUNTY: string;
        NAME: string;
        CENTLAT: string;
        CENTLON: string;
        STATE: string;
      }>;
      'Census Tracts'?: Array<{
        TRACT: string;
        NAME: string;
        STATE: string;
        COUNTY: string;
      }>;
      'Census Blocks'?: Array<{
        BLOCK: string;
        NAME: string;
        STATE: string;
        COUNTY: string;
        TRACT: string;
      }>;
    };
  };
}

export interface CensusLocationResponse {
  result: {
    input: {
      address: {
        address: string;
      };
    };
    addressMatches: Array<{
      matchedAddress: string;
      coordinates: {
        x: number;
        y: number;
      };
      tigerLine: {
        side: string;
        tigerLineId: string;
      };
      addressComponents: {
        zip: string;
        streetName: string;
        city: string;
        state: string;
      };
    }>;
  };
}
@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
private readonly baseUrl = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

 private readonly locationUrl = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';
  private readonly geographyUrl = 'https://geocoding.geo.census.gov/geocoder/geographies/coordinates';
  
  constructor(private http: HttpClient) {}

  /**
   * Method 1: Direct ZIP code lookup using Census Geocoding API
   * This tries to geocode the ZIP code directly
   */
  getCountyByZipDirect(zipCode: string): Observable<CountyInfo | null> {
    const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
    if (cleanZip.length !== 5) {
      return of(null);
    }

    // Try different address formats for ZIP code geocoding
    const addressFormats = [
      cleanZip,                    // Just ZIP
      `${cleanZip}, USA`,         // ZIP + USA
      `${cleanZip}, United States` // ZIP + United States
    ];

    return this.tryAddressFormats(addressFormats, cleanZip);
  }

  /**
   * Method 2: Use ZIP code centroid coordinates to get county via Census
   * This is more reliable as it uses the coordinate-based lookup
   */
  getCountyByZipViaCoordinates(zipCode: string): Observable<CountyInfo | null> {
    const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
    if (cleanZip.length !== 5) {
      return of(null);
    }

    // First get coordinates from a reliable ZIP service
    return this.getZipCoordinates(cleanZip).pipe(
      switchMap(coords => {
        if (coords) {
          return this.getCountyByCoordinates(coords.latitude, coords.longitude, cleanZip);
        }
        return of(null);
      })
    );
  }

  /**
   * Method 3: Combined approach - tries direct first, then coordinates
   */
  getCountyByZipCode(zipCode: string): Observable<CountyInfo | null> {
    return this.getCountyByZipDirect(zipCode).pipe(
      switchMap(result => {
        if (result) {
          return of(result);
        }
        // If direct method fails, try coordinate-based method
        console.log('Direct ZIP lookup failed, trying coordinate method...');
        return this.getCountyByZipViaCoordinates(zipCode);
      })
    );
  }

  /**
   * Try multiple address formats for Census geocoding
   */
  private tryAddressFormats(formats: string[], originalZip: string): Observable<CountyInfo | null> {
    const tryFormat = (index: number): Observable<CountyInfo | null> => {
      if (index >= formats.length) {
        return of(null);
      }

      const params = new HttpParams()
        .set('address', formats[index])
        .set('benchmark', 'Public_AR_Current')
        .set('vintage', 'Current_Current')
        .set('format', 'json');

      return this.http.get<CensusLocationResponse>(this.locationUrl, { params }).pipe(
        switchMap(response => {
          const match = response?.result?.addressMatches?.[0];
          if (match && match.coordinates) {
            // Got coordinates, now get geography info
            return this.getCountyByCoordinates(
              match.coordinates.y,
              match.coordinates.x,
              originalZip
            );
          }
          // Try next format
          return tryFormat(index + 1);
        }),
        catchError(() => {
          // Try next format on error
          return tryFormat(index + 1);
        })
      );
    };

    return tryFormat(0);
  }

  /**
   * Get ZIP code coordinates from Zippopotam.us (reliable source)
   */
  private getZipCoordinates(zipCode: string): Observable<{latitude: number, longitude: number} | null> {
    const url = `https://api.zippopotam.us/us/${zipCode}`;
    
    return this.http.get<any>(url).pipe(
      map(data => {
        if (data && data.places && data.places.length > 0) {
          const place = data.places[0];
          return {
            latitude: parseFloat(place.latitude),
            longitude: parseFloat(place.longitude)
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Get county information using coordinates via Census Geography API
   * This is the most reliable method when you have coordinates
   */
  private getCountyByCoordinates(lat: number, lng: number, zipCode: string): Observable<CountyInfo | null> {
    const params = new HttpParams()
      .set('x', lng.toString())
      .set('y', lat.toString())
      .set('benchmark', 'Public_AR_Current')
      .set('vintage', 'Current_Current')
      .set('format', 'json');

    return this.http.get<CensusGeographyResponse>(this.geographyUrl, { params }).pipe(
      map(response => {
        const geographies = response?.result?.geographies;
        
        if (geographies) {
          const county = geographies.Counties?.[0];
          const state = geographies.States?.[0];
          const tract = geographies['Census Tracts']?.[0];
          const block = geographies['Census Blocks']?.[0];

          if (county && state) {
            return {
              county: county.NAME,
              state: state.NAME,
              stateFips: state.STATE,
              countyFips: county.COUNTY,
              tract: tract?.TRACT,
              block: block?.BLOCK,
              zipCode: zipCode,
              coordinates: {
                latitude: lat,
                longitude: lng
              },
              matchType: 'coordinate-based',
              source: 'US Census Geocoding API'
            } as CountyInfo;
          }
        }
        return null;
      }),
      catchError(error => {
        console.error('Census coordinate lookup error:', error);
        return of(null);
      })
    );
  }

  /**
   * Test all available Census API endpoints for a ZIP code
   */
  testAllMethods(zipCode: string): Observable<{[key: string]: any}> {
    const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
    
    const direct$ = this.getCountyByZipDirect(cleanZip);
    const coords$ = this.getCountyByZipViaCoordinates(cleanZip);
    const combined$ = this.getCountyByZipCode(cleanZip);

    return new Observable(observer => {
      Promise.all([
        direct$.toPromise(),
        coords$.toPromise(),
        combined$.toPromise()
      ]).then(([directResult, coordsResult, combinedResult]) => {
        observer.next({
          zipCode: cleanZip,
          directMethod: directResult,
          coordinateMethod: coordsResult,
          combinedMethod: combinedResult,
          timestamp: new Date().toISOString()
        });
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Batch lookup for multiple ZIP codes
   */
  getCountiesByZipCodes(zipCodes: string[]): Observable<CountyInfo[]> {
    const requests = zipCodes.map(zip => this.getCountyByZipCode(zip));
    
    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(results => {
          const validResults = results.filter(result => result !== null) as CountyInfo[];
          observer.next(validResults);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }
}
