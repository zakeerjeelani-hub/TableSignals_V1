export interface TSRestaurantProfileUser {
  restaurantId: number;
  emailID: string;
  userName: string;
  password: string;
  phoneNo: string;
  address: string;
  mode: string;
  roleID: number;
  userId: number;
  roleName: string;
  isServiceEnabled:boolean;
}


export interface TSRestaurantProfileUser_V1 {
  restaurantId: number;
  emailID: string;
  userName: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNo: string;
  address: string;
  mode: string;
  roleID: number;
  userId: number;
  roleName: string;
  isServiceEnabled:boolean;
}
