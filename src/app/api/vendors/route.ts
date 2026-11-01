import { collectionRoute } from "@/server/crud";
import { vendorsConfig } from "@/server/resources";

export const { GET, POST } = collectionRoute(vendorsConfig);
