import { GeoPositionModel } from "./geo_position";

export interface PlaceModel {
  name: string;
  phone_number: string;
  address: string;
  geo_position: GeoPositionModel;
}
