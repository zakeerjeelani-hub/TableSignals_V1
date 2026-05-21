export interface RestaurantRequest {
    requestTime: string;
    areaName: string;
    tableName: string;
    requestName: string;
    status: boolean;
    color: string;
    timeDifference?: string; // Optional because it will be added later
  requestCompletedDate:string;
  MembershipCode?:string
  }
  export interface MenuItem {
  menuId: number;
  roleID: number;
  userId: number;
  parentMenuId: number;
  menuTitle: string;
  description: string;
  children?: MenuItem[];
  isSubmenuVisible?: boolean;
}













export interface CreateAreasWithTablesRequest {
  restaurantId: number;
  areasWithTableRanges: AreaWithTableRangeDto[];
  menuImages: string[]; // Base64 encoded
}

export interface AreaWithTableRangeDto {
  areaName: string;
  tableStart: number;
  tableEnd: number;
}

export interface CreateAreasWithTablesResponse {
  success: boolean;
  status: string;
  areasCreated: number;
  tablesCreated: number;
  restaurantId: number;
  message?: string;
}