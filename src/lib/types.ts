
import { Timestamp } from "firebase/firestore";

export interface Accessory {
  id: string;
  accessoryType: string;
  models: string[];
  contributor: {
    uid: string;
    name: string;
    points: number;
  };
  lastUpdated: Timestamp | string;
  source: string;
}
