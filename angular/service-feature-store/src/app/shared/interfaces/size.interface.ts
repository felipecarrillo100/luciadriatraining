export interface IMeasurementUnit {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
}

export interface ISizeCalculation {
  size1: { unit: string; size: string; convertedSize: string };
  size2: { unit: string; size: string; convertedSize: string };
  size3: { unit: string; size: string; convertedSize: string };
  cubicCalc: boolean;
  squareCalc: boolean;
  lengthCalc: boolean;
}
