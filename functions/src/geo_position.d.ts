import { GeoPoint } from "firebase-admin/firestore";

export interface GeoPositionModel {
  geohash: string;
  geopoint: GeoPoint;
}
