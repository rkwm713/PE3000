export interface PoleData {
  stationId: string;
  existingLoading: number;
  finalLoading: number;
  description?: string;
}

export type FileProcessorFunction = (file: File) => Promise<PoleData[]>;