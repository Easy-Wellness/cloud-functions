// Fix ESLint issue: https://github.com/microsoft/vscode-eslint/issues/1086
import admin, { firestore } from "firebase-admin";
import { region } from "firebase-functions";
import { isDeepStrictEqual } from "util";
import { AppointmentModel } from "./appointment";
import { PlaceModel } from "./place";
import { ServiceModel } from "./service";

admin.initializeApp();

const defaultRegion = "asia-southeast1";

export const onPlaceDetailUpdate = region(defaultRegion)
  .firestore.document("places/{placeId}")
  .onUpdate(async (change, context) => {
    if (change.before.isEqual(change.after)) return null;
    const newPlaceData = change.after.data() as PlaceModel;
    const oldPlaceData = change.before.data() as PlaceModel;
    if (
      newPlaceData.name === oldPlaceData.name &&
      newPlaceData.address === oldPlaceData.address &&
      isDeepStrictEqual(newPlaceData.geo_position, oldPlaceData.geo_position)
    )
      return null;
    const [serviceListSnapshot, apptListSnapshot] = await Promise.all<
      firestore.QuerySnapshot<firestore.DocumentData>
    >([
      change.after.ref.collection("services").get(),
      change.after.ref.collection("appointments").get(),
    ]);
    const updateServicesAsync = Promise.all<FirebaseFirestore.WriteResult>(
      serviceListSnapshot.docs.map((serviceSnapshot) => {
        const serviceData = serviceSnapshot.data() as ServiceModel;
        const newServiceData: ServiceModel = {
          service_name: serviceData.service_name,
          rating: serviceData.rating,
          ratings_total: serviceData.ratings_total,
          place_name: newPlaceData.name,
          address: newPlaceData.address,
          geo_position: newPlaceData.geo_position,
        };
        return serviceSnapshot.ref.update(newServiceData);
      })
    );
    const updateApptsAsync = Promise.all<FirebaseFirestore.WriteResult>(
      apptListSnapshot.docs.map((apptSnapshot) => {
        const apptData = apptSnapshot.data() as AppointmentModel;
        const newApptData: AppointmentModel = {
          place_id: apptData.place_id,
          place_name: newPlaceData.name,
          address: newPlaceData.address,
          service_id: apptData.service_id,
          service_name: apptData.service_name,
        };
        return apptSnapshot.ref.update(newApptData);
      })
    );
    return await Promise.all<firestore.WriteResult[]>([
      updateServicesAsync,
      updateApptsAsync,
    ]);
  });

export const onServiceUpdate = region(defaultRegion)
  .firestore.document("places/{placeId}/services/{serviceId}")
  .onUpdate(async (change, context) => {
    if (change.before.isEqual(change.after)) return null;
    const serviceId = context.params["serviceId"];
    const newServiceData = change.after.data() as ServiceModel;
    const oldServiceData = change.before.data() as ServiceModel;
    const db = firestore();
    if (newServiceData.service_name === oldServiceData.service_name)
      return null;
    const apptListSnapshot = await db
      .collectionGroup("appointments")
      .where("service_id", "==", serviceId)
      .get();
    return await Promise.all<firestore.WriteResult>(
      apptListSnapshot.docs.map((apptSnapshot) =>
        apptSnapshot.ref.update({ service_name: newServiceData.service_name })
      )
    );
  });
