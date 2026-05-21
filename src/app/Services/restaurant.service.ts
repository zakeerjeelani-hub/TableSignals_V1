import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import {environment} from '../../environments/environment'
import { TSRestaurantProfileUser, TSRestaurantProfileUser_V1 } from '../models/TSRestaurantProfileUser';
import { CreateAreasWithTablesRequest, MenuItem } from '../models/restaurant-request.model';
import { NotificationHistory, NotificationTemplate } from '../restaurant/restaurant-membershipusers/restaurant-membershipusers.component';
import { SessionService } from './session.service';

export interface MembershipSignUpRequest {
  firstName: string;
  lastName: string;
  birthDay: string;
  birthMonth: number;
  mobileNo: string;
  emailID?: string;
  city?: string;
  restaurantId: number;
}

export interface MembershipSignUpResponse {
  success?: boolean;
  message?: string;
  membershipCode?: string;
  MembershipCode?: string;
}

export interface MembershipEligibilityCheckRequest {
  restaurantId: number;
  mobileNo?: string;
  emailID?: string;
}

export interface MembershipEligibilityCheckResponse {
  message?: string;
  membershipCode?: string;
  MembershipCode?: string;
  alreadyVipMemberForRestaurant?: boolean;
  isAlreadyVIPForRestaurant?: boolean;
  isExistingTableSignalsUser?: boolean;
  alreadyTableSignalsUser?: boolean;
  noRecordFound?: boolean;
  shouldCollectRegistrationDetails?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {

  
  //private apiUrl = 'http://democity.localhost:9515/api/Service'; // Example API
  //private apiUrl = 'https://workorderapi.rattletech.com/api/Service'; // Example API
  //private apiUrl = 'http://democity.rattletech.com/api/Service'; // Example API
  private readonly apiVersionKey = 'useV2Api';
  private readonly apiUrlV1 = environment.apiUrlV1 ?? environment.apiUrl;
  private readonly apiUrlV2 = environment.apiUrlV2 ?? environment.apiUrl;

  private get useV2Api(): boolean {
    const override = this.session.getItem(this.apiVersionKey);
    if (override === null) {
      return environment.useV2Api ?? false;
    }

    return override.toLowerCase() === 'true';
  }

  private get apiUrl(): string {
    return this.useV2Api ? this.apiUrlV2 : this.apiUrlV1;
  }

  constructor(private http: HttpClient, private session: SessionService) { 
  }

  setUseV2Api(enabled: boolean): void {
    this.session.setItem(this.apiVersionKey, String(enabled));
  }

  clearApiVersionOverride(): void {
    this.session.removeItem(this.apiVersionKey);
  }

  isUsingV2Api(): boolean {
    return this.useV2Api;
  }

  private buildUrl(v1Endpoint: string, v2Endpoint?: string): string {
    const rawEndpoint = this.useV2Api ? (v2Endpoint ?? v1Endpoint) : v1Endpoint;
    const endpoint = rawEndpoint.startsWith('/') ? rawEndpoint.slice(1) : rawEndpoint;
    return `${this.apiUrl}/${endpoint}`;
  }

  private getCurrentUserId(): number {
    return this.session.getNumber('userId', 0);
  }

RestaurantLogin(username: string, password: string, deviceId: string): Observable<any> {
    if (this.useV2Api) {
      return this.http
        .post(this.buildUrl('RestaurantLogin_V2', 'RestaurantLogin'), {
          userName: username,
          password,
          deviceToken: deviceId,
        })
        .pipe(map((response: any) => response?.data ?? response));
    }

    const params = new HttpParams()
      .set('UserName', username)
      .set('Password', password)
      .set('DeviceToken', deviceId);

    return this.http.get(this.buildUrl('RestaurantLogin_V2'), { params });
}
  TSRestaurantSignUp(tSRestaurant:any): Observable<any> 
  {
    //debugger;
    return this.http.post(`${this.apiUrl}/${`TSRestaurantSignUp`}`,tSRestaurant);
    } 
    UpdateRequestStatus(RequestID:any): Observable<any> 
  {
    //debugger;
    return this.http.post(`${this.apiUrl}/${`UpdateRequestStatus`}`,RequestID);
    } 

    TSRestaurantDashboard(restaurantId:number,timezone:string): Observable<any> 
    {
      if (this.useV2Api) {
        if (!timezone) {
          return new Observable<any>();
        }

        return this.http.get(`${this.buildUrl(`TSRestaurantDashboard_V2`, `TSRestaurantDashboard_V2`)}?timezone=${encodeURIComponent(timezone)}`);
      }

      if (restaurantId) {
        return this.http.get(`${this.buildUrl(`TSRestaurantDashboard_V2`)}?RestaurantID=`+restaurantId+`&Timezone=`+timezone);
      } 
      return new Observable<any>(); 
    }
    TSAreaSetup(area:any): Observable<any> 
  {
    //debugger;
    return this.http.post(`${this.apiUrl}/${`TSAreaSetup`}`,area);
    } 
    TSRestaurantAreas(restaurantId:number): Observable<any> 
    {
      if (this.useV2Api) {
        return this.http.get(this.buildUrl('TSRestaurantAreas', 'TSRestaurantAreas'));
      }

      if (restaurantId) {
        return this.http.get(`${this.buildUrl(`TSRestaurantAreas`)}?RestaurantID=`+restaurantId);
      } 
      return new Observable<any>(); 
    }

    TSRestaurantTables(AreaID:number): Observable<any> 
    {
    
      if (AreaID) {
      //debugger;
      if (this.useV2Api) {
        return this.http.get(`${this.buildUrl(`TSRestaurantTables_V1`, `TSRestaurantTables`)}?areaId=` + AreaID);
      }

      return this.http.get(`${this.buildUrl(`TSRestaurantTables_V1`)}?AreaID=`+AreaID);
      } 
      return new Observable<any>(); 
    }
    
    TSTableSetup(table:any): Observable<any> 
    {
      //debugger;
      return this.http.post(`${this.apiUrl}/${`TSTableSetup`}`,table);
      } 
      TSTableDelete(TableId:any): Observable<any> 
  {
    //debugger;
    return this.http.post(`${this.apiUrl}/${`TSTableDelete`}?TableId=`+TableId,null);
    }
    TSAreaDelete(AreaId:any): Observable<any> 
    {
      //debugger;
      return this.http.post(`${this.apiUrl}/${`TSAreaDelete`}?AreaId=`+AreaId,null);
      }

      saveAllTables(tables: any[]) {
        return this.http.post(this.buildUrl('TSAllTablesSetup_V1', 'TSAllTablesSetup'), tables);
      }
      
      GetRestaurantProfile(restaurantId:number): Observable<any> 
    {
      if (this.useV2Api) {
        return this.http.get(this.buildUrl('GetRestaurantProfile', 'GetRestaurantProfile'));
      }

      if (restaurantId) {
        return this.http.get(`${this.buildUrl(`GetRestaurantProfile`)}?RestaurantID=`+restaurantId);
      } 
      return new Observable<any>(); 
    }

    
    TSUserRequest(tSUserRequest:any): Observable<any> 
    {
      //debugger;
      return this.http.post(this.buildUrl('TSUserRequest_V1', 'TSUserRequest'), tSUserRequest);
      } 

      getCountries(): Observable<any> {
        return this.http.get(`${this.apiUrl}/${`GetCountries`}`);
        //return this.http.get(`${this.apiUrl}/GetCountries`);
      }
    
      getStatesByCountry(countryId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/${`GetStatesByCountry?countryId=${countryId}`}`);
        //return this.http.get(`${this.apiUrl}/GetStatesByCountry?countryId=${countryId}`);
      }
    
      GetTSRestaurantForgotPassword( email: any): Observable<any> {
        
        return this.http.get(`${this.apiUrl}/GetTSRestaurantForgotPassword?email=${email}`);
      }
      VerifyRestaurant(VerificationID:any): Observable<any> 
  {
    //debugger;
    return this.http.get(`${this.apiUrl}/${`VerifyRestaurant?VerificationID=${VerificationID}`}`);
    } 


    uploadMenuImages(restaurantId: number, images: string[]): Observable<any> {
      const payload = { restaurantId, menuImages: images };
      return this.http.post<any>(`${this.apiUrl}/${`UploadMenu`}`, payload);
    }

    getMenuImages(restaurantId: number): Observable<any> {
      if (this.useV2Api) {
        return this.http.get<any>(this.buildUrl('GetMenuImages', 'GetMenuImages'));
      }

      return this.http.get<any>(`${this.buildUrl(`GetMenuImages`)}?restaurantId=${restaurantId}`);
    }


    deleteMenuImages(restaurantId: number, MenuImages: string[]): Observable<any> {
      return this.http.post(`${this.apiUrl}/DeleteMenuImages`, { restaurantId, MenuImages });
    }
    getAllRestaurants(): Observable<any> 
    {
    
      
      //debugger;
      return this.http.get(`${this.apiUrl}/${`TSAllRestaurants`}`);
      
      return new Observable<any>(); 
    }

    TSEnableDisableService(RestaurantID:number,isServiceEnabled:boolean): Observable<any> 
  {
    //debugger;
    return this.http.post(`${this.apiUrl}/${`TSEnableDisableService`}`,{RestaurantID,isServiceEnabled});
    }

    TSEnableDisableUsersService(RestaurantID:number,UserId: number,isServiceEnabled:boolean): Observable<any> 
  {
    //debugger;
    return this.http.post(`${this.apiUrl}/${`TSEnableDisableUsersService`}`,{RestaurantID,UserId,isServiceEnabled});
    }
    
    
    TSGetEnableDisableService(RestaurantID: number): Observable<any> {
      if (this.useV2Api) {
        return this.http.get(this.buildUrl('TSGetEnableDisableService', 'TSGetEnableDisableService'));
      }

      return this.http.get(`${this.buildUrl(`TSGetEnableDisableService`)}?RestaurantID=`+RestaurantID);
    }

 
    
    TSGetEnableDisableUsersService(RestaurantID: number,UserId: number): Observable<any> {
      if (this.useV2Api) {
        return this.http.get(`${this.buildUrl(`TSGetEnableDisableUsersService`, `TSGetEnableDisableUsersService`)}?userId=${UserId}`);
      }

      return this.http.get(`${this.buildUrl(`TSGetEnableDisableUsersService`)}?RestaurantID=`+RestaurantID+`&UserId=`+UserId);
    }

    GetRestaurantNameByRestaurantId(RestaurantID: number): Observable<any> {
      //debugger;
      return this.http.get(`${this.apiUrl}/${`GetRestaurantNameByRestaurantId`}?RestaurantID=`+RestaurantID);
    }
    GetRestaurantDetails(RestaurantID: number,tableno: number,istableIdExists:boolean): Observable<any> {
      //debugger;
      return this.http.get(`${this.apiUrl}/${`GetRestaurantDetails`}?RestaurantID=`+RestaurantID+`&tableno=`+tableno+`&istableIdExists=`+istableIdExists);
    }

     getRestaurantUsersByRestaurantId(restaurantId: number): Observable<TSRestaurantProfileUser[]> {
    return this.http.get<TSRestaurantProfileUser[]>(`${this.apiUrl}/GetRestaurantUsersByRestaurantId?restaurantId=${restaurantId}`);
  }
  getRestaurantUsersByRestaurantId_V1(restaurantId: number): Observable<TSRestaurantProfileUser_V1[]> {
    return this.http.get<TSRestaurantProfileUser_V1[]>(`${this.apiUrl}/GetRestaurantUsersByRestaurantId_V1?restaurantId=${restaurantId}`);
  }
  // Create a new restaurant user
  createRestaurantUser(user: TSRestaurantProfileUser): Observable<TSRestaurantProfileUser> {
    return this.http.post<TSRestaurantProfileUser>(`${this.apiUrl}/CreateRestaurantUser`, user);
  }
  createRestaurantUser_V1(user: TSRestaurantProfileUser): Observable<TSRestaurantProfileUser_V1> {
    return this.http.post<TSRestaurantProfileUser_V1>(`${this.apiUrl}/CreateRestaurantUser_V1`, user);
  }

  // Update an existing restaurant user
  updateRestaurantUser(userId: number, user: TSRestaurantProfileUser): Observable<TSRestaurantProfileUser> {
    if (this.useV2Api) {
      return this.http.post<TSRestaurantProfileUser>(this.buildUrl('UpdateRestaurantUser', 'UpdateRestaurantUser'), user);
    }

    return this.http.put<TSRestaurantProfileUser>(this.buildUrl('UpdateRestaurantUser'), user);
  }
  updateRestaurantUser_V1(userId: number, user: TSRestaurantProfileUser): Observable<TSRestaurantProfileUser_V1> {
    if (this.useV2Api) {
      return this.http.post<TSRestaurantProfileUser_V1>(this.buildUrl('UpdateRestaurantUser_V1', 'UpdateRestaurantUser'), user);
    }

    return this.http.put<TSRestaurantProfileUser_V1>(this.buildUrl('UpdateRestaurantUser_V1'), user);
  }

  // Delete a restaurant user
  deleteRestaurantUser(userId: number): Observable<void> {
    if (this.useV2Api) {
      return this.http.post<void>(`${this.buildUrl('DeleteRestaurantUser', 'DeleteRestaurantUser')}?userId=${userId}`, null);
    }

    return this.http.delete<void>(`${this.buildUrl('DeleteRestaurantUser')}?UserId=${userId}`);
  }


      EnableDisableRestaurantUserService(UserId: number,isServiceEnabled:boolean): Observable<any> 
  {
    //debugger;
    return this.http.post(`${this.apiUrl}/${`EnableDisableRestaurantUserService?UserId=${UserId}&isServiceEnabled=${isServiceEnabled}`}`,null);
    }

     GetRestaurantUserProfile(restaurantId:number): Observable<any> 
    {
      if (this.useV2Api) {
        return this.http.get(this.buildUrl('GetRestaurantUserProfile', 'GetRestaurantUserProfile'));
      }

      if (restaurantId) {
        return this.http.get(`${this.buildUrl(`GetRestaurantUserProfile`)}?UserId=`+restaurantId);
      } 
      return new Observable<any>(); 
    }


       TSGetMenu(roleID: number): Observable<MenuItem[]> {
  return this.http.get<MenuItem[]>(`${this.apiUrl}/TSGetMenu?RoleId=`+roleID);
}
getVIPMembersData(restaurantId: number): Observable<any> {
  if (this.useV2Api) {
    return this.http.get<any>(this.buildUrl('GetMembersByRestaurant', 'GetMembersByRestaurant'));
  }

  return this.http.get<any>(`${this.buildUrl(`GetMembersByRestaurant`)}?RestaurantId=`+restaurantId);
}
getMembershipUsers(restaurantId: number): Observable<any> {
  if (this.useV2Api) {
    return this.http.get<any>(this.buildUrl('GetRestaurantUsers', 'GetRestaurantUsers'));
  }

  return this.http.get<any>(`${this.buildUrl(`GetRestaurantUsers`)}?RestaurantId=`+restaurantId);
}
TSUserRequestByTableNo(userRequest: any) {
  return this.http.post<any>(
    `${this.apiUrl}/TSUserRequestByTableNo`,
    userRequest
  );
}

TSUserRequestByType(payload: {
  RequestTypeID: number;
  UserDeviceID: string;
  RestaurantID: number;
  CustomDescription: string;
}): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/TSUserRequestByType`, payload);
}

getNotificationHistory(restaurantId: number, DeviceToken?: string): Observable<NotificationHistory[]> {
  if (this.useV2Api) {
    return this.http.get<NotificationHistory[]>(this.buildUrl('GetNotificationHistory_V1', 'GetNotificationHistory'));
  }

  let params = new HttpParams();
  if (DeviceToken) {
    params = params.set('DeviceToken', DeviceToken);
  }
  if (restaurantId) {
    params = params.set('RestaurantId', restaurantId.toString());
  }

  return this.http.get<NotificationHistory[]>(this.buildUrl('GetNotificationHistory_V1'), { params });
}
GetNotificationHistory_Master(restaurantId: number, DeviceToken?: string): Observable<NotificationHistory[]> {
  let params = new HttpParams();
  
  if (restaurantId) {
    params = params.set('RestaurantId', restaurantId.toString());
  }
  
  return this.http.get<NotificationHistory[]>(`${this.apiUrl}/GetNotificationHistory_Master`, { params });
}
getNotificationTemplates(restaurantId: number): Observable<NotificationTemplate[]> {
  if (this.useV2Api) {
    return this.http.get<NotificationTemplate[]>(this.buildUrl('GetNotificationTemplates', 'GetNotificationTemplates'));
  }

  const params = restaurantId
    ? new HttpParams().set('RestaurantId', restaurantId.toString())
    : new HttpParams();
  return this.http.get<NotificationTemplate[]>(this.buildUrl('GetNotificationTemplates'), { params });
}

sendBulkNotification(restaurantId: number, membershipCodeCSV: string, title: string, body: string): Observable<any> {
  return this.http.post(this.buildUrl('SendNotifications_V1', 'SendNotifications'), {
    RestaurantID: restaurantId,
    MembershipCodeCSV: membershipCodeCSV,
    NotificationTitle: title,
    NotificationBody: body,
    UserId: this.getCurrentUserId()
  });
}
saveNotificationTemplate(templateid:number,restaurantId: number,  title: string, body: string,templatename:string): Observable<any> {
  return this.http.post(`${this.apiUrl}/SaveNotificationTemplate`, {
    Templatename:templatename,
    TemplateID: templateid,
    RestaurantID: restaurantId,
    NotificationTitle: title,
    NotificationBody: body,
    UserId: this.getCurrentUserId()
  });
}
deleteNotificationTemplate(templateid:number): Observable<any> {
  return this.http.post(`${this.apiUrl}/DeleteNotificationTemplate?TemplateId=`+templateid,null);
}
createAreasWithTables(request: CreateAreasWithTablesRequest): Observable<any> {
  return this.http.post(this.buildUrl('create-areas-with-tables', 'CreateAreasWithTables'), request);
}


getRequestTypesForQR(restaurantId: number): Observable<any[]> {
    if (this.useV2Api) {
      return this.http.get<any[]>(this.buildUrl('GetRequestTypesForQR', 'GetRequestTypesForQR'));
    }

    return this.http.get<any[]>(`${this.buildUrl(`GetRequestTypesForQR`)}?restaurantId=${restaurantId}`);
  }

  submitUserRequestByQR(payload: {
    qrId: number;
    userDeviceID: string;
    restaurantID: number;
    customDescription: string;
  }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/TSUserRequestByQR`,
      payload
    );
  }
  /**
   * Save custom QR information
   * @param payload - QR data to save
   */
  saveQRInfo(payload: any): Observable<{ status: string; qrId: number }> {
    return this.http.post<{ status: string; qrId: number }>(
      `${this.apiUrl}/SaveQRInfo`,
      payload
    );
  }

  membershipSignUp(payload: MembershipSignUpRequest): Observable<MembershipSignUpResponse> {
    // Use explicit v1 endpoint name to avoid collisions with newer API versions.
    return this.http.post<MembershipSignUpResponse>(`${this.apiUrlV1}/MembershipSignUp_V1`, payload);
  }

  checkMembershipEligibility(payload: MembershipEligibilityCheckRequest): Observable<MembershipEligibilityCheckResponse> {
    return this.http.post<MembershipEligibilityCheckResponse>(`${this.apiUrlV1}/CheckMembershipEligibility_V1`, payload);
  }
  
}
