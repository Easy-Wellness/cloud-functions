// Fix ESLint issue: https://github.com/microsoft/vscode-eslint/issues/1086
import { initializeApp } from "firebase-admin";
import { region } from "firebase-functions";
import { isDeepStrictEqual } from "util";
import { WriteResult } from "../node_modules/firebase-admin/lib/firestore";
import { PlaceModel } from "./place";
import { ServiceModel } from "./service";

initializeApp();

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
    const serviceListSnapshot = await change.after.ref
      .collection("services")
      .orderBy("service_name", "asc")
      .get();
    if (serviceListSnapshot.empty) return null;
    return await Promise.all<WriteResult>(
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
  });
