import { collectionRoute } from "@/server/crud";
import { bidsConfig } from "@/server/resources";

export const { GET, POST } = collectionRoute(bidsConfig);
