import { collectionRoute } from "@/server/crud";
import { quotesConfig } from "@/server/resources";

export const { GET, POST } = collectionRoute(quotesConfig);
