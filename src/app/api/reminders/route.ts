import { collectionRoute } from "@/server/crud";
import { remindersConfig } from "@/server/resources";

export const { GET, POST } = collectionRoute(remindersConfig);
