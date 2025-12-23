
import { Timestamp } from "firebase/firestore";

export interface ModelContribution {
  name: string;
  contributorUid: string;
}

export interface Accessory {
  id: string;
  accessoryType: string;
  models: ModelContribution[];
  contributor: {
    uid: string;
    name: string;
    points: number;
    socialMediaLink?: string;
  };
  lastUpdated: Timestamp | string;
  source: string;
}
