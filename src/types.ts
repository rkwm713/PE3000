export interface PoleData {
  stationId: string;
  existingLoading: number;
  finalLoading: number;
  description?: string;
}

export type FileProcessorFunction = (file: File) => Promise<PoleData[]>;

export type UserName = 'Riley' | 'Landon' | 'Andrea' | 'Caylor' | 'Jeremey' | 'Kaylee';

export const USERS: UserName[] = ['Riley', 'Landon', 'Andrea', 'Caylor', 'Jeremey', 'Kaylee'];

export interface UserData {
  poleData: PoleData[];
  lastUpdated: string;
}

export interface UserStorage {
  selectedUser: UserName;
  userData: {
    [username in UserName]?: UserData;
  };
}
