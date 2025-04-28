export interface IUser {
  id: string;
  name: string;
  surname: string;
  joined: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ICurrentUserInfo extends IUserFullName {
  id: string;
  email: string;
}

export interface IUserFullName {
  name: string;
  surname: string;
}

export interface IUserPermissions {
  can_manage_asset: boolean;
  can_manage_part_meta_data: boolean;
  can_manage_members: boolean;
  can_manage_dates: boolean;
  can_manage_own_files: boolean;
  can_manage_files_of_others: boolean;
  can_manage_stationings: boolean;
  can_manage_inspections: boolean;
}
