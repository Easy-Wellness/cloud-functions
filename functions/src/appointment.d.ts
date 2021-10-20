export interface AppointmentModel {
  place_id: string;
  place_name: string;
  /**
   * The address of the place that provides the service
   */
  address: string;
  service_id: string;
  service_name: string;
}
