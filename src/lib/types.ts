
import { Timestamp } from "firebase/firestore";

export interface Accessory {
  id: string;
  primaryModel: string;
  accessoryType: string;
  compatibleModels: string[];
  brand: string;
  contributor: {
    name: string;
    points: number;
  };
  lastUpdated: Timestamp | string;
  source: string;
}
