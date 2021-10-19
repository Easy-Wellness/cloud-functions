import { GeoPositionModel } from "./geo_position";

export interface ServiceModel {
  service_name: string;
  place_name: string;
  address: string;
  geo_position: GeoPositionModel;
  rating: number;
  /**
   * The number of reviews for this rating
   */
  ratings_total: number;
}
